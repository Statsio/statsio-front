import type { BlockJoin, BlockSource, PageParam, ResultPart, StudioBlock } from '@/types/studio'
import { makeColumnRef, parseColumnRef } from '@/lib/studio-columns'

/**
 * Migration & helpers du bloc « Recherche ».
 *
 * Depuis la refonte, le bloc recherche est un bloc multi-sources ordinaire
 * (`block.sources` / `block.joins` / `block.primarySourceId`) comme les blocs
 * graphique. Les colonnes recherchées vivent dans `fieldMapping.searchColumns`
 * (réfs qualifiées), l'affichage des résultats dans `resultTitleParts` /
 * `resultDescParts`, et le paramètre point-barre est auto-déclaré par
 * `studio.syncSearchPageParam` (voir {@link desiredSearchPageParam}).
 *
 * Ce module ne dépend d'aucun store — testable en isolation.
 */

/** Noms de colonnes nus (sans le suffixe `@sourceId`) d'une liste de réfs. */
export function bareNames(refs: readonly string[] | undefined): string[] {
  return (refs ?? []).map((r) => parseColumnRef(r).name).filter(Boolean)
}

/** Dataset de la source primaire d'un bloc. */
export function datasetOfPrimarySource(block: StudioBlock): string | undefined {
  const primary = block.primarySourceId ?? block.sources?.[0]?.id
  return block.sources?.find((s) => s.id === primary)?.datasetId ?? block.datasetId
}

/** Réfs (qualifiées) des colonnes recherchées appartenant à une source donnée. */
export function searchColumnsForSource(block: StudioBlock, sourceId: string): string[] {
  const primary = block.primarySourceId ?? block.sources?.[0]?.id
  return (block.fieldMapping.searchColumns ?? []).filter((ref) => {
    const { sourceId: sid } = parseColumnRef(ref)
    return (sid ?? primary) === sourceId
  })
}

/**
 * Nom du paramètre point-barre auto-déclaré : `q`, ou `q_<id>` si `q` est déjà
 * pris par un vrai paramètre / une colonne de la page.
 */
export function autoParamName(blockId: string, reserved: Iterable<string> = []): string {
  const taken = new Set(reserved)
  if (!taken.has('q')) return 'q'
  return `q_${blockId.slice(0, 6)}`
}

/**
 * Le `PageParam` que le bloc recherche doit maintenir sur sa page (fan-out
 * toujours actif, invisible). `null` si le bloc n'a aucune colonne recherchée.
 */
export function desiredSearchPageParam(
  block: StudioBlock,
  opts: { existingName?: string; reserved?: Iterable<string> } = {},
): PageParam | null {
  const columns = bareNames(block.fieldMapping.searchColumns)
  if (!columns.length) return null
  const datasetId = datasetOfPrimarySource(block)
  const name = opts.existingName || autoParamName(block.id, opts.reserved)
  return {
    name,
    columns,
    datasetId,
    fanOut: true,
    hidden: true,
    searchBlockId: block.id,
    slugColumn: columns[0],
    column: columns[0],
  }
}

/** Deux `PageParam` search sont-ils structurellement équivalents ? (évite les mutations inutiles) */
export function sameSearchPageParam(a: PageParam | undefined, b: PageParam | null): boolean {
  if (!a || !b) return a == null && b == null
  return (
    a.name === b.name &&
    a.datasetId === b.datasetId &&
    Boolean(a.fanOut) === Boolean(b.fanOut) &&
    Boolean(a.hidden) === Boolean(b.hidden) &&
    a.searchBlockId === b.searchBlockId &&
    JSON.stringify(a.columns ?? []) === JSON.stringify(b.columns ?? [])
  )
}

// ─── Migration legacy → modèle graphe ────────────────────────────────────────

interface LegacySearchSource {
  datasetId: string
  columns: string[]
}
interface LegacySearchJoin {
  sourceDatasetId?: string
  datasetId: string
  leftColumn: string
  rightColumn: string
  columns?: string[]
  type?: 'inner' | 'left'
}

function qualifyLegacyRef(
  name: string | undefined,
  colToSource: Map<string, string>,
  primaryId: string,
): string | undefined {
  if (!name) return undefined
  if (name.includes('@')) return name
  return makeColumnRef(name, colToSource.get(name) ?? primaryId, primaryId)
}

/**
 * Rend un bloc recherche conforme au modèle graphe. Idempotent.
 *  - `searchSources[0]` (ou legacy `datasetId` + `searchColumn`) → source primaire ;
 *  - `searchJoins[]` → `block.joins[]` (+ une source par dataset joint) ;
 *  - `searchSources[1..]` (union sans lien) → ignorées avec un `console.warn` ;
 *  - `searchSources[].columns` + `searchJoins[].columns` → `fieldMapping.searchColumns` (qualifiées) ;
 *  - `resultTitleColumn` / `resultDescColumns` → `resultTitleParts` / `resultDescParts` ;
 *  - purge des clés obsolètes (`targetPageId`, `urlParams`, `paramColumn`, `searchAsParam`…).
 */
