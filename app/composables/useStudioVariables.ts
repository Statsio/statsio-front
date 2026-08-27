import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { BlockJoin, DatasetColumn, SearchSource, StudioDocumentPage } from '@/types/studio'

export interface VariableItem {
  /** Bare name, e.g. "region" — wrap in {{ }} at insert time. */
  name: string
  hint: string
}

export interface VariableGroup {
  key: string
  name: string
  meta: string
  iconText: string
  iconBg: string
  iconFg: string
  items: VariableItem[]
}

/**
 * Variables disponibles pour une page : le paramètre d'une page template + les
 * colonnes des datasets rattachés par un bloc Recherche ciblant cette page.
 * Source unique de vérité pour `VariablePickerModal` (remplace la logique
 * dupliquée dans ColumnPickerModal / l'ancien SidebarVariables).
 */
export function useStudioVariables(pageIdRef?: MaybeRefOrGetter<string | undefined>) {
  const studio = useStudioStore()
  const datasets = useStudioDatasetsStore()

  const pageId = computed(() => toValue(pageIdRef) ?? studio.currentPageId)
  const page = computed<StudioDocumentPage | undefined>(() =>
    studio.pages.find((p: StudioDocumentPage) => p.id === pageId.value),
  )

  const dsName = (id: string, fallback: string) =>
    datasets.readyDatasets.find((d) => d.id === id)?.name ?? fallback

  // Charge les schémas des datasets référencés par les blocs de recherche.
  watch(
    pageId,
    () => {
      for (const block of studio.blocks) {
        if (block.type !== 'search' || block.fieldMapping.targetPageId !== pageId.value) continue
        for (const src of (block.fieldMapping.searchSources ?? []) as SearchSource[]) {
          if (src.datasetId) datasets.loadSchema(src.datasetId)
        }
        for (const join of (block.joins ?? []) as BlockJoin[]) {
          if (join.datasetId) datasets.loadSchema(join.datasetId)
        }
      }
    },
    { immediate: true },
  )

  const groups = computed<VariableGroup[]>(() => {
    const out: VariableGroup[] = []

    if (page.value?.isTemplate && page.value.paramName) {
      out.push({
        key: 'param',
        name: 'Paramètre de la page',
        meta: 'valeur du lien sélectionné',
        iconText: 'PRM',
        iconBg: '#f2ecfd',
        iconFg: '#7c3aed',
        items: [{ name: page.value.paramName, hint: 'paramètre' }],
      })
    }

    const seen = new Set<string>()
    for (const block of studio.blocks) {
      if (block.type !== 'search' || block.fieldMapping.targetPageId !== pageId.value) continue

      for (const src of (block.fieldMapping.searchSources ?? []) as SearchSource[]) {
        if (!src.datasetId || seen.has(src.datasetId)) continue
        seen.add(src.datasetId)
        const schema = datasets.getSchema(src.datasetId)
        const cols = schema ? schema.columns.map((c: DatasetColumn) => c.name) : src.columns
        if (!cols.length) continue
        out.push(dataGroup(src.datasetId, dsName(src.datasetId, 'Source principale'), cols))
      }

      for (const join of (block.joins ?? []) as BlockJoin[]) {
        if (!join.datasetId || seen.has(join.datasetId)) continue
        seen.add(join.datasetId)
        const schema = datasets.getSchema(join.datasetId)
        if (!schema) continue
        out.push(
          dataGroup(
            join.datasetId,
            `Jointure — ${dsName(join.datasetId, 'source')}`,
            schema.columns.map((c: DatasetColumn) => c.name),
          ),
        )
      }
    }

    return out
  })

  function dataGroup(id: string, name: string, cols: string[]): VariableGroup {
    const meta = datasets.datasets.find((d) => d.id === id)
    return {
      key: `ds:${id}`,
      name,
      meta: meta ? `${meta.rowCount} lignes` : 'colonnes',
      iconText: 'COL',
      iconBg: '#eaf1fe',
      iconFg: '#2563eb',
      items: cols.map((c) => ({ name: c, hint: 'colonne' })),
    }
  }

  function filteredGroups(query: string): VariableGroup[] {
    const q = query.trim().toLowerCase()
    if (!q) return groups.value
    return groups.value
      .map((g) => ({ ...g, items: g.items.filter((it) => it.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }

  const isEmpty = computed(() => groups.value.length === 0)

  return { groups, filteredGroups, isEmpty }
}
