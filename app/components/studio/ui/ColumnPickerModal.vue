<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetColumn, StudioDocumentPage, SearchSource, BlockJoin, AggregateFunction } from '@/types/studio'

export interface ColumnGroup {
  label: string
  columns: DatasetColumn[]
}

interface TokenGroup {
  label: string
  tokens: string[]
}

const props = defineProps<{
  show: boolean
  block: StudioBlock
  /** single: pick one column and close. expression: formula bar + operators. multi: toggle multiple columns, emit 'toggle'. */
  mode?: 'single' | 'expression' | 'multi'
  modelValue?: string | null
  /** For multi mode: currently selected column names. */
  selectedValues?: string[]
  /** Override column groups (e.g. for join key pickers). If omitted, derives from block. */
  customGroups?: ColumnGroup[]
  /** Page whose template variables should be listed. Defaults to studio.currentPageId. */
  pageId?: string
  /** Hide the "Formule" (math operators) nav section — irrelevant outside chart/value expressions. */
  hideOperators?: boolean
  /** Show the "Agrégation" nav section for value columns that support sum/avg/count/min/max. */
  showAggregation?: boolean
  aggregateValue?: AggregateFunction
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'toggle', value: string): void
  (e: 'update:aggregate', value: AggregateFunction | undefined): void
  (e: 'close'): void
}>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const searchQuery = ref('')
const formula = ref('')
const activeSection = ref('')

const isExpression = computed(() => props.mode === 'expression')
const showOperators = computed(() => isExpression.value && !props.hideOperators)
const isMulti      = computed(() => props.mode === 'multi')

// ─── Column groups (the block's own sources) ───────────────────────────────────

const derivedGroups = computed<ColumnGroup[]>(() => {
  const groups: ColumnGroup[] = []
  const primary = datasets.getSchema(props.block.datasetId ?? '')
  if (primary) {
    const name = datasets.readyDatasets.find(d => d.id === props.block.datasetId)?.name ?? 'Source principale'
    groups.push({ label: name, columns: primary.columns })
  }
  ;(props.block.joins ?? []).forEach((join, i) => {
    const schema = datasets.getSchema(join.datasetId)
    if (schema) {
      const name = datasets.readyDatasets.find(d => d.id === join.datasetId)?.name ?? `Jointure ${i + 1}`
      groups.push({ label: `Jointure — ${name}`, columns: schema.columns })
    }
  })
  return groups
})

const activeGroups = computed(() => props.customGroups ?? derivedGroups.value)

// ─── Dynamic variable groups from search blocks ────────────────────────────────

const tokenGroups = computed((): TokenGroup[] => {
  const pageId = props.pageId ?? studio.currentPageId
  const currentPage = studio.pages.find((p: StudioDocumentPage) => p.id === pageId)
  if (!currentPage?.isTemplate) return []

  const groups: TokenGroup[] = []
  if (currentPage.paramName) {
    groups.push({ label: 'Paramètre de la page', tokens: [currentPage.paramName] })
  }
  const seenDatasets = new Set<string>()

  for (const block of studio.blocks) {
    if (block.type !== 'search' || block.fieldMapping.targetPageId !== pageId) continue

    for (const src of (block.fieldMapping.searchSources ?? []) as SearchSource[]) {
      if (!src.datasetId || seenDatasets.has(src.datasetId)) continue
      seenDatasets.add(src.datasetId)
      const schema = datasets.getSchema(src.datasetId)
      const dsName = datasets.readyDatasets.find(d => d.id === src.datasetId)?.name ?? 'Source principale'
      const tokens = schema ? schema.columns.map(c => c.name) : src.columns
      if (tokens.length) groups.push({ label: dsName, tokens })
    }

    if (block.datasetId && block.fieldMapping.searchColumn && !seenDatasets.has(block.datasetId)) {
      seenDatasets.add(block.datasetId)
      const schema = datasets.getSchema(block.datasetId)
      const dsName = datasets.readyDatasets.find(d => d.id === block.datasetId)?.name ?? 'Source principale'
      const tokens = schema ? schema.columns.map(c => c.name) : [block.fieldMapping.searchColumn]
      if (tokens.length) groups.push({ label: dsName, tokens })
    }

    for (const join of (block.joins ?? []) as BlockJoin[]) {
      if (!join.datasetId || seenDatasets.has(join.datasetId)) continue
      seenDatasets.add(join.datasetId)
      const schema = datasets.getSchema(join.datasetId)
      if (!schema) continue
      const dsName = datasets.readyDatasets.find(d => d.id === join.datasetId)?.name ?? 'Jointure'
      groups.push({ label: `Jointure — ${dsName}`, tokens: schema.columns.map(c => c.name) })
    }
  }
  return groups
})

