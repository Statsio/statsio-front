import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioDocumentPage } from '@/types/studio'
import { blockColumnGroups } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'

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
 * Variables disponibles pour une page : les paramètres déclarés (hors paramètres
 * cachés auto-gérés) + les colonnes des sources d'un bloc Recherche de la page.
 * Source unique de vérité pour `VariablePickerModal`.
 */
export function useStudioVariables(
  pageIdRef?: MaybeRefOrGetter<string | undefined>,
  blockIdRef?: MaybeRefOrGetter<string | undefined>,
) {
  const studio = useStudioStore()
  const datasets = useStudioDatasetsStore()

  const pageId = computed(() => toValue(pageIdRef) ?? studio.currentPageId)
  const blockId = computed(() => toValue(blockIdRef) ?? studio.selectedBlockId ?? undefined)
  const page = computed<StudioDocumentPage | undefined>(() =>
    studio.pages.find((p: StudioDocumentPage) => p.id === pageId.value),
  )

  const searchBlocksOnPage = computed(() =>
    studio.blocks.filter((b) => b.type === 'search' && studio.pageIdOfBlock(b.id) === pageId.value),
  )

  // Charge les schémas des datasets référencés par les blocs de recherche de la page.
  watch(
    [pageId, searchBlocksOnPage],
    () => {
      for (const block of searchBlocksOnPage.value) {
        for (const id of blockDatasetIds(block)) datasets.loadSchema(id)
      }
    },
    { immediate: true },
  )

  const groups = computed<VariableGroup[]>(() => {
    const out: VariableGroup[] = []

    // Variables des blocs boucle englobants (du plus proche au plus lointain).
    if (blockId.value) {
      for (const loop of studio.loopAncestors(blockId.value).filter((b) => b.type === 'loop')) {
        const name = loop.fieldMapping.loopVar || 'item'
        out.push({
          key: `loop:${loop.id}`,
          name: 'Boucle',
          meta: loop.fieldMapping.loopColumn ? `valeur de ${loop.fieldMapping.loopColumn}` : 'valeur courante',
          iconText: '{ }',
          iconBg: '#eef2ff',
          iconFg: '#4f46e5',
          items: [{ name, hint: 'valeur courante de la boucle' }],
        })
      }
    }

    // Paramètres déclarés sur la page (bloc « Paramètre », barre de recherche) —
    // hors paramètres cachés auto-gérés (bloc recherche).
    const paramItems: VariableItem[] = []
    const seenParams = new Set<string>()
    for (const p of page.value?.params ?? []) {
      if (p.hidden || !p.name || seenParams.has(p.name)) continue
      seenParams.add(p.name)
      paramItems.push({ name: p.name, hint: p.column ? `valeurs de ${p.column}` : 'paramètre' })
    }
    if (page.value?.isTemplate && page.value.paramName && !seenParams.has(page.value.paramName)) {
      paramItems.push({ name: page.value.paramName, hint: 'valeur du lien sélectionné' })
    }
    if (paramItems.length) {
      out.push({
        key: 'param',
        name: 'Paramètres de la page',
        meta: 'pilotent tous les blocs',
        iconText: 'PRM',
        iconBg: '#f2ecfd',
        iconFg: '#7c3aed',
        items: paramItems,
      })
    }

    const seen = new Set<string>()
    for (const block of searchBlocksOnPage.value) {
      for (const g of blockColumnGroups(block, datasets)) {
        if (!g.columns.length || seen.has(g.label)) continue
        seen.add(g.label)
        out.push(columnGroup(g.label, g.columns.map((c) => c.name), g.sourceId))
      }
    }

    return out
  })

  function columnGroup(name: string, cols: string[], datasetKey?: string): VariableGroup {
    const meta = datasetKey ? datasets.datasets.find((d) => d.id === datasetKey) : undefined
    return {
      key: `ds:${datasetKey ?? name}`,
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
