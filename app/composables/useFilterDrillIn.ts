import { effectScope, reactive, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, parseColumnRef, primarySourceId } from '@/lib/studio-columns'
import type { BlockFilter, BlockFilterOperator, StudioBlock } from '@/types/studio'

export type FilterDrillInMode = 'primary' | 'comparison'
export type FilterDrillInStep = 'source' | 'column' | 'values'

export interface FilterDraft {
  /** Id local de la source où vit la colonne. */
  sourceId: string | null
  /** Référence de colonne qualifiée (nue si source primaire, sinon `col@<sourceId>`). */
  column: string | null
  operator: BlockFilterOperator
  /** Valeurs sélectionnées (facettes). */
  values: string[]
  /** Jeton `{{…}}` (paramètre de page / valeur calculée) — exclusif de `values`. */
  dynamicValue: string | null
}

interface DrillInState {
  open: boolean
  blockId: string | null
  mode: FilterDrillInMode
  /** null = ajout d'un nouveau filtre. */
  editIndex: number | null
  /** true quand le bloc n'a qu'une source : l'étape « source » est sautée. */
  skipSource: boolean
  step: FilterDrillInStep
  draft: FilterDraft
}

const MULTI_OPERATORS: BlockFilterOperator[] = ['in', 'not_in']
const TEXT_ONLY_OPERATORS: BlockFilterOperator[] = ['>', '>=', '<', '<=', 'contains', 'not_contains']

function emptyDraft(): FilterDraft {
  return { sourceId: null, column: null, operator: '=', values: [], dynamicValue: null }
}

const state = reactive<DrillInState>({
  open: false,
  blockId: null,
  mode: 'primary',
  editIndex: null,
  skipSource: false,
  step: 'source',
  draft: emptyDraft(),
})

let watching = false

function currentFilters(block: StudioBlock, mode: FilterDrillInMode): BlockFilter[] {
  return (mode === 'comparison' ? block.comparisonFilters : block.filters) ?? []
}

/**
 * État partagé du panneau « drill-in » d'édition d'un filtre de bloc (remplace
 * l'ancienne modale). Un seul bloc est inspecté à la fois → un singleton suffit.
 */
export function useFilterDrillIn() {
  const studio = useStudioStore()
  const datasets = useStudioDatasetsStore()

  if (!watching) {
    watching = true
    // Scope détaché : le watcher vit pour toute la durée de l'app, indépendamment
    // du composant qui a déclenché la 1re création (sinon il meurt à son démontage).
    effectScope(true).run(() => {
      // Changement / désélection de bloc → on referme le panneau.
      watch(
        () => studio.selectedBlock?.id ?? null,
        (id) => {
          if (state.open && id !== state.blockId) close()
        },
      )
    })
  }

  function beginSourceStep(block: StudioBlock) {
    const groups = blockColumnGroups(block, datasets)
    if (groups.length <= 1) {
      state.skipSource = true
      state.draft.sourceId = groups[0]?.sourceId ?? primarySourceId(block)
      state.step = 'column'
    } else {
      state.skipSource = false
      state.step = 'source'
    }
  }

  function openAdd(block: StudioBlock, mode: FilterDrillInMode = 'primary') {
    blockColumnGroups(block, datasets) // no-op, ensures reactivity read
    Object.assign(state, {
      open: true,
      blockId: block.id,
      mode,
      editIndex: null,
      draft: emptyDraft(),
    })
    beginSourceStep(block)
  }

  function openEdit(block: StudioBlock, mode: FilterDrillInMode, index: number) {
    const existing = currentFilters(block, mode)[index]
    if (!existing) {
      openAdd(block, mode)
      return
    }

    const { name, sourceId } = parseColumnRef(existing.column)
    const draft = emptyDraft()
    draft.sourceId = sourceId ?? primarySourceId(block)
    draft.column = existing.column
    draft.operator = existing.operator

    if (MULTI_OPERATORS.includes(existing.operator)) {
      draft.values = parseListValue(existing.value)
    } else if (/\{\{.+\}\}/.test(existing.value)) {
      draft.dynamicValue = existing.value
    } else if (existing.value !== '') {
      draft.values = [existing.value]
    }

    Object.assign(state, {
      open: true,
      blockId: block.id,
      mode,
      editIndex: index,
      draft,
    })
    // Colonne connue → on démarre sur les valeurs, mais on garde le fil retour complet.
    const groups = blockColumnGroups(block, datasets)
    state.skipSource = groups.length <= 1
    state.step = draft.column ? 'values' : (state.skipSource ? 'column' : 'source')
    void name
  }

  function goToColumn(sourceId: string) {
    state.draft.sourceId = sourceId
    state.draft.column = null
    state.draft.values = []
    state.draft.dynamicValue = null
    state.step = 'column'
  }

  function goToValues(columnRef: string) {
    state.draft.column = columnRef
    state.draft.values = []
    state.draft.dynamicValue = null
    state.step = 'values'
  }

  function goBack() {
    if (state.step === 'values') {
      state.step = 'column'
      return
    }
    if (state.step === 'column') {
      if (state.skipSource) close()
      else state.step = 'source'
      return
    }
    close()
  }

  function close() {
    state.open = false
    state.blockId = null
    state.editIndex = null
    state.draft = emptyDraft()
    state.step = 'source'
  }

  function canCommit(): boolean {
    return !!state.draft.column && (state.draft.values.length > 0 || !!state.draft.dynamicValue)
  }

  function buildFilter(): BlockFilter {
    const { column, operator, values, dynamicValue } = state.draft

    if (dynamicValue) {
      const op = MULTI_OPERATORS.includes(operator) ? '=' : operator
      return { column: column!, operator: op, value: dynamicValue }
    }

    if (TEXT_ONLY_OPERATORS.includes(operator)) {
      return { column: column!, operator, value: values[0] ?? '' }
    }

    if (values.length > 1) {
      const op: BlockFilterOperator = operator === '!=' || operator === 'not_in' ? 'not_in' : 'in'
      return { column: column!, operator: op, value: JSON.stringify(values) }
    }

    // Une seule valeur → opérateur scalaire (compat maximale).
    const op: BlockFilterOperator = operator === '!=' || operator === 'not_in' ? '!=' : '='
    return { column: column!, operator: op, value: values[0] ?? '' }
  }

  function commit() {
    if (!state.blockId || !canCommit()) return
    const block = studio.selectedBlock
    if (!block || block.id !== state.blockId) return

    const next = [...currentFilters(block, state.mode)]
    const filter = buildFilter()
    if (state.editIndex != null && state.editIndex < next.length) next[state.editIndex] = filter
    else next.push(filter)

    if (state.mode === 'comparison') studio.updateBlockComparisonFilters(block.id, next)
    else studio.updateBlockFilters(block.id, next)

    close()
  }

  return { state, openAdd, openEdit, goToColumn, goToValues, goBack, close, commit, canCommit }
}

/** Décode la valeur d'un filtre `in` / `not_in` (tableau JSON), tolérant les formats legacy. */
export function parseListValue(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((v) => String(v))
  } catch {
    /* pas du JSON — fallback ci-dessous */
  }
  return value === '' ? [] : [value]
}