// ─── Active section content ────────────────────────────────────────────────────

function defaultSection(): string {
  if (activeGroups.value.length > 0) return 'col-0'
  if (tokenGroups.value.length > 0) return 'var-0'
  return showOperators.value ? 'operators' : ''
}

const activeSectionSafe = computed(() => {
  const s = activeSection.value
  if (!s) return defaultSection()
  if (s.startsWith('col-') && activeGroups.value[Number(s.slice(4))]) return s
  if (s.startsWith('var-') && tokenGroups.value[Number(s.slice(4))]) return s
  if (s === 'operators' && showOperators.value) return s
  if (s === 'aggregation' && props.showAggregation) return s
  return defaultSection()
})

const currentColGroup = computed((): ColumnGroup | null => {
  if (!activeSectionSafe.value.startsWith('col-')) return null
  return activeGroups.value[Number(activeSectionSafe.value.slice(4))] ?? null
})

const currentTokenGroup = computed((): TokenGroup | null => {
  if (!activeSectionSafe.value.startsWith('var-')) return null
  return tokenGroups.value[Number(activeSectionSafe.value.slice(4))] ?? null
})

function filteredCols(columns: DatasetColumn[]): DatasetColumn[] {
  if (!searchQuery.value) return columns
  const q = searchQuery.value.toLowerCase()
  return columns.filter(c => c.name.toLowerCase().includes(q))
}

