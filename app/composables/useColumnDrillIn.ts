import { effectScope, reactive, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, primarySourceId, isCalcRef } from '@/lib/studio-columns'
import { CALC_REF_PREFIX, type CalcColumn, type StudioBlock } from '@/types/studio'

export type ColumnDrillInStep = 'source' | 'column' | 'calc'

interface ColumnDrillInState {
  open: boolean
  blockId: string | null
  step: ColumnDrillInStep
  sourceId: string | null
  skipSource: boolean
  multi: boolean
  allowNone: boolean
  noneLabel: string
  title: string
  selected: string[]
  /** Brouillon de colonne calculée (étape `calc`). */
  calcDraft: CalcColumn | null
}

function calcUid(): string {
  return Math.random().toString(36).slice(2, 9)
}

interface OpenOpts {
  block: StudioBlock
  title: string
  multi?: boolean
  allowNone?: boolean
  noneLabel?: string
  selected?: string[]
  onCommit: (refs: string[]) => void
}

const state = reactive<ColumnDrillInState>({
  open: false,
  blockId: null,
  step: 'source',
  sourceId: null,
  skipSource: false,
  multi: false,
  allowNone: false,
  noneLabel: 'Aucune',
  title: '',
  selected: [],
  calcDraft: null,
})

// Hors de `state` : ne pas rendre une fonction réactive.
let onCommit: ((refs: string[]) => void) | null = null
let watching = false

/**
 * Panneau « drill-in » de sélection d'une colonne (source → colonne), jumeau de
 * {@link useFilterDrillIn} sans l'étape valeurs. Singleton : un seul bloc inspecté.
 */
export function useColumnDrillIn() {
  const studio = useStudioStore()
  const datasets = useStudioDatasetsStore()

  if (!watching) {
    watching = true
    // Scope détaché : survit au démontage du composant qui a déclenché la 1re création.
    effectScope(true).run(() => {
      watch(
        () => studio.selectedBlock?.id ?? null,
        (id) => {
          if (state.open && id !== state.blockId) close()
        },
      )
    })
  }

  function open(opts: OpenOpts) {
    // Le groupe « Calculées » n'a pas de sourceId → ne compte pas pour l'étape source.
    const realSources = blockColumnGroups(opts.block, datasets).filter((g) => g.sourceId)
    onCommit = opts.onCommit
    Object.assign(state, {
      open: true,
      blockId: opts.block.id,
      multi: !!opts.multi,
      allowNone: !!opts.allowNone,
      noneLabel: opts.noneLabel ?? 'Aucune',
      title: opts.title,
      selected: [...(opts.selected ?? [])],
      calcDraft: null,
      skipSource: realSources.length <= 1,
      sourceId: realSources.length <= 1 ? (realSources[0]?.sourceId ?? primarySourceId(opts.block)) : null,
      step: realSources.length <= 1 ? 'column' : 'source',
    })
  }

  /** Passe à l'étape « colonne calculée » : nouvelle, ou édition d'une existante (`calc:<id>`). */
  function startCalc(ref?: string) {
    const block = studio.selectedBlock
    const existing = ref && isCalcRef(ref)
      ? block?.fieldMapping.calcColumns?.find((c) => c.id === ref.slice(CALC_REF_PREFIX.length))
      : undefined
    state.calcDraft = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: calcUid(), label: '', operands: [{ column: '' }] }
    state.step = 'calc'
  }

  /** Enregistre le brouillon dans `fieldMapping.calcColumns` et le sélectionne. */
  function saveCalc(calc: CalcColumn) {
    const block = studio.selectedBlock
    if (!block) return
    const cur = block.fieldMapping.calcColumns ?? []
    const next = cur.some((c) => c.id === calc.id)
      ? cur.map((c) => (c.id === calc.id ? calc : c))
      : [...cur, calc]
    studio.updateBlockFieldMapping(block.id, { calcColumns: next })
    state.calcDraft = null
    pickColumn(CALC_REF_PREFIX + calc.id)
  }

  function pickSource(id: string) {
    state.sourceId = id
    state.step = 'column'
  }

  function pickColumn(ref: string) {
    if (state.multi) {
      toggle(ref)
      return
    }
    onCommit?.([ref])
    close()
  }

  function toggle(ref: string) {
    const set = new Set(state.selected)
    if (set.has(ref)) set.delete(ref)
    else set.add(ref)
    state.selected = Array.from(set)
  }

  function commitMulti() {
    onCommit?.([...state.selected])
    close()
  }

  function pickNone() {
    onCommit?.([])
    close()
  }

  function goBack() {
    if (state.step === 'calc') {
      state.calcDraft = null
      state.step = 'column'
      return
    }
    if (state.step === 'column' && !state.skipSource) {
      state.step = 'source'
      return
    }
    close()
  }

  function close() {
    state.open = false
    state.blockId = null
    state.selected = []
    state.calcDraft = null
    onCommit = null
  }

  return { state, open, pickSource, pickColumn, toggle, commitMulti, pickNone, startCalc, saveCalc, goBack, close }
}
