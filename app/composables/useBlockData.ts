import { ref, watch, computed, inject } from 'vue'
import { fetchBlockData, fetchPublicBlockData } from '@/api/studio'
import type { StudioBlock, BlockFilter, BlockQueryResult, BlockAggregate } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'
import { getErrorMessage } from '@/lib/http-errors'
import { interpolateTokens } from '@/lib/studio-tokens'
import { primarySourceId } from '@/lib/studio-columns'
import { STUDIO_EMBED_CONTEXT, type StudioEmbedContext } from '@/composables/studioEmbedContext'

export interface BlockDataOverrides {
  /** Tri interactif (clic sur un en-tête de tableau) — remplace `config.sortColumn`. */
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc' | null
  /** Pagination serveur. */
  offset?: number
  limit?: number
}

/** dataset (URL) + sources + jointures d'un bloc, pour un appel `fetchBlockData`. */
export function blockSourceParams(block: StudioBlock) {
  const primary = primarySourceId(block)
  const sources = block.sources?.length
    ? block.sources
    : block.datasetId
      ? [{ id: block.datasetId, datasetId: block.datasetId }]
      : []
  const urlDatasetId = sources.find((s) => s.id === primary)?.datasetId ?? sources[0]?.datasetId ?? block.datasetId
  return {
    urlDatasetId,
    sources,
    primarySourceId: primary,
    joins: block.joins ?? [],
  }
}

/** Clé de ligne réelle pour une référence de colonne (nue ou `col@<sourceId>`). */
export function rowKey(result: BlockQueryResult | null, ref: string): string {
  return result?.columnMap?.[ref] ?? ref
}

/**
 * Résout les filtres d'un bloc pour un appel API : interpole les jetons (`{{param}}`,
 * variable de boucle) et écarte les filtres dont un jeton reste non résolu (plutôt
 * que de renvoyer 0 ligne). `tokenMap` = `pageParams` + scope éventuel.
 */
export function resolveBlockFilters(filters: BlockFilter[], tokenMap: Record<string, string>): BlockFilter[] {
  return filters
    .filter((f) => f.column && f.value)
    .map((f) => ({ ...f, value: interpolateTokens(f.value, tokenMap) }))
    .filter((f) => !/\{\{.+\}\}/.test(f.value))
}

