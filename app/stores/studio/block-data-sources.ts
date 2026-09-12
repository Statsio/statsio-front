import type { Ref } from 'vue'
import type { BlockSource, SectionLayout, StudioBlock } from '@/types/studio'
import { scriptIdFromZone, scriptZoneId, scriptZoneBranch } from '@/types/studio'
import { pruneBlockColumnRefs } from '@/lib/studio-block-sources'
import { getColCount } from '@/stores/studio/canvas'

export function useStudioBlockDataSources(deps: {
  blocks: Ref<StudioBlock[]>
  syncAutoPageParam: (blockId: string) => void
  snapshot: () => void
  markDirty: () => void
}) {
  const { blocks, syncAutoPageParam, snapshot, markDirty } = deps

  /** Change l'agencement en colonnes d'un bloc « Disposition » — réaffecte les blocs des colonnes retirées vers la dernière colonne restante. */
  function changeBlockLayout(blockId: string, layoutType: SectionLayout) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'layout') return
    snapshot()
    const newCols = getColCount(layoutType)
    blocks.value = blocks.value.map((b: StudioBlock) => {
      if (scriptIdFromZone(b.zoneId) !== blockId) return b
      const colIdx = scriptZoneBranch(b.zoneId)
      const safeIdx = Math.min(colIdx, newCols - 1)
      return { ...b, zoneId: scriptZoneId(blockId, safeIdx) }
    })
    block.config = { ...block.config, layoutType }
    markDirty()
  }

  /**
   * Compat : « choisir une source unique ». Remplace toutes les sources du bloc
   * par un seul dataset et purge les refs de colonnes devenues invalides.
   */
  function updateBlockDataset(blockId: string, datasetId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    if (block.sources?.length === 1 && block.sources[0]?.datasetId === datasetId) return
    block.datasetId = datasetId
    block.sources = [{ id: datasetId, datasetId }]
    block.primarySourceId = datasetId
    block.joins = []
    pruneBlockColumnRefs(block)
    syncAutoPageParam(blockId)
    markDirty()
  }

  function updateBlockSources(blockId: string, sources: BlockSource[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.sources = sources
    if (!block.primarySourceId || !sources.some((s) => s.id === block.primarySourceId)) {
      block.primarySourceId = sources[0]?.id
    }
    block.datasetId = sources.find((s) => s.id === block.primarySourceId)?.datasetId ?? sources[0]?.datasetId
    block.joins = (block.joins ?? []).filter(
      (j) => sources.some((s) => s.id === j.leftSourceId) && sources.some((s) => s.id === j.rightSourceId),
    )
    pruneBlockColumnRefs(block)
    syncAutoPageParam(blockId)
    markDirty()
  }

  function addBlockSource(blockId: string, datasetId: string): string | undefined {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    const existing = block.sources ?? []
    let id = datasetId
    let n = 2
    while (existing.some((s) => s.id === id)) id = `${datasetId}~${n++}`
    block.sources = [...existing, { id, datasetId }]
    if (!block.primarySourceId) block.primarySourceId = id
    block.datasetId ??= datasetId
    syncAutoPageParam(blockId)
    markDirty()
    return id
  }

  function removeBlockSource(blockId: string, sourceId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block?.sources) return
    block.sources = block.sources.filter((s) => s.id !== sourceId)
    block.joins = (block.joins ?? []).filter((j) => j.leftSourceId !== sourceId && j.rightSourceId !== sourceId)
    if (block.primarySourceId === sourceId) block.primarySourceId = block.sources[0]?.id
    block.datasetId = block.sources.find((s) => s.id === block.primarySourceId)?.datasetId ?? block.sources[0]?.datasetId
    pruneBlockColumnRefs(block)
    syncAutoPageParam(blockId)
    markDirty()
  }

  function setPrimarySource(blockId: string, sourceId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block?.sources?.some((s) => s.id === sourceId)) return
    block.primarySourceId = sourceId
    block.datasetId = block.sources.find((s) => s.id === sourceId)?.datasetId
    pruneBlockColumnRefs(block)
    syncAutoPageParam(blockId)
    markDirty()
  }

  // ─── Purge dataset ──────────────────────────────────────────────────────────

  /**
   * Une source (dataset) a été supprimée du document : on la retire de la
   * configuration de TOUS les blocs — entrée `sources`, jointures, et toutes les
   * refs de colonnes qui en dépendaient (refs `col@<id>` de cette source + refs
   * nues quand c'était la source primaire du bloc). Un bloc qui perd sa dernière
   * source est remis à zéro côté données (il reste sur le canevas, à reconfigurer).
   */
  function purgeDataset(datasetId: string) {
    const affected = blocks.value.filter(
      (b: StudioBlock) =>
        (b.sources ?? []).some((s) => s.datasetId === datasetId) ||
        ((b.sources ?? []).length === 0 && b.datasetId === datasetId),
    )
    if (affected.length === 0) return
    snapshot()
    for (const block of affected) {
      const sources = block.sources ?? []
      const deadIds = new Set(sources.filter((s) => s.datasetId === datasetId).map((s) => s.id))
      const primaryId = block.primarySourceId ?? sources[0]?.id
      const primaryDead = sources.length === 0 || (primaryId != null && deadIds.has(primaryId))

      block.sources = sources.filter((s) => !deadIds.has(s.id))
      block.joins = (block.joins ?? []).filter(
        (j) => !deadIds.has(j.leftSourceId) && !deadIds.has(j.rightSourceId),
      )

      if (block.sources.length === 0) {
        block.datasetId = undefined
        block.primarySourceId = undefined
        block.joins = []
      } else if (primaryDead) {
        block.primarySourceId = block.sources[0]!.id
        block.datasetId = block.sources[0]!.datasetId
      } else {
        block.datasetId =
          block.sources.find((s) => s.id === block.primarySourceId)?.datasetId ?? block.sources[0]!.datasetId
      }

      pruneBlockColumnRefs(block, primaryDead)
      syncAutoPageParam(block.id)
    }
    markDirty()
  }

  return {
    changeBlockLayout,
    updateBlockDataset,
    updateBlockSources,
    addBlockSource,
    removeBlockSource,
    setPrimarySource,
    purgeDataset,
  }
}