function filteredTokens(tokens: string[]): string[] {
  if (!searchQuery.value) return tokens
  const q = searchQuery.value.toLowerCase()
  return tokens.filter(t => t.toLowerCase().includes(q))
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function pickColumn(name: string) {
  if (isExpression.value) {
    formula.value += name
  } else if (isMulti.value) {
    emit('toggle', name)
  } else {
    emit('update:modelValue', name)
    emit('close')
  }
}

function pickToken(name: string) {
  const expr = `{{${name}}}`
  if (isExpression.value) {
    formula.value += expr
  } else {
    emit('update:modelValue', expr)
    emit('close')
  }
}

function insertOp(value: string) {
  formula.value += value
}

function confirm() {
  const val = formula.value.trim()
  if (val) emit('update:modelValue', val)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

watch(
  () => props.show,
  (open) => {
    if (open) {
      searchQuery.value = ''
      formula.value = props.modelValue ?? ''
      activeSection.value = defaultSection()
      for (const block of studio.blocks) {
        if (block.type !== 'search') continue
        for (const src of (block.fieldMapping.searchSources ?? []) as SearchSource[]) {
          if (src.datasetId) datasets.loadSchema(src.datasetId)
        }
        if (block.datasetId) datasets.loadSchema(block.datasetId)
        for (const join of (block.joins ?? []) as BlockJoin[]) {
          if (join.datasetId) datasets.loadSchema(join.datasetId)
        }
      }
    }
  },
)

// ─── Type badges ──────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  integer:  { label: '#',  cls: 'bg-amber-100 text-amber-700' },
  float:    { label: '~',  cls: 'bg-amber-100 text-amber-700' },
  string:   { label: 'T',  cls: 'bg-blue-100 text-blue-600' },
  date:     { label: 'd',  cls: 'bg-emerald-100 text-emerald-700' },
  datetime: { label: 'dt', cls: 'bg-emerald-100 text-emerald-700' },
  boolean:  { label: '?',  cls: 'bg-violet-100 text-violet-700' },
}

const OPERATORS = [
  { label: 'SUM(',    value: 'SUM(' },
  { label: 'AVG(',    value: 'AVG(' },
  { label: 'COUNT(',  value: 'COUNT(' },
  { label: 'MIN(',    value: 'MIN(' },
  { label: 'MAX(',    value: 'MAX(' },
  { label: 'CONCAT(', value: 'CONCAT(' },
  { label: 'ROUND(',  value: 'ROUND(' },
  { label: '+',       value: ' + ' },
  { label: '−',       value: ' - ' },
  { label: '×',       value: ' * ' },
  { label: '÷',       value: ' / ' },
  { label: '%',       value: ' % ' },
  { label: ')',       value: ')' },
  { label: ',',       value: ', ' },
]
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      @keydown="onKeydown"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <!-- Panel -->
      <div
        class="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style="max-height: min(85vh, 680px);"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <h3 class="shrink-0 text-[13px] font-semibold text-slate-800">
            {{ isExpression ? 'Expression / colonne' : isMulti ? 'Choisir des colonnes' : 'Choisir une colonne' }}
          </h3>

          <!-- Search -->
          <div class="relative flex-1 max-w-xs">
            <svg
              class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une colonne…"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 transition-all focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          <button
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            @click="emit('close')"
          >×</button>
        </div>

        <!-- Formula bar (expression mode) -->
        <div v-if="isExpression" class="shrink-0 border-b border-slate-100 bg-slate-50/60 px-5 pt-3 pb-2.5">
          <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Valeur / Expression
          </label>
          <input
            v-model="formula"
            type="text"
            placeholder="Saisir ou construire une expression…"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 placeholder:text-slate-300 transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
            autofocus
          />
        </div>

        <!-- Body: left nav + right content -->
        <div class="flex flex-1 min-h-0">

          <!-- Left nav -->
          <nav class="w-48 shrink-0 border-r border-slate-100 overflow-y-auto py-3 flex flex-col gap-0.5">

            <!-- Column sources -->
            <template v-if="activeGroups.length > 0">
              <p class="px-4 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Colonnes</p>
              <button
                v-for="(g, i) in activeGroups"
                :key="`col-${i}`"
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="activeSectionSafe === `col-${i}`
                  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                style="width: calc(100% - 1rem);"
                @click="activeSection = `col-${i}`"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375" />
                </svg>
                <span class="truncate">{{ g.label }}</span>
                <span class="ml-auto shrink-0 text-[9px] font-normal opacity-50">{{ g.columns.length }}</span>
              </button>
            </template>

            <!-- Variable sources -->
            <template v-if="tokenGroups.length > 0">
              <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-500">Variables</p>
              <button
                v-for="(g, i) in tokenGroups"
                :key="`var-${i}`"
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="activeSectionSafe === `var-${i}`
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-600 hover:bg-amber-50/60 hover:text-amber-700'"
                style="width: calc(100% - 1rem);"
                @click="activeSection = `var-${i}`"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                <span class="truncate">{{ g.label }}</span>
                <span class="ml-auto shrink-0 text-[9px] font-normal opacity-50">{{ g.tokens.length }}</span>
              </button>
            </template>

            <!-- Operators (expression mode) -->
            <template v-if="showOperators">
              <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Formule</p>
              <button
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="activeSectionSafe === 'operators'
                  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                style="width: calc(100% - 1rem);"
                @click="activeSection = 'operators'"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="truncate">Opérations</span>
              </button>
            </template>

            <!-- Aggregation -->
            <template v-if="showAggregation">
              <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Valeur</p>
              <button
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="activeSectionSafe === 'aggregation'
                  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                style="width: calc(100% - 1rem);"
                @click="activeSection = 'aggregation'"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <span class="truncate">Agrégation</span>
              </button>
            </template>

            <!-- Empty fallback -->
            <div v-if="!activeGroups.length && !tokenGroups.length && !showOperators" class="px-4 py-6 text-center">
              <p class="text-[11px] text-slate-400">Aucune source configurée</p>
            </div>
          </nav>

          <!-- Right content -->
          <div class="flex-1 min-w-0 overflow-y-auto p-5">

            <!-- Column chips -->
            <template v-if="currentColGroup">
              <div v-if="filteredCols(currentColGroup.columns).length > 0" class="flex flex-wrap gap-1.5">
                <button
                  v-for="col in filteredCols(currentColGroup.columns)"
                  :key="col.name"
                  class="group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all"
                  :class="isMulti && selectedValues?.includes(col.name)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 hover:bg-[var(--color-primary)]/12'
                    : 'border-slate-200 bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'"
                  @click="pickColumn(col.name)"
                >
                  <span
                    class="min-w-[20px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[18px]"
                    :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'"
                  >{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                  <span class="font-mono text-[12px] text-slate-700 transition-colors group-hover:text-[var(--color-primary)]"
                    :class="isMulti && selectedValues?.includes(col.name) ? 'text-[var(--color-primary)]' : ''"
                  >
                    {{ col.name }}
                  </span>
                  <svg
                    v-if="isMulti && selectedValues?.includes(col.name)"
                    class="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
              </div>
              <p v-else class="py-6 text-center text-xs italic text-slate-400">Aucun résultat pour "{{ searchQuery }}"</p>
            </template>

            <!-- Variable chips -->
            <template v-else-if="currentTokenGroup">
              <p class="mb-3 text-[11px] text-amber-600 leading-relaxed">
                Cliquez sur une variable pour l'insérer dans le champ ou l'expression.
              </p>
              <div v-if="filteredTokens(currentTokenGroup.tokens).length > 0" class="flex flex-wrap gap-1.5">
                <button
                  v-for="token in filteredTokens(currentTokenGroup.tokens)"
                  :key="token"
                  class="group flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 transition-all hover:border-amber-400 hover:bg-amber-100"
                  :title="studio.pageParams[token] ? `Valeur active : ${studio.pageParams[token]}` : undefined"
                  @click="pickToken(token)"
                >
                  <span class="min-w-[20px] shrink-0 rounded bg-amber-200 px-1 text-center text-[9px] font-bold leading-[18px] text-amber-700">&#123;&#123;&#125;&#125;</span>
                  <span class="font-mono text-[12px] text-amber-900">{{ token }}</span>
                  <span v-if="studio.pageParams[token]" class="ml-0.5 text-[10px] text-amber-600 font-sans max-w-[80px] truncate">
                    = {{ studio.pageParams[token] }}
                  </span>
                </button>
              </div>
              <p v-else class="py-6 text-center text-xs italic text-slate-400">Aucun résultat pour "{{ searchQuery }}"</p>
            </template>

            <!-- Operators -->
            <template v-else-if="activeSectionSafe === 'operators'">
              <p class="mb-3 text-[11px] text-slate-500 leading-relaxed">Cliquez sur un opérateur pour l'ajouter à l'expression.</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="op in OPERATORS"
                  :key="op.label"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-600 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                  @click="insertOp(op.value)"
                >{{ op.label }}</button>
              </div>
            </template>

            <!-- Aggregation -->
            <template v-else-if="activeSectionSafe === 'aggregation'">
              <p class="mb-3 text-[11px] text-slate-500 leading-relaxed">Applique une fonction d'agrégation sur cette colonne, calculée sur les lignes filtrées.</p>
              <AggregationSelect
                :model-value="aggregateValue"
                @update:model-value="emit('update:aggregate', $event)"
              />
            </template>

          </div>
        </div>

        <!-- Footer (multi mode) -->
        <div v-if="isMulti" class="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
          <span class="text-[11px] text-slate-400">
            {{ selectedValues?.length ?? 0 }} colonne{{ (selectedValues?.length ?? 0) !== 1 ? 's' : '' }} sélectionnée{{ (selectedValues?.length ?? 0) !== 1 ? 's' : '' }}
          </span>
          <button
            class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            @click="emit('close')"
          >Terminé</button>
        </div>

        <!-- Footer (expression mode) -->
        <div v-else-if="isExpression" class="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
          <button
            v-if="formula"
            class="text-[11px] text-slate-400 transition-colors hover:text-red-500"
            @click="formula = ''"
          >Effacer</button>
          <span v-else />
          <div class="flex gap-2">
            <button
              class="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              @click="emit('close')"
            >Annuler</button>
            <button
              class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              @click="confirm"
            >Valider</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