export function useBlockData(
  block: () => StudioBlock | null,
  readonly = false,
  scope?: () => Record<string, string> | undefined,
  overrides?: () => BlockDataOverrides | undefined,
) {
  const studio = useStudioStore()
  const embed = inject<StudioEmbedContext | null>(STUDIO_EMBED_CONTEXT, null)

  const data = ref<BlockQueryResult | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const canFetch = computed(() => {
    const b = block()
    return b != null && (b.sources?.some((s) => s.datasetId) || b.datasetId != null)
  })

  function resolveFilters(filters: BlockFilter[]): BlockFilter[] {
    // scope (variable de boucle) prioritaire sur les paramètres de page
    return resolveBlockFilters(filters, { ...studio.pageParams, ...scope?.() })
  }

  async function load() {
    const b = block()
    const sp = b ? blockSourceParams(b) : null
    if (!b || !sp?.urlDatasetId) {
      data.value = null
      return
    }

    // Valeurs résolues par expression d'agrégat (useResolvedTokens), pas par une requête
    // de lignes : camembert « segments », KPI à valeur combinée, KPI « expression avancée ».
    if (
      (b.type === 'pie' && b.config.pieMode === 'segments')
      || (b.type === 'kpi' && (b.fieldMapping.kpiValue?.length || b.config.valueExpression))
    ) {
      data.value = null
      return
    }

    const ov = overrides?.() ?? {}
    const columns = resolveColumns(b)
    const groupLimit = b.config.rowLimit ?? 500
    // When series grouping is active, each X-group produces N rows (one per series value).
    // Fetch up to 5000 rows so the chart can slice to groupLimit unique X labels.
    const fetchLimit = b.fieldMapping.series ? Math.min(groupLimit * 100, 5000) : (ov.limit ?? groupLimit)
    const aggregationParams = resolveAggregationParams(b)
    const params = {
      columns,
      limit: fetchLimit,
      offset: ov.offset || undefined,
      // "Distinct" (dédoublonnage par colonne) et l'agrégation ne se combinent jamais — les deux
      // réglages peuvent coexister dans block.config sans rapport l'un avec l'autre (ex. l'un
      // laissé d'un essai précédent), donc on ignore distinctColumn dès qu'une agrégation est active
      // plutôt que d'envoyer une combinaison que le backend rejette de toute façon.
      distinctColumn: aggregationParams.aggregates ? undefined : (b.config.distinctColumn ?? undefined),
      sortColumn: (ov.sortColumn ?? b.config.sortColumn) ?? undefined,
      sortDirection: (ov.sortColumn !== undefined && ov.sortColumn !== null ? ov.sortDirection : b.config.sortDirection) ?? undefined,
      filters: resolveFilters(b.filters ?? []),
      sources: sp.sources,
      primarySourceId: sp.primarySourceId,
      joins: sp.joins,
      calcColumns: b.fieldMapping.calcColumns?.length ? b.fieldMapping.calcColumns : undefined,
      ...aggregationParams,
    }

    isLoading.value = true
    error.value = null
    try {
      // Bloc réutilisé dans un article : les données viennent du Statsdata source.
      const docSlug = embed?.docSlug ?? studio.content?.slug
      data.value = readonly && docSlug
        ? await fetchPublicBlockData(docSlug, sp.urlDatasetId, params)
        : await fetchBlockData(sp.urlDatasetId, params)
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Impossible de charger les données.')
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Reload when block configuration, filters, or page params change
  watch(
    (): string | null => {
      const b = block()
      return b
        ? `${b.datasetId}|${JSON.stringify(b.sources ?? [])}|${b.primarySourceId ?? ''}|${JSON.stringify(b.fieldMapping)}|${JSON.stringify(b.filters ?? [])}|${JSON.stringify(b.joins ?? [])}|${JSON.stringify(studio.pageParams)}|${JSON.stringify(scope?.() ?? null)}|${b.config.rowLimit ?? ''}|${b.config.distinctColumn ?? ''}|${b.config.sortColumn ?? ''}|${b.config.sortDirection ?? ''}|${JSON.stringify(overrides?.() ?? null)}`
        : null
    },
    (key, prev) => {
      if (key && key !== prev) load()
    },
    { immediate: true },
  )

  return { data, isLoading, error, canFetch, reload: load }
}

/**
 * Derives the aggregation query params from a block's type + fieldMapping.
 * Shared by the main fetch above and by KpiBlock's comparison fetch, so both
 * the primary value and the comparison value use the exact same aggregation.
 */
export function resolveAggregationParams(block: StudioBlock): { aggregates?: BlockAggregate[]; groupBy?: string[] } {
  const m = block.fieldMapping
  // Fonction par colonne : `aggregates[]` ; fallback legacy : `aggregate` unique.
  const fnFor = (col: string): BlockAggregate['fn'] | undefined =>
    m.aggregates?.find((a) => a.column === col)?.fn ?? m.aggregate
  const specs = (cols: string[]): BlockAggregate[] =>
    cols.map((c) => ({ column: c, fn: fnFor(c) })).filter((a): a is BlockAggregate => Boolean(a.fn))

  if (!m.aggregate && !m.aggregates?.length) return {}

  if (block.type === 'kpi') {
    if (!m.valueColumn) return {}
    const s = specs([m.valueColumn])
    return s.length ? { aggregates: s, groupBy: [] } : {}
  }
  if (block.type === 'pie') {
    if (!m.value) return {}
    const s = specs([m.value])
    return s.length ? { aggregates: s, groupBy: m.label ? [m.label] : [] } : {}
  }
  if (block.type === 'bar' || block.type === 'line') {
    const yCols = m.yAxes?.length ? m.yAxes : (m.yAxis ? [m.yAxis] : [])
    const s = specs(yCols)
    if (!s.length) return {}
    const groupBy = [m.xAxis, m.series].filter((c): c is string => Boolean(c))
    return { aggregates: s, groupBy }
  }
  return {}
}

// resolveColumns is module-level since it doesn't need store access
function resolveColumns(block: StudioBlock): string[] {
  const m = block.fieldMapping
  const cols = new Set<string>()

  if (m.xAxis) cols.add(m.xAxis)
  if (m.yAxes?.length) m.yAxes.forEach((c) => cols.add(c))
  else if (m.yAxis) cols.add(m.yAxis)
  if (m.series) cols.add(m.series)
  if (m.label) cols.add(m.label)
  if (m.value) cols.add(m.value)
  if (m.valueColumn) cols.add(m.valueColumn)
  if (m.comparisonColumn) cols.add(m.comparisonColumn)
  if (m.columns) m.columns.forEach((c) => cols.add(c))

  return cols.size > 0 ? Array.from(cols) : []
}