export function migrateSearchBlock(block: StudioBlock): StudioBlock {
  const fm = block.fieldMapping
  const legacySources = (fm.searchSources ?? []) as LegacySearchSource[]
  const legacyJoins = (fm.searchJoins ?? []) as LegacySearchJoin[]
  const alreadyGraph = Boolean(block.sources?.length)

  // ── Sources / jointures ──────────────────────────────────────────────────
  let sources: BlockSource[]
  let joins: BlockJoin[]
  const colToSource = new Map<string, string>()

  if (alreadyGraph && !legacySources.length && !legacyJoins.length) {
    sources = block.sources!
    joins = block.joins ?? []
  } else {
    const primaryDatasetId = legacySources[0]?.datasetId || block.datasetId || ''
    if (!primaryDatasetId) {
      // Bloc recherche jamais configuré — rien à migrer.
      return stripLegacyKeys({ ...block, fieldMapping: migrateDisplay(fm, new Map(), '') })
    }
    const primaryId = primaryDatasetId
    sources = [{ id: primaryId, datasetId: primaryDatasetId }]
    joins = []

    const sourceIdFor = (datasetId: string): string => {
      const hit = sources.find((s) => s.datasetId === datasetId)
      if (hit) return hit.id
      let id = datasetId
      let n = 2
      while (sources.some((s) => s.id === id)) id = `${datasetId}~${n++}`
      sources.push({ id, datasetId })
      return id
    }

    for (const j of legacyJoins) {
      if (!j.datasetId) continue
      const rightId = sourceIdFor(j.datasetId)
      joins.push({
        leftSourceId: primaryId,
        leftColumn: j.leftColumn ?? '',
        rightSourceId: rightId,
        rightColumn: j.rightColumn ?? '',
        type: j.type === 'inner' ? 'inner' : 'left',
      })
      for (const c of j.columns ?? []) colToSource.set(c, rightId)
    }

    if (legacySources.length > 1) {
      console.warn(
        `[studio] bloc recherche ${block.id} : ${legacySources.length - 1} source(s) ` +
          'de recherche additionnelle(s) ignorée(s) — le modèle graphe ne supporte ' +
          "qu'une source primaire + jointures. Créez un second bloc recherche si besoin.",
      )
    }

    // Réfs qualifiées des colonnes recherchées.
    const searchRefs: string[] = []
    for (const c of legacySources[0]?.columns ?? []) searchRefs.push(makeColumnRef(c, primaryId, primaryId))
    for (const j of legacyJoins) {
      const rightId = sources.find((s) => s.datasetId === j.datasetId)?.id ?? j.datasetId
      for (const c of j.columns ?? []) searchRefs.push(makeColumnRef(c, rightId, primaryId))
    }
    const legacySearchCol = !legacySources.length && fm.searchColumn ? [fm.searchColumn] : []
    for (const c of legacySearchCol) searchRefs.push(makeColumnRef(c, primaryId, primaryId))

    const primaryIdFinal = primaryId
    const nextFm = migrateDisplay(
      { ...fm, searchColumns: fm.searchColumns ?? dedupe(searchRefs) },
      colToSource,
      primaryIdFinal,
    )
    return stripLegacyKeys({
      ...block,
      datasetId: primaryDatasetId,
      sources,
      primarySourceId: block.primarySourceId && sources.some((s) => s.id === block.primarySourceId)
        ? block.primarySourceId
        : primaryId,
      joins,
      fieldMapping: nextFm,
    })
  }

  // Déjà au modèle graphe : normalise juste le primaire + l'affichage.
  const primary = block.primarySourceId && sources.some((s) => s.id === block.primarySourceId)
    ? block.primarySourceId
    : sources[0]!.id
  return stripLegacyKeys({
    ...block,
    sources,
    primarySourceId: primary,
    joins,
    fieldMapping: migrateDisplay(fm, colToSource, primary),
  })
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}

function migrateDisplay(
  fm: StudioBlock['fieldMapping'],
  colToSource: Map<string, string>,
  primaryId: string,
): StudioBlock['fieldMapping'] {
  const next = { ...fm }

  if (!next.resultTitleParts && fm.resultTitleColumn) {
    const ref = qualifyLegacyRef(fm.resultTitleColumn, colToSource, primaryId)
    if (ref) next.resultTitleParts = [{ ref }]
  }
  if (!next.resultDescParts && fm.resultDescColumns?.length) {
    const labels = fm.resultDescColumnLabels ?? {}
    next.resultDescParts = fm.resultDescColumns
      .map((c): ResultPart | null => {
        const ref = qualifyLegacyRef(c, colToSource, primaryId)
        return ref ? { ref, ...(labels[c] ? { label: labels[c] } : {}) } : null
      })
      .filter((p): p is ResultPart => p !== null)
  }

  // Requalifie searchColumns / searchAltColumns si fournies en noms nus.
  if (next.searchColumns?.length) {
    next.searchColumns = dedupe(
      next.searchColumns.map((ref) => qualifyLegacyRef(ref, colToSource, primaryId) ?? ref),
    )
  }
  if (next.searchAltColumns?.length) {
    next.searchAltColumns = dedupe(
      next.searchAltColumns.map((ref) => qualifyLegacyRef(ref, colToSource, primaryId) ?? ref),
    )
  }

  return next
}

function stripLegacyKeys(block: StudioBlock): StudioBlock {
  const fm = { ...block.fieldMapping }
  delete fm.searchSources
  delete fm.searchJoins
  delete fm.searchColumn
  delete fm.targetPageId
  delete fm.urlParams
  delete fm.urlParamMapping
  delete fm.paramColumn
  delete fm.paramName
  delete fm.resultTitleColumn
  delete fm.resultDescColumns
  delete fm.resultDescColumnLabels

  const config = { ...block.config }
  delete config.searchAsParam
  delete (config as Record<string, unknown>).paramFanOut
  // Le bloc recherche n'affiche pas de titre/description propres (jamais rendus).
  delete config.title
  delete config.description

  return { ...block, fieldMapping: fm, config }
}
