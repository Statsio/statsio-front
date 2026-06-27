<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { isTextBlock } from '@/types/studio'
import type { BlockFilter, FilterOperator, BlockType, BlockJoin, StudioDocumentPage, DatasetMeta, DatasetColumn } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()
const { setActiveInput } = useActiveEditor()

function hasVariable(value: string) { return /\{\{\w+\}\}/.test(value) }
function extractVariables(value: string) {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!)
}

const block  = computed(() => studio.selectedBlock)
const isText = computed(() => block.value ? isTextBlock(block.value.type) : false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const DATA_TABS   = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const KPI_TABS    = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
const TEXT_TABS   = [{ id: 'style', label: 'Style' }]
const SEARCH_TABS = [{ id: 'config', label: 'Configuration' }]

const isSearch = computed(() => block.value?.type === 'search')

const currentTabs = computed(() => {
  if (isText.value) return TEXT_TABS
  if (isSearch.value) return SEARCH_TABS
  if (block.value?.type === 'kpi') return KPI_TABS
  return DATA_TABS
})

const activeTab = ref('data')

watch([() => block.value?.id, isText, isSearch], () => {
  if (isText.value) activeTab.value = 'style'
  else if (isSearch.value) activeTab.value = 'config'
  else activeTab.value = 'data'
}, { immediate: true })

// ─── Accordion state ──────────────────────────────────────────────────────────

const openSections = ref<Set<string>>(new Set<string>())

function toggle(id: string) {
  const s = new Set(openSections.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSections.value = s
}
const open = (id: string) => openSections.value.has(id)

watch(() => block.value?.id, () => {
  openSections.value = new Set<string>()
})

// ─── Block metadata ───────────────────────────────────────────────────────────

const BLOCK_META: Record<BlockType, { label: string; colorClass: string; iconPath: string }> = {
  bar:       { label: 'Barres',     colorClass: 'bg-violet-100 text-violet-600',   iconPath: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
  line:      { label: 'Lignes',     colorClass: 'bg-blue-100 text-blue-600',       iconPath: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
  pie:       { label: 'Camembert',  colorClass: 'bg-emerald-100 text-emerald-600', iconPath: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z' },
  table:     { label: 'Tableau',    colorClass: 'bg-amber-100 text-amber-600',     iconPath: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375' },
  kpi:       { label: 'KPI',        colorClass: 'bg-rose-100 text-rose-600',       iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  heading:   { label: 'Titre',      colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M4 6h16M4 12h8m-8 6h16' },
  paragraph: { label: 'Paragraphe', colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5' },
  quote:     { label: 'Citation',   colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
  callout:   { label: 'Encadré',    colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  search:    { label: 'Recherche',  colorClass: 'bg-cyan-100 text-cyan-600',       iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
}
const blockMeta = computed(() => block.value ? BLOCK_META[block.value.type as BlockType] : null)

// ─── Dataset ──────────────────────────────────────────────────────────────────

import type { AppSelectOption, AppSelectGroup } from '@/components/ui/AppSelect.vue'

const schema      = computed(() => block.value?.datasetId ? (datasets.getSchema(block.value.datasetId) ?? null) : null)
const columnNames = computed(() => schema.value?.columns.map((c: DatasetColumn) => c.name) ?? [])

// Primary columns + ALL schema columns from each joined dataset
const allColumnNames = computed(() => {
  const cols = new Set<string>(columnNames.value)
  joins.value.forEach((_: BlockJoin, i: number) => {
    joinSchema(i)?.columns.forEach((c: DatasetColumn) => cols.add(c.name))
  })
  return Array.from(cols)
})

// Grouped column options: primary source + each join as a collapsible group
const columnGroups = computed<AppSelectGroup[]>(() => {
  const groups: AppSelectGroup[] = []
  if (schema.value?.columns.length) {
    groups.push({
      label: schema.value.name ?? 'Source principale',
      options: schema.value.columns.map((c: DatasetColumn) => ({ value: c.name, label: c.name })),
    })
  }
  joins.value.forEach((j: BlockJoin, i: number) => {
    const jSchema = joinSchema(i)
    if (!jSchema?.columns.length) return
    const ds = datasets.readyDatasets.find((d: DatasetMeta) => d.id === j.datasetId)
    groups.push({
      label: ds?.name ?? `Jointure ${i + 1}`,
      collapsible: true,
      defaultOpen: true,
      options: jSchema.columns.map((c: DatasetColumn) => ({ value: c.name, label: c.name })),
    })
  })
  return groups
})

// Flat column options (no groups) for selects where grouping doesn't add value
const columnOptions = computed<AppSelectOption[]>(() =>
  columnNames.value.map((c: string) => ({ value: c, label: c })),
)

// Like updateMapping but auto-adds the column to join.columns if it belongs to a join
function updateMappingWithJoinSync(key: string, value: string) {
  updateMapping(key, value)
  if (!value || columnNames.value.includes(value)) return
  joins.value.forEach((j: BlockJoin, i: number) => {
    const jCols = joinSchema(i)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (jCols.includes(value) && !j.columns.includes(value)) {
      updateJoin(i, { columns: [...j.columns, value] })
    }
  })
}

watch(() => block.value?.datasetId, async (id: string | undefined) => { if (id) await datasets.loadSchema(id) }, { immediate: true })

function updateConfig(key: string, value: unknown)  { if (!block.value) return; studio.updateBlockConfig(block.value.id, { [key]: value }) }
function updateMapping(key: string, value: string)  { if (!block.value) return; studio.updateBlockFieldMapping(block.value.id, { [key]: value }) }
function updateDataset(id: string)                  { if (!block.value) return; studio.updateBlockDataset(block.value.id, id) }

const needsXY       = computed(() => block.value?.type === 'bar' || block.value?.type === 'line')
const needsLabelVal = computed(() => block.value?.type === 'pie')
const needsValue    = computed(() => block.value?.type === 'kpi')
const isTable       = computed(() => block.value?.type === 'table')

// ─── Search block ─────────────────────────────────────────────────────────────

const stringColumns = computed(() =>
  schema.value?.columns
    .filter((c: DatasetColumn) => ['string', 'integer', 'float'].includes(c.type))
    .map((c: DatasetColumn) => c.name) ?? [],
)

const targetPageToken = computed(() => {
  const targetId = block.value?.fieldMapping.targetPageId
  if (!targetId) return null
  const paramName = studio.pages.find((p: StudioDocumentPage) => p.id === targetId)?.paramName
  if (!paramName) return null
  return `{{${paramName}}}`
})

// ─── Text formatting ──────────────────────────────────────────────────────────

const CALLOUT_COLORS = [
  { value: '#eff6ff', label: 'Bleu' },   { value: '#f0fdf4', label: 'Vert' },
  { value: '#fef9c3', label: 'Jaune' },  { value: '#fff7ed', label: 'Orange' },
  { value: '#fdf2f8', label: 'Rose' },   { value: '#f5f3ff', label: 'Violet' },
  { value: '#f1f5f9', label: 'Gris' },
]
const CHART_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316']

// ─── Filters ──────────────────────────────────────────────────────────────────

const filters = computed<BlockFilter[]>(() => block.value?.filters ?? [])
const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '=',            label: 'égal à' },         { value: '!=',          label: 'différent de' },
  { value: '>',            label: 'supérieur à' },    { value: '>=',          label: 'supérieur ou égal' },
  { value: '<',            label: 'inférieur à' },    { value: '<=',          label: 'inférieur ou égal' },
  { value: 'contains',     label: 'contient' },       { value: 'not_contains',label: 'ne contient pas' },
]

function addFilter()                                    { if (!block.value) return; studio.updateBlockFilters(block.value.id, [...filters.value, { column: columnNames.value[0] ?? '', operator: '=', value: '' }]) }
function removeFilter(i: number)                        { if (!block.value) return; studio.updateBlockFilters(block.value.id, filters.value.filter((_: BlockFilter, idx: number) => idx !== i)) }
function updateFilter(i: number, p: Partial<BlockFilter>) { if (!block.value) return; studio.updateBlockFilters(block.value.id, filters.value.map((f: BlockFilter, idx: number) => idx === i ? { ...f, ...p } : f)) }

// ─── Comparison filters ───────────────────────────────────────────────────────

const compFilters = computed<BlockFilter[]>(() => block.value?.comparisonFilters ?? [])

function addCompFilter()                                    { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, [...compFilters.value, { column: columnNames.value[0] ?? '', operator: '=', value: '' }]) }
function removeCompFilter(i: number)                        { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, compFilters.value.filter((_: BlockFilter, idx: number) => idx !== i)) }
function updateCompFilter(i: number, p: Partial<BlockFilter>) { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, compFilters.value.map((f: BlockFilter, idx: number) => idx === i ? { ...f, ...p } : f)) }

// ─── Joins ────────────────────────────────────────────────────────────────────

const joins = computed<BlockJoin[]>(() => block.value?.joins ?? [])

function addJoin() {
  if (!block.value) return
  studio.updateBlockJoins(block.value.id, [
    ...joins.value,
    { datasetId: '', leftColumn: '', rightColumn: '', columns: [], type: 'left' },
  ])
}
function removeJoin(i: number) {
  if (!block.value) return
  studio.updateBlockJoins(block.value.id, joins.value.filter((_: BlockJoin, idx: number) => idx !== i))
}
function updateJoin(i: number, patch: Partial<BlockJoin>) {
  if (!block.value) return
  const updated = joins.value.map((j: BlockJoin, idx: number) => idx === i ? { ...j, ...patch } : j)
  studio.updateBlockJoins(block.value.id, updated)
  // Load schema for the newly selected dataset
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
function toggleJoinColumn(joinIdx: number, col: string) {
  const j = joins.value[joinIdx]
  if (!j) return
  const cols = j.columns.includes(col)
    ? j.columns.filter((c: string) => c !== col)
    : [...j.columns, col]
  updateJoin(joinIdx, { columns: cols })
}

// Load schemas for existing join datasets on block change
watch(() => block.value?.id, () => {
  joins.value.forEach((j: BlockJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
}, { immediate: true })

function joinSchema(joinIdx: number) {
  const id = joins.value[joinIdx]?.datasetId
  return id ? (datasets.getSchema(id) ?? null) : null
}
function joinColumnNames(joinIdx: number) {
  return joinSchema(joinIdx)?.columns.map((c: DatasetColumn) => c.name) ?? []
}

// ─── Search sources ───────────────────────────────────────────────────────────

import type { SearchSource, SearchJoin } from '@/types/studio'

const searchSources = computed<SearchSource[]>(() => block.value?.fieldMapping.searchSources ?? [])

function addSearchSource() {
  if (!block.value) return
  studio.updateBlockFieldMapping(block.value.id, {
    searchSources: [...searchSources.value, { datasetId: '', columns: [] }],
  })
}
function removeSearchSource(i: number) {
  if (!block.value) return
  studio.updateBlockFieldMapping(block.value.id, {
    searchSources: searchSources.value.filter((_: SearchSource, idx: number) => idx !== i),
  })
}
function updateSearchSource(i: number, patch: Partial<SearchSource>) {
  if (!block.value) return
  const updated = searchSources.value.map((s: SearchSource, idx: number) => idx === i ? { ...s, ...patch } : s)
  studio.updateBlockFieldMapping(block.value.id, { searchSources: updated })
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
function toggleSearchSourceColumn(sourceIdx: number, col: string) {
  const s = searchSources.value[sourceIdx]
  if (!s) return
  const cols = s.columns.includes(col)
    ? s.columns.filter((c: string) => c !== col)
    : [...s.columns, col]
  updateSearchSource(sourceIdx, { columns: cols })
}

watch(() => block.value?.id, () => {
  searchSources.value.forEach((s: SearchSource) => { if (s.datasetId) datasets.loadSchema(s.datasetId) })
}, { immediate: true })

function searchSourceSchema(si: number) {
  const id = searchSources.value[si]?.datasetId
  return id ? (datasets.getSchema(id) ?? null) : null
}
function searchSourceColumnNames(si: number) {
  return searchSourceSchema(si)?.columns.map((c: DatasetColumn) => c.name) ?? []
}

// ─── Search joins (global, not per-source) ────────────────────────────────────

const searchJoins = computed<SearchJoin[]>(() => block.value?.fieldMapping.searchJoins ?? [])

function addSearchJoin() {
  if (!block.value) return
  const firstSource = searchSources.value[0]?.datasetId ?? ''
  studio.updateBlockFieldMapping(block.value.id, {
    searchJoins: [...searchJoins.value, { sourceDatasetId: firstSource, datasetId: '', leftColumn: '', rightColumn: '', columns: [], type: 'left' }],
  })
}
function removeSearchJoin(ji: number) {
  if (!block.value) return
  studio.updateBlockFieldMapping(block.value.id, { searchJoins: searchJoins.value.filter((_: SearchJoin, idx: number) => idx !== ji) })
}
function updateSearchJoin(ji: number, patch: Partial<SearchJoin>) {
  if (!block.value) return
  const updated = searchJoins.value.map((j: SearchJoin, idx: number) => idx === ji ? { ...j, ...patch } : j)
  studio.updateBlockFieldMapping(block.value.id, { searchJoins: updated })
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
function toggleSearchJoinColumn(ji: number, col: string) {
  const j = searchJoins.value[ji]
  if (!j) return
  const cols = j.columns.includes(col) ? j.columns.filter((c: string) => c !== col) : [...j.columns, col]
  updateSearchJoin(ji, { columns: cols })
}
function searchJoinSecondaryColumns(ji: number) {
  const id = searchJoins.value[ji]?.datasetId
  return id ? (datasets.getSchema(id)?.columns.map((c: DatasetColumn) => c.name) ?? []) : []
}
function searchJoinPrimaryColumns(ji: number) {
  const srcId = searchJoins.value[ji]?.sourceDatasetId
  const si = searchSources.value.findIndex((s: SearchSource) => s.datasetId === srcId)
  return si >= 0 ? searchSourceColumnNames(si) : []
}

watch(searchJoins, (joins: SearchJoin[]) => {
  joins.forEach((j: SearchJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
}, { immediate: true, deep: true })

// All unique columns across all search sources + their joins (for URL params picker)
const allSearchSourceColumns = computed(() => {
  const cols = new Set<string>()
  searchSources.value.forEach((_: SearchSource, si: number) => searchSourceColumnNames(si).forEach((c: string) => cols.add(c)))
  searchJoins.value.forEach((_: SearchJoin, ji: number) => searchJoinSecondaryColumns(ji).forEach((c: string) => cols.add(c)))
  return Array.from(cols)
})

const urlParams = computed<string[]>(() => block.value?.fieldMapping.urlParams ?? [])
const urlParamMapping = computed<Record<string, string>>(() => block.value?.fieldMapping.urlParamMapping ?? {})

function toggleUrlParam(col: string) {
  if (!block.value) return
  const current = urlParams.value
  const updated = current.includes(col)
    ? current.filter((c: string) => c !== col)
    : [...current, col]
  studio.updateBlockFieldMapping(block.value.id, { urlParams: updated })
}

function setUrlParamMapping(urlKey: string, sourceCol: string) {
  if (!block.value) return
  const current = urlParamMapping.value
  const updated = { ...current }
  if (sourceCol === urlKey) {
    delete updated[urlKey]  // identity mapping → no need to store
  } else {
    updated[urlKey] = sourceCol
  }
  studio.updateBlockFieldMapping(block.value.id, { urlParamMapping: updated })
}
</script>

<template>
  <!-- ─── Block selected ──────────────────────────────────────────────────── -->
  <div v-if="block" class="flex flex-col h-full overflow-hidden">

    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="blockMeta?.colorClass">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="blockMeta?.iconPath" />
          </svg>
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-slate-800 truncate">{{ blockMeta?.label }}</p>
          <p class="text-[11px] text-slate-400">Configuration</p>
        </div>
        <button class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0" @click="studio.selectBlock(null)">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="px-3 pt-2.5 pb-1 shrink-0">
      <div class="flex bg-slate-100 rounded-xl p-1 gap-0.5">
        <button
          v-for="tab in currentTabs" :key="tab.id"
          class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
          :class="activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'filters' && filters.length > 0"
            class="min-w-4 h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] flex items-center justify-center font-bold">{{ filters.length }}</span>
          <span v-if="tab.id === 'comparison' && compFilters.length > 0"
            class="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">{{ compFilters.length }}</span>
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto min-h-0">

      <!-- ══════════════ SEARCH BLOCK ══════════════ -->
      <template v-if="isSearch">
        <template v-if="activeTab === 'config'">

          <!-- Section: Sources de recherche + Page cible -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('search-sources')">
              <span class="flex items-center gap-2">
                Sources de recherche
                <span v-if="searchSources.length > 0" class="min-w-4 h-4 px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center font-bold">{{ searchSources.length }}</span>
              </span>
              <svg class="chevron" :class="open('search-sources') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-sources')" class="accordion-body flex flex-col gap-3">

              <!-- Page cible -->
              <div>
                <label class="cfg-label">Page de destination</label>
                <AppSelect
                  :model-value="block.fieldMapping.targetPageId ?? ''"
                  :options="studio.pages.filter((p: StudioDocumentPage) => p.id !== studio.currentPageId).map((p: StudioDocumentPage) => ({ value: p.id, label: p.title + (p.isTemplate ? ' (template)' : '') }))"
                  placeholder="— Aucune —"
                  teleport
                  @update:model-value="updateMapping('targetPageId', $event as string)"
                />
              </div>

              <div class="border-t border-slate-100 pt-3">
                <p class="text-[11px] text-slate-500 font-semibold mb-2.5">Datasets de recherche</p>
              </div>

              <!-- Empty state -->
              <div v-if="searchSources.length === 0" class="flex flex-col items-center py-3 text-center">
                <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p class="text-xs text-slate-400">Aucun dataset configuré</p>
              </div>

              <!-- Source cards -->
              <div v-for="(src, si) in searchSources" :key="si" class="rounded-xl border border-slate-200 bg-white overflow-hidden">

                <!-- Card header -->
                <div class="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer" @click="toggle(`ss-${si}`)">
                  <svg class="w-3.5 h-3.5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                  <span class="flex-1 text-left text-[11px] font-semibold text-slate-600 truncate min-w-0">
                    {{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? 'Dataset non choisi' }}
                    <span v-if="src.columns.length" class="font-normal text-slate-400"> · {{ src.columns.join(', ') }}</span>
                  </span>
                  <svg class="w-3 h-3 text-slate-300 shrink-0 transition-transform" :class="open(`ss-${si}`) ? '' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  <button class="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors shrink-0" @click.stop="removeSearchSource(si)">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Card body -->
                <div v-show="open(`ss-${si}`)" class="p-3 flex flex-col gap-3">

                  <!-- Dataset picker -->
                  <div>
                    <label class="cfg-label">Dataset</label>
                    <AppSelect
                      :model-value="src.datasetId"
                      :options="datasets.readyDatasets.map((ds: DatasetMeta) => ({ value: ds.id, label: ds.name }))"
                      placeholder="— Choisir —"
                      size="sm"
                      teleport
                      @update:model-value="updateSearchSource(si, { datasetId: $event as string, columns: [] })"
                    />
                  </div>

                  <!-- Search columns: selected pills + add dropdown -->
                  <div v-if="src.datasetId">
                    <label class="cfg-label">Chercher sur</label>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <!-- Selected columns as removable pills -->
                      <span
                        v-for="col in src.columns" :key="col"
                        class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] font-medium text-cyan-700"
                      >
                        {{ col }}
                        <button class="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-cyan-200 transition-colors" @click="toggleSearchSourceColumn(si, col)">
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                      <!-- Add column via dropdown -->
                      <AppSelect
                        v-if="searchSourceColumnNames(si).filter((c: string) => !src.columns.includes(c)).length > 0"
                        model-value=""
                        :options="searchSourceColumnNames(si).filter((c: string) => !src.columns.includes(c)).map((c: string) => ({ value: c, label: c }))"
                        placeholder="+ Ajouter…"
                        size="sm"
                        button-class="!rounded-full !border-dashed !border-slate-300 !text-slate-500 hover:!border-cyan-300 hover:!text-cyan-600 !bg-white !px-2.5 !py-0.5 !min-h-0 !text-[11px]"
                        teleport
                        @update:model-value="toggleSearchSourceColumn(si, $event as string)"
                      />
                      <p v-else-if="searchSourceColumnNames(si).length === 0" class="text-[11px] text-slate-400">Chargement…</p>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Add source button -->
              <button
                class="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                @click="addSearchSource"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un dataset
              </button>
            </div>
          </div>

          <!-- Section: Jointures -->
          <div v-if="searchSources.some((s: SearchSource) => s.datasetId)" class="accordion-item">
            <button class="accordion-header" @click="toggle('search-joins')">
              <span class="flex items-center gap-2">
                Jointures
                <span v-if="searchJoins.length > 0" class="min-w-4 h-4 px-1 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">{{ searchJoins.length }}</span>
              </span>
              <svg class="chevron" :class="open('search-joins') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-joins')" class="accordion-body flex flex-col gap-3">

              <p class="text-[11px] text-slate-400 leading-relaxed">
                Enrichissez les résultats avec des colonnes d'un autre dataset. Utile quand un dataset n'a pas une colonne dont vous avez besoin.
              </p>

              <!-- Empty state -->
              <div v-if="searchJoins.length === 0" class="flex flex-col items-center py-3 text-center">
                <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <p class="text-xs text-slate-400">Aucune jointure</p>
              </div>

              <!-- Join cards -->
              <div v-for="(join, ji) in searchJoins" :key="ji" class="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">

                <!-- Card header -->
                <div class="w-full flex items-center gap-2 px-3 py-2 bg-violet-100 border-b border-violet-200 hover:bg-violet-200 transition-colors cursor-pointer" @click="toggle(`sj-${ji}`)">
                  <svg class="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span class="flex-1 text-left text-[11px] font-semibold text-violet-700 truncate min-w-0">
                    {{ join.datasetId ? datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name : 'Jointure ' + ((ji as number) + 1) }}
                    <span v-if="join.sourceDatasetId" class="font-normal text-violet-400"> · depuis {{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.sourceDatasetId)?.name?.split(' ')[0] ?? '…' }}</span>
                  </span>
                  <svg class="w-3 h-3 text-violet-300 shrink-0 transition-transform" :class="open(`sj-${ji}`) ? '' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  <button class="p-0.5 rounded hover:bg-red-50 text-violet-300 hover:text-red-400 transition-colors shrink-0" @click.stop="removeSearchJoin(ji)">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div v-show="open(`sj-${ji}`)" class="p-3 flex flex-col gap-2.5">

                  <!-- Source dataset -->
                  <div>
                    <label class="cfg-label">Pour les résultats de</label>
                    <AppSelect
                      :model-value="join.sourceDatasetId"
                      :options="searchSources.filter((s: SearchSource) => s.datasetId).map((s: SearchSource) => ({ value: s.datasetId, label: datasets.readyDatasets.find((d: DatasetMeta) => d.id === s.datasetId)?.name ?? s.datasetId }))"
                      placeholder="— Dataset source —"
                      size="sm"
                      teleport
                      @update:model-value="updateSearchJoin(ji, { sourceDatasetId: $event as string, leftColumn: '' })"
                    />
                  </div>

                  <!-- Type + secondary dataset on same row -->
                  <div>
                    <label class="cfg-label">Joindre avec</label>
                    <div class="flex gap-1.5">
                      <div class="flex gap-0.5 shrink-0">
                        <button v-for="t in [{ v: 'left', l: 'LEFT' }, { v: 'inner', l: 'INNER' }]" :key="t.v"
                          class="px-1.5 py-1.5 rounded text-[9px] font-bold border transition-colors"
                          :class="join.type === t.v ? 'bg-violet-500 border-violet-500 text-white' : 'bg-white border-violet-200 text-violet-400 hover:border-violet-400'"
                          @click="updateSearchJoin(ji, { type: t.v as 'left' | 'inner' })"
                        >{{ t.l }}</button>
                      </div>
                      <AppSelect
                        class="flex-1 min-w-0"
                        :model-value="join.datasetId"
                        :options="datasets.readyDatasets.filter((d: DatasetMeta) => d.id !== join.sourceDatasetId).map((d: DatasetMeta) => ({ value: d.id, label: d.name }))"
                        placeholder="— Dataset —"
                        size="sm"
                        teleport
                        @update:model-value="updateSearchJoin(ji, { datasetId: $event as string, rightColumn: '', columns: [] })"
                      />
                    </div>
                  </div>

                  <!-- Join keys side by side -->
                  <template v-if="join.sourceDatasetId && join.datasetId">
                    <div>
                      <label class="cfg-label">Clé de jointure</label>
                      <div class="flex items-center gap-1.5">
                        <AppSelect
                          class="flex-1 min-w-0"
                          :model-value="join.leftColumn"
                          :options="searchJoinPrimaryColumns(ji).map((c: string) => ({ value: c, label: c }))"
                          placeholder="source"
                          size="sm"
                          teleport
                          @update:model-value="updateSearchJoin(ji, { leftColumn: $event as string })"
                        />
                        <span class="text-[12px] text-violet-400 font-bold shrink-0">=</span>
                        <AppSelect
                          class="flex-1 min-w-0"
                          :model-value="join.rightColumn"
                          :options="searchJoinSecondaryColumns(ji).map((c: string) => ({ value: c, label: c }))"
                          placeholder="jointure"
                          size="sm"
                          teleport
                          @update:model-value="updateSearchJoin(ji, { rightColumn: $event as string })"
                        />
                      </div>
                    </div>

                    <!-- Columns to retrieve -->
                    <div>
                      <label class="cfg-label">Colonnes à récupérer</label>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <span v-for="col in join.columns" :key="col"
                          class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-white border border-violet-300 text-[11px] font-medium text-violet-700"
                        >
                          {{ col }}
                          <button class="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-violet-100 transition-colors" @click="toggleSearchJoinColumn(ji, col)">
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                        <AppSelect
                          v-if="searchJoinSecondaryColumns(ji).filter((c: string) => !join.columns.includes(c)).length > 0"
                          model-value=""
                          :options="searchJoinSecondaryColumns(ji).filter((c: string) => !join.columns.includes(c)).map((c: string) => ({ value: c, label: c }))"
                          placeholder="+ Ajouter…"
                          size="sm"
                          button-class="!rounded-full !border-dashed !border-violet-200 !text-violet-400 hover:!border-violet-400 !bg-white !px-2.5 !py-0.5 !min-h-0 !text-[11px]"
                          teleport
                          @update:model-value="toggleSearchJoinColumn(ji, $event as string)"
                        />
                        <p v-else-if="searchJoinSecondaryColumns(ji).length === 0 && join.datasetId" class="text-[11px] text-violet-300">Chargement…</p>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Add join button -->
              <button
                class="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-violet-200 text-xs font-semibold text-violet-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                @click="addSearchJoin"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter une jointure
              </button>
            </div>
          </div>

          <!-- Section: Placeholder -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('search-placeholder')">
              <span>Texte placeholder</span>
              <svg class="chevron" :class="open('search-placeholder') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-placeholder')" class="accordion-body">
              <input
                type="text"
                class="cfg-input"
                :value="block.config.searchPlaceholder ?? ''"
                placeholder="Rechercher…"
                @change="updateConfig('searchPlaceholder', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Section: Paramètres URL -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('search-url-params')">
              <span class="flex items-center gap-2">
                Paramètres URL
                <span v-if="urlParams.length > 0" class="min-w-4 h-4 px-1 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">{{ urlParams.length }}</span>
              </span>
              <svg class="chevron" :class="open('search-url-params') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-url-params')" class="accordion-body flex flex-col gap-3">
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Colonnes passées dans l'URL lors d'une sélection (<code class="font-mono bg-slate-100 px-1 rounded text-slate-600">?col=valeur</code>) pour générer des liens partageables vers la page template.
              </p>

              <div v-if="allSearchSourceColumns.length === 0" class="text-xs text-slate-400 text-center py-2">
                Configurez d'abord les datasets de recherche.
              </div>

              <!-- Selected URL params as removable pills + add dropdown -->
              <div v-else class="flex flex-col gap-2">
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="col in urlParams" :key="col"
                    class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-violet-50 border border-violet-300 text-[11px] font-medium text-violet-700"
                  >
                    {{ col }}
                    <button class="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-violet-200 transition-colors" @click="toggleUrlParam(col)">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                  <AppSelect
                    v-if="allSearchSourceColumns.filter((c: string) => !urlParams.includes(c)).length > 0"
                    model-value=""
                    :options="allSearchSourceColumns.filter((c: string) => !urlParams.includes(c)).map((c: string) => ({ value: c, label: c }))"
                    placeholder="+ Ajouter…"
                    size="sm"
                    button-class="!rounded-full !border-dashed !border-slate-300 !text-slate-500 hover:!border-violet-300 hover:!text-violet-600 !bg-white !px-2.5 !py-0.5 !min-h-0 !text-[11px]"
                    teleport
                    @update:model-value="toggleUrlParam($event as string)"
                  />
                </div>

                <div v-if="urlParams.length > 0" class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <p class="text-[10px] font-mono text-slate-500 break-all">
                    ?{{ urlParams.map((c: string) => c + '=…').join('&amp;') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </template>
      </template>

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <template v-if="!isText && !isSearch">

        <!-- ── Tab: Données ── -->
        <template v-if="activeTab === 'data'">

          <!-- Section: Source -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('source')">
              <span>Source de données</span>
              <svg class="chevron" :class="open('source') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('source')" class="accordion-body">
              <AppSelect
                :model-value="block.datasetId ?? ''"
                :options="datasets.readyDatasets.map((ds: DatasetMeta) => ({ value: ds.id, label: `${ds.name} (${ds.rowCount.toLocaleString('fr-FR')} lignes)` }))"
                placeholder="— Choisir un dataset —"
                teleport
                @update:model-value="updateDataset($event as string)"
              />
              <div v-if="!block.datasetId" class="flex flex-col items-center py-4 text-center mt-2">
                <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
                <p class="text-xs text-slate-400">Choisissez un dataset pour mapper les colonnes</p>
              </div>
            </div>
          </div>

          <!-- Section: Jointures -->
          <div v-if="block.datasetId" class="accordion-item">
            <button class="accordion-header" @click="toggle('joins')">
              <span class="flex items-center gap-2">
                Jointures
                <span v-if="joins.length > 0" class="min-w-4 h-4 px-1 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">{{ joins.length }}</span>
              </span>
              <svg class="chevron" :class="open('joins') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('joins')" class="accordion-body flex flex-col gap-4">

              <!-- Empty state -->
              <div v-if="joins.length === 0" class="flex flex-col items-center py-3 text-center">
                <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <p class="text-xs text-slate-400">Aucune jointure configurée</p>
              </div>

              <!-- Join list -->
              <div v-for="(join, ji) in joins" :key="ji" class="rounded-xl border border-violet-200 bg-white overflow-hidden">
                <!-- Card header -->
                <div class="w-full flex items-center gap-2 px-3 py-2 bg-violet-50 border-b border-violet-100 hover:bg-violet-100 transition-colors cursor-pointer" @click="toggle(`dj-${ji}`)">
                  <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span class="flex-1 text-left text-[11px] font-semibold text-violet-700 truncate min-w-0">
                    {{ join.datasetId ? datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name : 'Jointure ' + ((ji as number) + 1) }}
                    <span v-if="join.type" class="font-normal text-violet-400"> · {{ join.type.toUpperCase() }}</span>
                  </span>
                  <svg class="w-3 h-3 text-violet-300 shrink-0 transition-transform" :class="open(`dj-${ji}`) ? '' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  <button class="p-0.5 rounded hover:bg-red-50 text-violet-300 hover:text-red-400 transition-colors shrink-0" @click.stop="removeJoin(ji)">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Card body -->
                <div v-show="open(`dj-${ji}`)" class="p-3 flex flex-col gap-2.5">
                  <div>
                    <label class="cfg-label">Dataset secondaire</label>
                    <AppSelect
                      :model-value="join.datasetId"
                      :options="datasets.readyDatasets.map((ds: DatasetMeta) => ({ value: ds.id, label: ds.name }))"
                      placeholder="— Choisir —"
                      size="sm"
                      teleport
                      @update:model-value="updateJoin(ji, { datasetId: $event as string, leftColumn: '', rightColumn: '', columns: [] })"
                    />
                  </div>

                  <template v-if="join.datasetId">
                    <div>
                      <label class="cfg-label">Type</label>
                      <div class="flex gap-1.5">
                        <button v-for="t in [{ v: 'left', l: 'LEFT' }, { v: 'inner', l: 'INNER' }]" :key="t.v"
                          class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors"
                          :class="join.type === t.v ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
                          @click="updateJoin(ji, { type: t.v as 'left' | 'inner' })"
                        >{{ t.l }}</button>
                      </div>
                    </div>

                    <div>
                      <label class="cfg-label">Clé de jointure</label>
                      <div class="flex items-center gap-1.5">
                        <AppSelect
                          class="flex-1 min-w-0"
                          :model-value="join.leftColumn"
                          :options="columnOptions"
                          placeholder="principal"
                          size="sm"
                          teleport
                          @update:model-value="updateJoin(ji, { leftColumn: $event as string })"
                        />
                        <span class="text-[12px] text-violet-400 font-bold shrink-0">=</span>
                        <AppSelect
                          class="flex-1 min-w-0"
                          :model-value="join.rightColumn"
                          :options="joinColumnNames(ji).map((c: string) => ({ value: c, label: c }))"
                          placeholder="secondaire"
                          size="sm"
                          teleport
                          @update:model-value="updateJoin(ji, { rightColumn: $event as string })"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="cfg-label">Colonnes à inclure</label>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <span v-for="col in join.columns" :key="col"
                          class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-violet-50 border border-violet-300 text-[11px] font-medium text-violet-700"
                        >
                          {{ col }}
                          <button class="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-violet-200 transition-colors" @click="toggleJoinColumn(ji, col)">
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                        <AppSelect
                          v-if="joinColumnNames(ji).filter((c: string) => !join.columns.includes(c)).length > 0"
                          model-value=""
                          :options="joinColumnNames(ji).filter((c: string) => !join.columns.includes(c)).map((c: string) => ({ value: c, label: c }))"
                          placeholder="+ Ajouter…"
                          size="sm"
                          button-class="!rounded-full !border-dashed !border-violet-200 !text-violet-400 hover:!border-violet-400 !bg-white !px-2.5 !py-0.5 !min-h-0 !text-[11px]"
                          teleport
                          @update:model-value="toggleJoinColumn(ji, $event as string)"
                        />
                        <p v-else-if="joinColumnNames(ji).length === 0" class="text-[11px] text-slate-400 mt-0.5">Chargement…</p>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Add join button -->
              <button
                class="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                @click="addJoin"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter une jointure
              </button>
            </div>
          </div>

          <!-- Section: Axes (bar/line) -->
          <template v-if="needsXY && block.datasetId">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('axes')">
                <span>Colonnes</span>
                <svg class="chevron" :class="open('axes') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('axes')" class="accordion-body flex flex-col gap-3">
                <div>
                  <label class="cfg-label">Axe X <span class="text-slate-400 font-normal normal-case tracking-normal">catégories</span></label>
                  <AppSelect
                    :model-value="block.fieldMapping.xAxis ?? ''"
                    :groups="columnGroups"
                    placeholder="— Choisir une colonne —"
                    size="sm"
                    teleport
                    @update:model-value="updateMappingWithJoinSync('xAxis', $event as string)"
                  />
                </div>
                <div>
                  <label class="cfg-label">Axe Y <span class="text-slate-400 font-normal normal-case tracking-normal">valeurs</span></label>
                  <AppSelect
                    :model-value="block.fieldMapping.yAxis ?? ''"
                    :groups="columnGroups"
                    placeholder="— Choisir une colonne —"
                    size="sm"
                    teleport
                    @update:model-value="updateMappingWithJoinSync('yAxis', $event as string)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Section: Segments (pie) -->
          <template v-if="needsLabelVal && block.datasetId">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('segments')">
                <span>Segments</span>
                <svg class="chevron" :class="open('segments') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('segments')" class="accordion-body flex flex-col gap-3">
                <div>
                  <label class="cfg-label">Étiquettes</label>
                  <AppSelect
                    :model-value="block.fieldMapping.label ?? ''"
                    :groups="columnGroups"
                    placeholder="— Choisir une colonne —"
                    size="sm"
                    teleport
                    @update:model-value="updateMappingWithJoinSync('label', $event as string)"
                  />
                </div>
                <div>
                  <label class="cfg-label">Valeurs</label>
                  <AppSelect
                    :model-value="block.fieldMapping.value ?? ''"
                    :groups="columnGroups"
                    placeholder="— Choisir une colonne —"
                    size="sm"
                    teleport
                    @update:model-value="updateMappingWithJoinSync('value', $event as string)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Section: Valeur (KPI) -->
          <template v-if="needsValue && block.datasetId">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('value')">
                <span>Valeur principale</span>
                <svg class="chevron" :class="open('value') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('value')" class="accordion-body flex flex-col gap-3">
                <div>
                  <label class="cfg-label">Colonne</label>
                  <AppSelect
                    :model-value="block.fieldMapping.valueColumn ?? ''"
                    :groups="columnGroups"
                    placeholder="— Choisir une colonne —"
                    size="sm"
                    teleport
                    @update:model-value="updateMappingWithJoinSync('valueColumn', $event as string)"
                  />
                </div>
                <div>
                  <label class="cfg-label">Format</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button v-for="f in [{ v: 'number', l: '123' }, { v: 'percent', l: '%' }, { v: 'currency', l: '€' }]" :key="f.v"
                      class="py-2 rounded-xl border text-sm font-bold transition-colors"
                      :class="(block.config.format ?? 'number') === f.v ? 'cfg-active' : 'cfg-inactive'"
                      @click="updateConfig('format', f.v)">{{ f.l }}</button>
                  </div>
                </div>
                <div class="rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-500 flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Valeur de comparaison → onglet <strong class="ml-0.5">Comparaison</strong>
                </div>
              </div>
            </div>
          </template>

          <!-- Table info -->
          <template v-if="isTable && block.datasetId">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('table-cols')">
                <span>Colonnes affichées</span>
                <svg class="chevron" :class="open('table-cols') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('table-cols')" class="accordion-body">
                <div class="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-500 leading-relaxed">
                  Toutes les colonnes sont affichées. Configurez les options dans l'onglet <strong>Style</strong>.
                </div>
              </div>
            </div>
          </template>

        </template>

        <!-- ── Tab: Filtres ── -->
        <template v-if="activeTab === 'filters'">
          <div class="accordion-item">
            <div class="accordion-header cursor-pointer" @click="toggle('filters-list')">
              <span>
                Règles de filtrage
                <span v-if="filters.length" class="ml-1.5 text-[10px] font-bold text-[var(--color-primary)]">{{ filters.length }} active{{ filters.length > 1 ? 's' : '' }}</span>
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="text-[10px] font-semibold text-[var(--color-primary)] hover:opacity-70 transition-opacity"
                  @click.stop="addFilter"
                >+ Ajouter</button>
                <svg class="chevron" :class="open('filters-list') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
            <div v-show="open('filters-list')" class="accordion-body">
              <div v-if="!block.datasetId" class="text-xs text-slate-400 py-2">Connectez d'abord une source dans l'onglet Données.</div>
              <template v-else>
                <div v-if="!filters.length" class="flex flex-col items-center py-4 text-center">
                  <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                  <p class="text-xs text-slate-400">Toutes les lignes affichées</p>
                </div>
                <div v-else class="flex flex-col gap-2">
                  <div v-for="(filter, i) in filters" :key="i" class="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div class="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer" @click="toggle(`f-${i}`)">
                      <span class="flex-1 text-left text-[11px] font-semibold text-slate-600 truncate min-w-0">
                        {{ filter.column || 'Règle ' + ((i as number) + 1) }}
                        <span class="font-normal text-slate-400"> {{ OPERATORS.find((o: { value: FilterOperator; label: string }) => o.value === filter.operator)?.label ?? filter.operator }} </span>
                        <span v-if="filter.value" class="font-mono text-[10px]">{{ filter.value.length > 20 ? filter.value.slice(0, 20) + '…' : filter.value }}</span>
                      </span>
                      <svg class="w-3 h-3 text-slate-300 shrink-0 transition-transform" :class="open(`f-${i}`) ? '' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                      <button class="p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0" @click.stop="removeFilter(i)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div v-show="open(`f-${i}`)" class="p-3 flex flex-col gap-1.5">
                      <AppSelect
                        :model-value="filter.column"
                        :options="columnOptions"
                        placeholder="— Colonne —"
                        size="sm"
                        teleport
                        @update:model-value="updateFilter(i, { column: $event as string })"
                      />
                      <AppSelect
                        :model-value="filter.operator"
                        :options="OPERATORS.map((o: { value: FilterOperator; label: string }) => ({ value: o.value, label: o.label }))"
                        size="sm"
                        teleport
                        @update:model-value="updateFilter(i, { operator: $event as FilterOperator })"
                      />
                      <div>
                        <input
                          type="text"
                          placeholder="Valeur…"
                          :value="filter.value"
                          class="cfg-input-sm w-full"
                          :class="hasVariable(filter.value) ? 'border-amber-300 bg-amber-50/40 focus:border-amber-400 focus:ring-amber-200' : ''"
                          @focus="setActiveInput($event.target as HTMLInputElement)"
                          @input="updateFilter(i, { value: ($event.target as HTMLInputElement).value })"
                        />
                        <div v-if="hasVariable(filter.value)" class="flex flex-wrap gap-1 mt-1">
                          <span v-for="v in extractVariables(filter.value)" :key="v" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            {{ '{' + '{' + v + '}' + '}' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- ── Limite ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('limit')">
              <span>Limite</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.rowLimit" class="text-xs font-bold text-[var(--color-primary)]">
                  {{ block.config.rowLimit }} lignes
                </span>
                <span v-else-if="block.config.distinctColumn" class="text-xs font-bold text-[var(--color-primary)]">
                  distinct
                </span>
                <svg class="chevron" :class="open('limit') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('limit')" class="accordion-body flex flex-col gap-1.5">
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="Illimité"
                  class="cfg-input flex-1 [appearance:textfield]"
                  :value="block.config.rowLimit ?? ''"
                  @input="updateConfig('rowLimit', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
                />
                <button
                  v-if="block.config.rowLimit"
                  class="text-[11px] text-slate-400 hover:text-red-400 transition-colors shrink-0"
                  @click="updateConfig('rowLimit', null)"
                >↺</button>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">Tronque les résultats au nombre de lignes souhaité.</p>
            </div>
          </div>

          <!-- ── Distinct ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('distinct')">
              <span>Distinct</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.distinctColumn" class="text-xs font-bold text-[var(--color-primary)] truncate max-w-[80px]">
                  {{ block.config.distinctColumn }}
                </span>
                <svg class="chevron" :class="open('distinct') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('distinct')" class="accordion-body flex flex-col gap-1.5">
              <AppSelect
                :model-value="block.config.distinctColumn ?? ''"
                :groups="columnGroups"
                placeholder="— Aucun —"
                size="sm"
                teleport
                @update:model-value="updateConfig('distinctColumn', ($event as string) || null)"
              />
              <p class="text-[11px] text-slate-400 leading-relaxed">Garde une seule ligne par valeur unique de la colonne sélectionnée.</p>
            </div>
          </div>

          <!-- ── Ordre d'affichage ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('sort')">
              <span>Ordre d'affichage</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.sortColumn" class="text-xs font-bold text-[var(--color-primary)] truncate max-w-[80px]">
                  {{ block.config.sortColumn }} {{ block.config.sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
                <svg class="chevron" :class="open('sort') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('sort')" class="accordion-body flex flex-col gap-3">

              <!-- Colonne de tri -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Colonne</label>
                <div class="flex items-center gap-2">
                  <AppSelect
                    class="flex-1"
                    :model-value="block.config.sortColumn ?? ''"
                    :groups="columnGroups"
                    placeholder="— Aucun tri —"
                    size="sm"
                    teleport
                    @update:model-value="updateConfig('sortColumn', ($event as string) || null)"
                  />
                  <button
                    v-if="block.config.sortColumn"
                    class="text-[11px] text-slate-400 hover:text-red-400 transition-colors shrink-0"
                    @click="updateConfig('sortColumn', null); updateConfig('sortDirection', null)"
                  >↺</button>
                </div>
              </div>

              <!-- Direction -->
              <div v-if="block.config.sortColumn" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Direction</label>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    class="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors"
                    :class="(block.config.sortDirection ?? 'asc') === 'asc' ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('sortDirection', 'asc')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                    </svg>
                    Croissant
                  </button>
                  <button
                    class="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors"
                    :class="block.config.sortDirection === 'desc' ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('sortDirection', 'desc')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21l3.75-3.75" />
                    </svg>
                    Décroissant
                  </button>
                </div>
              </div>

            </div>
          </div>

        </template>

        <!-- ── Tab: Comparaison (KPI) ── -->
        <template v-if="activeTab === 'comparison'">

          <div v-if="!block.datasetId" class="p-4 text-xs text-slate-400 text-center">Connectez d'abord une source dans l'onglet Données.</div>
          <template v-else>

            <!-- Colonne de référence -->
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('comp-ref')">
                <span>Colonne de référence</span>
                <svg class="chevron" :class="open('comp-ref') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('comp-ref')" class="accordion-body">
                <p class="text-[11px] text-slate-400 mb-2 leading-relaxed">Par défaut, même colonne que la valeur principale.</p>
                <AppSelect
                  :model-value="block.fieldMapping.comparisonColumn ?? ''"
                  :groups="columnGroups"
                  placeholder="— Même que la valeur principale —"
                  size="sm"
                  teleport
                  @update:model-value="updateMappingWithJoinSync('comparisonColumn', $event as string)"
                />
                </AppSelect>
              </div>
            </div>

            <!-- Filtres comparaison -->
            <div class="accordion-item">
              <div class="accordion-header cursor-pointer" @click="toggle('comp-filters')">
                <span>
                  Filtres de comparaison
                  <span v-if="compFilters.length" class="ml-1.5 text-[10px] font-bold text-rose-500">{{ compFilters.length }} active{{ compFilters.length > 1 ? 's' : '' }}</span>
                </span>
                <div class="flex items-center gap-2">
                  <button class="text-[10px] font-semibold text-rose-500 hover:opacity-70 transition-opacity" @click.stop="addCompFilter">+ Ajouter</button>
                  <svg class="chevron" :class="open('comp-filters') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
              <div v-show="open('comp-filters')" class="accordion-body">
                <p class="text-[11px] text-slate-400 mb-2 leading-relaxed">Requête indépendante — ex : <code class="text-[10px] bg-slate-100 px-1 rounded">année = 2023</code></p>
                <div v-if="!compFilters.length" class="text-xs text-slate-400 py-1">Aucun filtre — utilisez « + Ajouter »</div>
                <div v-else class="flex flex-col gap-2">
                  <div v-for="(f, i) in compFilters" :key="i" class="rounded-xl border border-rose-200 bg-white overflow-hidden">
                    <div class="w-full flex items-center gap-2 px-3 py-2 bg-rose-50 border-b border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer" @click="toggle(`cf-${i}`)">
                      <span class="flex-1 text-left text-[11px] font-semibold text-rose-700 truncate min-w-0">
                        {{ f.column || 'Règle ' + ((i as number) + 1) }}
                        <span class="font-normal text-rose-400"> {{ OPERATORS.find((o: { value: FilterOperator; label: string }) => o.value === f.operator)?.label ?? f.operator }} </span>
                        <span v-if="f.value" class="font-mono text-[10px]">{{ f.value.length > 20 ? f.value.slice(0, 20) + '…' : f.value }}</span>
                      </span>
                      <svg class="w-3 h-3 text-rose-300 shrink-0 transition-transform" :class="open(`cf-${i}`) ? '' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                      <button class="p-0.5 rounded text-rose-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" @click.stop="removeCompFilter(i)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div v-show="open(`cf-${i}`)" class="p-3 flex flex-col gap-1.5">
                      <AppSelect
                        :model-value="f.column"
                        :options="columnOptions"
                        placeholder="— Colonne —"
                        size="sm"
                        teleport
                        @update:model-value="updateCompFilter(i, { column: $event as string })"
                      />
                      <AppSelect
                        :model-value="f.operator"
                        :options="OPERATORS.map((o: { value: FilterOperator; label: string }) => ({ value: o.value, label: o.label }))"
                        size="sm"
                        teleport
                        @update:model-value="updateCompFilter(i, { operator: $event as FilterOperator })"
                      />
                      <div>
                        <input
                          type="text"
                          placeholder="Valeur…"
                          :value="f.value"
                          class="cfg-input-sm w-full"
                          :class="hasVariable(f.value) ? 'border-amber-300 bg-amber-50/40 focus:border-amber-400 focus:ring-amber-200' : ''"
                          @focus="setActiveInput($event.target as HTMLInputElement)"
                          @input="updateCompFilter(i, { value: ($event.target as HTMLInputElement).value })"
                        />
                        <div v-if="hasVariable(f.value)" class="flex flex-wrap gap-1 mt-1">
                          <span v-for="v in extractVariables(f.value)" :key="v" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            {{ '{' + '{' + v + '}' + '}' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Format d'écart -->
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('comp-format')">
                <span>Affichage de l'écart</span>
                <svg class="chevron" :class="open('comp-format') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('comp-format')" class="accordion-body flex flex-col gap-1.5">
                <button v-for="opt in [
                  { v: 'percent',  l: 'Pourcentage', ex: '+12,5 %',  desc: 'Variation relative' },
                  { v: 'number',   l: 'Nombre',      ex: '+1 250',   desc: 'Différence absolue' },
                  { v: 'currency', l: 'Devise (€)',   ex: '+1 250 €', desc: 'Différence en euros' },
                ]" :key="opt.v"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
                  :class="(block.config.comparisonFormat ?? 'percent') === opt.v ? 'cfg-active border-2' : 'cfg-inactive'"
                  @click="updateConfig('comparisonFormat', opt.v)">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold">{{ opt.l }}</p>
                    <p class="text-[10px] opacity-60">{{ opt.desc }}</p>
                  </div>
                  <code class="text-[11px] font-mono shrink-0 opacity-60">{{ opt.ex }}</code>
                </button>
              </div>
            </div>

          </template>

        </template>

        <!-- ── Tab: Style ── -->
        <template v-if="activeTab === 'style'">

          <!-- Titre -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('title')">
              <span>Titre du bloc</span>
              <svg class="chevron" :class="open('title') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('title')" class="accordion-body">
              <input
                type="text"
                class="cfg-input"
                placeholder="Ex : Évolution des ventes"
                :value="block.config.title ?? ''"
                @focus="setActiveInput($event.target as HTMLInputElement)"
                @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Orientation (bar) -->
          <div v-if="block.type === 'bar'" class="accordion-item">
            <button class="accordion-header" @click="toggle('orientation')">
              <span>Orientation</span>
              <svg class="chevron" :class="open('orientation') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('orientation')" class="accordion-body">
              <div class="grid grid-cols-2 gap-2">
                <button v-for="o in [
                  { v: 'vertical',   l: 'Vertical',   icon: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
                  { v: 'horizontal', l: 'Horizontal',  icon: 'M4.5 3v4.5H21V3H4.5zm0 6.75v4.5H15v-4.5H4.5zm0 6.75V21H10.5v-4.5H4.5z' },
                ]" :key="o.v"
                  class="py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors"
                  :class="(block.config.orientation ?? 'vertical') === o.v ? 'cfg-active' : 'cfg-inactive'"
                  @click="updateConfig('orientation', o.v)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" :d="o.icon" /></svg>
                  <span class="text-[11px] font-semibold">{{ o.l }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Options ligne (line) -->
          <div v-if="block.type === 'line'" class="accordion-item">
            <button class="accordion-header" @click="toggle('line-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('line-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('line-opts')" class="accordion-body">
              <div class="toggle-row" @click="updateConfig('smooth', !block.config.smooth)">
                <span class="text-sm text-slate-700">Courbe lisse</span>
                <div class="toggle" :class="block.config.smooth ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.smooth ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
            </div>
          </div>

          <!-- Options tableau (table) -->
          <div v-if="isTable" class="accordion-item">
            <button class="accordion-header" @click="toggle('table-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('table-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('table-opts')" class="accordion-body flex flex-col gap-2">
              <div class="toggle-row" @click="updateConfig('sortable', !block.config.sortable)">
                <span class="text-sm text-slate-700">Colonnes triables</span>
                <div class="toggle" :class="block.config.sortable ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.sortable ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div class="toggle-row" @click="updateConfig('showPagination', !block.config.showPagination)">
                <span class="text-sm text-slate-700">Pagination</span>
                <div class="toggle" :class="block.config.showPagination ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showPagination ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
            </div>
          </div>

          <!-- Couleur principale (non table) -->
          <div v-if="!isTable" class="accordion-item">
            <button class="accordion-header" @click="toggle('color')">
              <span>Couleur principale</span>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full border border-white shadow-sm" :style="{ backgroundColor: block.config.colors?.[0] ?? '#8b5cf6' }" />
                <svg class="chevron" :class="open('color') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('color')" class="accordion-body">
              <div class="flex gap-2 flex-wrap">
                <button v-for="color in CHART_COLORS" :key="color"
                  class="w-7 h-7 rounded-full border-[3px] transition-all hover:scale-110"
                  :style="{ backgroundColor: color }"
                  :class="(block.config.colors?.[0] ?? '#8b5cf6') === color ? 'border-white outline outline-2 outline-slate-700 scale-110' : 'border-white shadow-sm'"
                  @click="updateConfig('colors', [color])" />
              </div>
            </div>
          </div>

        </template>
      </template>

      <!-- ══════════════ TEXT BLOCKS ══════════════ -->
      <template v-else>
        <template v-if="activeTab === 'style'">

          <!-- Niveau (heading only) -->
          <div v-if="block.type === 'heading'" class="accordion-item">
            <button class="accordion-header" @click="toggle('heading-level')">
              <span>Niveau</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-500">H{{ block.config.headingLevel ?? 2 }}</span>
                <svg class="chevron" :class="open('heading-level') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('heading-level')" class="accordion-body">
              <div class="grid grid-cols-3 gap-1.5">
                <button v-for="lvl in [1, 2, 3]" :key="lvl"
                  class="py-2.5 rounded-xl border font-bold transition-colors"
                  :class="[(block.config.headingLevel ?? 2) === lvl ? 'cfg-active' : 'cfg-inactive', lvl === 1 ? 'text-lg' : lvl === 2 ? 'text-base' : 'text-sm']"
                  @click="updateConfig('headingLevel', lvl)">H{{ lvl }}</button>
              </div>
            </div>
          </div>

          <!-- Couleur de fond (callout only) -->
          <div v-if="block.type === 'callout'" class="accordion-item">
            <button class="accordion-header" @click="toggle('bg-color')">
              <span>Couleur de fond</span>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded border border-slate-200" :style="{ backgroundColor: block.config.calloutColor ?? '#eff6ff' }" />
                <svg class="chevron" :class="open('bg-color') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('bg-color')" class="accordion-body">
              <div class="grid grid-cols-7 gap-2">
                <button v-for="c in CALLOUT_COLORS" :key="c.value"
                  class="aspect-square rounded-xl border-2 transition-all hover:scale-105"
                  :style="{ backgroundColor: c.value }"
                  :class="(block.config.calloutColor ?? '#eff6ff') === c.value ? 'border-slate-600 scale-110' : 'border-slate-200'"
                  :title="c.label"
                  @click="updateConfig('calloutColor', c.value)" />
              </div>
            </div>
          </div>

          <!-- Info when no block-specific options -->
          <div v-if="block.type !== 'heading' && block.type !== 'callout'" class="flex flex-col items-center justify-center py-10 px-4 text-center">
            <svg class="w-8 h-8 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
            <p class="text-xs font-semibold text-slate-400">Mise en forme disponible</p>
            <p class="text-[11px] text-slate-300 mt-1 leading-relaxed">Utilisez la barre d'outils<br>en haut de la page</p>
          </div>

        </template>
      </template>

    </div>

    <!-- Footer: delete -->
    <div class="px-3 py-3 border-t border-slate-100 shrink-0">
      <button
        class="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        @click="studio.removeBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        Supprimer le bloc
      </button>
    </div>

  </div>

  <!-- ─── Empty state ─────────────────────────────────────────────────────── -->
  <div v-else class="flex flex-col items-center justify-center h-full text-center px-6">
    <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    </div>
    <p class="text-sm font-bold text-slate-600">Aucun bloc sélectionné</p>
    <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Cliquez sur un bloc du canvas<br>pour accéder à sa configuration</p>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Accordion ── */
.accordion-item {
  @apply border-b border-slate-100 last:border-0;
}
.accordion-header {
  @apply w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-slate-50 transition-colors;
  @apply text-[11px] font-bold text-slate-600 uppercase tracking-widest;
}
.accordion-body {
  @apply px-4 pb-4;
}
.chevron {
  @apply w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0;
}

/* ── Filter card ── */
.filter-card {
  @apply rounded-xl border border-slate-200 bg-white p-3 flex flex-col shadow-sm;
}

/* ── Form controls ── */
.cfg-label {
  @apply flex items-center text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest;
}
.cfg-select {
  @apply w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)] transition-all;
}
.cfg-select-sm {
  @apply w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all;
}
.cfg-input {
  @apply w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)] transition-all;
}
.cfg-input-sm {
  @apply w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all;
}
.cfg-active  { @apply border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]; }
.cfg-inactive { @apply border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700; }

/* ── Toggle switch ── */
.toggle-row {
  @apply flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors;
}
.toggle      { @apply w-8 h-5 rounded-full relative shrink-0 transition-colors; }
.toggle-on   { @apply bg-[var(--color-primary)]; }
.toggle-off  { @apply bg-slate-200; }
.toggle-knob { @apply absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform; }
</style>
