import { effectScope, reactive, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { primarySourceId } from '@/lib/studio-columns'
import { suggestJoinKeys } from '@/lib/studio-block-sources'
import type { BlockJoin, StudioBlock } from '@/types/studio'

export type SourceDrillInStep = 'list' | 'joins'

interface SourceDrillInState {
  open: boolean
  blockId: string | null
  step: SourceDrillInStep
  dsFilter: string
  /** Bloc mono-source (fiche / paramètre / boucle) : pas d'étape jointures, ferme au 1er choix. */
  singleSource: boolean
}

const state = reactive<SourceDrillInState>({
  open: false,
  blockId: null,
  step: 'list',
  dsFilter: '',
  singleSource: false,
})

let watching = false

interface OpenOpts {
  block: StudioBlock
  singleSource?: boolean
}

/**
 * Panneau « drill-in » de sélection des sources d'un bloc (liste des datasets →
 * jointures), jumeau de {@link useColumnDrillIn} / {@link useFilterDrillIn}.
 * Remplace l'ancienne modale `DataSourceWizard`. Singleton : un seul bloc inspecté.
 * Les mutations passent directement par le store (pas de `onCommit`).
 */
export function useSourceDrillIn() {
  const studio = useStudioStore()
  const datasets = useStudioDatasetsStore()

  if (!watching) {
    watching = true
    effectScope(true).run(() => {
      watch(
        () => studio.selectedBlock?.id ?? null,
        (id) => {
          if (state.open && id !== state.blockId) close()
        },
      )
    })
  }

  function currentBlock(): StudioBlock | null {
    return studio.selectedBlock && studio.selectedBlock.id === state.blockId ? studio.selectedBlock : null
  }

  function open(opts: OpenOpts) {
    const multiSources = (opts.block.sources ?? []).length >= 2
    Object.assign(state, {
      open: true,
      blockId: opts.block.id,
      singleSource: !!opts.singleSource,
      dsFilter: '',
      step: multiSources && !opts.singleSource ? 'joins' : 'list',
    })
    datasets.readyDatasets.forEach((d) => datasets.loadSchema(d.id))
    if (state.step === 'joins') ensureJoins()
  }

  function pickDataset(datasetId: string) {
    const block = currentBlock()
    if (!block) return
    datasets.loadSchema(datasetId)

    if (state.singleSource) {
      studio.updateBlockDataset(block.id, datasetId)
      close()
      return
    }

    const existing = (block.sources ?? []).find((s) => s.datasetId === datasetId)
    if (existing) studio.removeBlockSource(block.id, existing.id)
    else studio.addBlockSource(block.id, datasetId)
  }

  function goToJoins() {
    ensureJoins()
    state.step = 'joins'
  }

  function goBack() {
    if (state.step === 'joins') {
      state.step = 'list'
      return
    }
    close()
  }

  function close() {
    state.open = false
    state.blockId = null
    state.step = 'list'
    state.dsFilter = ''
  }

  // ─── Jointures ────────────────────────────────────────────────────────────────

  function schemaColumns(sourceId: string) {
    const block = currentBlock()
    const src = block?.sources?.find((s) => s.id === sourceId)
    return src ? (datasets.getSchema(src.datasetId)?.columns ?? []) : []
  }

  /** Une carte de jointure par source non-principale, créée + pré-remplie si absente. */
  function ensureJoins() {
    const block = currentBlock()
    if (!block) return
    const sources = block.sources ?? []
    const primary = primarySourceId(block)
    const joins = block.joins ?? []
    const next: BlockJoin[] = joins.filter(
      (j) => sources.some((s) => s.id === j.leftSourceId) && sources.some((s) => s.id === j.rightSourceId),
    )
    for (const src of sources) {
      if (src.id === primary) continue
      if (next.some((j) => j.rightSourceId === src.id || j.leftSourceId === src.id)) continue
      const guess = suggestJoinKeys(schemaColumns(primary), schemaColumns(src.id))
      next.push({
        leftSourceId: primary,
        leftColumn: guess?.leftColumn ?? '',
        rightSourceId: src.id,
        rightColumn: guess?.rightColumn ?? '',
        type: 'left',
      })
    }
    if (JSON.stringify(next) !== JSON.stringify(joins)) studio.updateBlockJoins(block.id, next)
  }

  function patchJoin(index: number, patch: Partial<BlockJoin>) {
    const block = currentBlock()
    if (!block) return
    studio.updateBlockJoins(
      block.id,
      (block.joins ?? []).map((j, i) => (i === index ? { ...j, ...patch } : j)),
    )
  }

  function makePrimary(sourceId: string) {
    const block = currentBlock()
    if (!block) return
    studio.setPrimarySource(block.id, sourceId)
    ensureJoins()
  }

  return { state, open, pickDataset, goToJoins, goBack, close, ensureJoins, patchJoin, makePrimary }
}
