<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { isTextBlock } from '@/types/studio'
import type { BlockFilter, FilterOperator, BlockType } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()

const block  = computed(() => studio.selectedBlock)
const isText = computed(() => block.value ? isTextBlock(block.value.type) : false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const DATA_TABS   = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const KPI_TABS    = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
const TEXT_TABS   = [{ id: 'texte', label: 'Texte' }, { id: 'apparence', label: 'Apparence' }]
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
  if (isText.value) activeTab.value = 'texte'
  else if (isSearch.value) activeTab.value = 'config'
  else activeTab.value = 'data'
}, { immediate: true })

// ─── Accordion state ──────────────────────────────────────────────────────────

const ALL_OPEN = [
  'source', 'axes', 'segments', 'value', 'filters-list',
  'comp-ref', 'comp-filters', 'comp-format',
  'title', 'orientation', 'line-opts', 'table-opts', 'color',
  'heading-level', 'alignment', 'font-family', 'font-size', 'bg-color',
  'search-col', 'search-target',
]

const openSections = ref<Set<string>>(new Set(ALL_OPEN))

function toggle(id: string) {
  const s = new Set(openSections.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSections.value = s
}
const open = (id: string) => openSections.value.has(id)

watch(() => block.value?.id, () => {
  openSections.value = new Set(ALL_OPEN)
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
const blockMeta = computed(() => block.value ? BLOCK_META[block.value.type] : null)

// ─── Dataset ──────────────────────────────────────────────────────────────────

const schema      = computed(() => block.value?.datasetId ? (datasets.getSchema(block.value.datasetId) ?? null) : null)
const columnNames = computed(() => schema.value?.columns.map((c) => c.name) ?? [])

watch(() => block.value?.datasetId, async (id) => { if (id) await datasets.loadSchema(id) }, { immediate: true })

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
    .filter((c) => ['string', 'integer', 'float'].includes(c.type))
    .map((c) => c.name) ?? [],
)

const targetPageToken = computed(() => {
  const targetId = block.value?.fieldMapping.targetPageId
  if (!targetId) return null
  const paramName = studio.pages.find((p) => p.id === targetId)?.paramName
  if (!paramName) return null
  return `{{${paramName}}}`
})

// ─── Text formatting ──────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { value: '',                           label: 'Par défaut' },
  { value: 'Georgia, serif',             label: 'Georgia' },
  { value: '"Times New Roman", serif',   label: 'Times New Roman' },
  { value: '"Courier New", monospace',   label: 'Courier New' },
  { value: 'Impact, sans-serif',         label: 'Impact' },
]
const FONT_SIZES     = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48]
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
function removeFilter(i: number)                        { if (!block.value) return; studio.updateBlockFilters(block.value.id, filters.value.filter((_, idx) => idx !== i)) }
function updateFilter(i: number, p: Partial<BlockFilter>) { if (!block.value) return; studio.updateBlockFilters(block.value.id, filters.value.map((f, idx) => idx === i ? { ...f, ...p } : f)) }

// ─── Comparison filters ───────────────────────────────────────────────────────

const compFilters = computed<BlockFilter[]>(() => block.value?.comparisonFilters ?? [])

function addCompFilter()                                    { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, [...compFilters.value, { column: columnNames.value[0] ?? '', operator: '=', value: '' }]) }
function removeCompFilter(i: number)                        { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, compFilters.value.filter((_, idx) => idx !== i)) }
function updateCompFilter(i: number, p: Partial<BlockFilter>) { if (!block.value) return; studio.updateBlockComparisonFilters(block.value.id, compFilters.value.map((f, idx) => idx === i ? { ...f, ...p } : f)) }
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

          <!-- Section: Source -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('source')">
              <span>Source de données</span>
              <svg class="chevron" :class="open('source') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('source')" class="accordion-body">
              <select class="cfg-select" :value="block.datasetId ?? ''" @change="updateDataset(($event.target as HTMLSelectElement).value)">
                <option value="">— Choisir un dataset —</option>
                <option v-for="ds in datasets.readyDatasets" :key="ds.id" :value="ds.id">{{ ds.name }}</option>
              </select>
            </div>
          </div>

          <!-- Section: Colonne de recherche -->
          <div v-if="block.datasetId" class="accordion-item">
            <button class="accordion-header" @click="toggle('search-col')">
              <span>Colonne de recherche</span>
              <svg class="chevron" :class="open('search-col') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-col')" class="accordion-body flex flex-col gap-3">
              <div>
                <label class="cfg-label">Colonne</label>
                <select class="cfg-select" :value="block.fieldMapping.searchColumn ?? ''" @change="updateMapping('searchColumn', ($event.target as HTMLSelectElement).value)">
                  <option value="">— Choisir une colonne —</option>
                  <option v-for="col in stringColumns" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
              <div>
                <label class="cfg-label">Texte placeholder</label>
                <input
                  type="text"
                  class="cfg-input"
                  :value="block.config.searchPlaceholder ?? ''"
                  placeholder="Rechercher…"
                  @change="updateConfig('searchPlaceholder', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </div>

          <!-- Section: Page cible -->
          <div v-if="block.fieldMapping.searchColumn" class="accordion-item">
            <button class="accordion-header" @click="toggle('search-target')">
              <span>Page cible</span>
              <svg class="chevron" :class="open('search-target') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-target')" class="accordion-body flex flex-col gap-2">
              <select class="cfg-select" :value="block.fieldMapping.targetPageId ?? ''" @change="updateMapping('targetPageId', ($event.target as HTMLSelectElement).value)">
                <option value="">— Aucune page cible —</option>
                <option v-for="page in studio.pages.filter(p => p.id !== studio.currentPageId)" :key="page.id" :value="page.id">
                  {{ page.title }}{{ page.isTemplate ? ' (template)' : '' }}
                </option>
              </select>
              <p v-if="block?.fieldMapping.targetPageId && targetPageToken" class="text-xs text-slate-400 leading-relaxed">
                La valeur sera passée comme paramètre
                <code class="font-mono bg-slate-100 px-1 rounded text-slate-600">{{ targetPageToken }}</code>
              </p>
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
              <select class="cfg-select" :value="block.datasetId ?? ''" @change="updateDataset(($event.target as HTMLSelectElement).value)">
                <option value="">— Choisir un dataset —</option>
                <option v-for="ds in datasets.readyDatasets" :key="ds.id" :value="ds.id">{{ ds.name }} ({{ ds.rowCount.toLocaleString('fr-FR') }} lignes)</option>
              </select>
              <div v-if="!block.datasetId" class="flex flex-col items-center py-4 text-center mt-2">
                <svg class="w-7 h-7 text-slate-200 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
                <p class="text-xs text-slate-400">Choisissez un dataset pour mapper les colonnes</p>
              </div>
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
                  <select class="cfg-select" :value="block.fieldMapping.xAxis ?? ''" @change="updateMapping('xAxis', ($event.target as HTMLSelectElement).value)">
                    <option value="">— Choisir une colonne —</option>
                    <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                  </select>
                </div>
                <div>
                  <label class="cfg-label">Axe Y <span class="text-slate-400 font-normal normal-case tracking-normal">valeurs</span></label>
                  <select class="cfg-select" :value="block.fieldMapping.yAxis ?? ''" @change="updateMapping('yAxis', ($event.target as HTMLSelectElement).value)">
                    <option value="">— Choisir une colonne —</option>
                    <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                  </select>
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
                  <select class="cfg-select" :value="block.fieldMapping.label ?? ''" @change="updateMapping('label', ($event.target as HTMLSelectElement).value)">
                    <option value="">— Choisir une colonne —</option>
                    <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                  </select>
                </div>
                <div>
                  <label class="cfg-label">Valeurs</label>
                  <select class="cfg-select" :value="block.fieldMapping.value ?? ''" @change="updateMapping('value', ($event.target as HTMLSelectElement).value)">
                    <option value="">— Choisir une colonne —</option>
                    <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                  </select>
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
                  <select class="cfg-select" :value="block.fieldMapping.valueColumn ?? ''" @change="updateMapping('valueColumn', ($event.target as HTMLSelectElement).value)">
                    <option value="">— Choisir une colonne —</option>
                    <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                  </select>
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
            <button class="accordion-header" @click="toggle('filters-list')">
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
            </button>
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
                  <div v-for="(filter, i) in filters" :key="i" class="filter-card">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Règle {{ i + 1 }}</span>
                      <button class="p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors" @click="removeFilter(i)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <select class="cfg-select-sm" :value="filter.column" @change="updateFilter(i, { column: ($event.target as HTMLSelectElement).value })">
                      <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                    </select>
                    <select class="cfg-select-sm mt-1.5" :value="filter.operator" @change="updateFilter(i, { operator: ($event.target as HTMLSelectElement).value as FilterOperator })">
                      <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
                    </select>
                    <input type="text" class="cfg-input-sm mt-1.5" placeholder="Valeur…" :value="filter.value" @input="updateFilter(i, { value: ($event.target as HTMLInputElement).value })" />
                  </div>
                </div>
              </template>
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
                <select class="cfg-select" :value="block.fieldMapping.comparisonColumn ?? ''" @change="updateMapping('comparisonColumn', ($event.target as HTMLSelectElement).value)">
                  <option value="">— Même que la valeur principale —</option>
                  <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
            </div>

            <!-- Filtres comparaison -->
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('comp-filters')">
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
              </button>
              <div v-show="open('comp-filters')" class="accordion-body">
                <p class="text-[11px] text-slate-400 mb-2 leading-relaxed">Requête indépendante — ex : <code class="text-[10px] bg-slate-100 px-1 rounded">année = 2023</code></p>
                <div v-if="!compFilters.length" class="text-xs text-slate-400 py-1">Aucun filtre — utilisez « + Ajouter »</div>
                <div v-else class="flex flex-col gap-2">
                  <div v-for="(f, i) in compFilters" :key="i" class="filter-card border-rose-100 bg-rose-50/60">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Règle {{ i + 1 }}</span>
                      <button class="p-0.5 rounded text-rose-300 hover:text-red-500 hover:bg-red-50 transition-colors" @click="removeCompFilter(i)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <select class="cfg-select-sm" :value="f.column" @change="updateCompFilter(i, { column: ($event.target as HTMLSelectElement).value })">
                      <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
                    </select>
                    <select class="cfg-select-sm mt-1.5" :value="f.operator" @change="updateCompFilter(i, { operator: ($event.target as HTMLSelectElement).value as FilterOperator })">
                      <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
                    </select>
                    <input type="text" class="cfg-input-sm mt-1.5" placeholder="Valeur…" :value="f.value" @input="updateCompFilter(i, { value: ($event.target as HTMLInputElement).value })" />
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
              <input type="text" class="cfg-input" placeholder="Ex : Évolution des ventes"
                :value="block.config.title ?? ''" @input="updateConfig('title', ($event.target as HTMLInputElement).value)" />
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

        <!-- ── Tab: Texte ── -->
        <template v-if="activeTab === 'texte'">

          <!-- Niveau (heading) -->
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

          <!-- Alignement -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('alignment')">
              <span>Alignement</span>
              <svg class="chevron" :class="open('alignment') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('alignment')" class="accordion-body">
              <div class="grid grid-cols-4 gap-1.5">
                <button v-for="align in [
                  { v: 'left',    icon: 'M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5',  title: 'Gauche' },
                  { v: 'center',  icon: 'M3.75 6.75h16.5M8.25 12h7.5M3.75 17.25h16.5', title: 'Centre' },
                  { v: 'right',   icon: 'M3.75 6.75h16.5M12 12h8.25M3.75 17.25h16.5',  title: 'Droite' },
                  { v: 'justify', icon: 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5',title: 'Justifié' },
                ]" :key="align.v"
                  class="py-2.5 rounded-xl border flex items-center justify-center transition-colors"
                  :class="(block.config.textAlign ?? 'left') === align.v ? 'cfg-active' : 'cfg-inactive'"
                  :title="align.title"
                  @click="updateConfig('textAlign', align.v)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="align.icon" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </template>

        <!-- ── Tab: Apparence ── -->
        <template v-if="activeTab === 'apparence'">

          <!-- Police -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('font-family')">
              <span>Police</span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400 truncate max-w-20">{{ FONT_FAMILIES.find(f => f.value === (block?.config.fontFamily ?? ''))?.label ?? 'Par défaut' }}</span>
                <svg class="chevron shrink-0" :class="open('font-family') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('font-family')" class="accordion-body">
              <select class="cfg-select" :value="block.config.fontFamily ?? ''" @change="updateConfig('fontFamily', ($event.target as HTMLSelectElement).value)">
                <option v-for="f in FONT_FAMILIES" :key="f.value" :value="f.value" :style="{ fontFamily: f.value || undefined }">{{ f.label }}</option>
              </select>
            </div>
          </div>

          <!-- Taille -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('font-size')">
              <span>Taille</span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400">{{ block.config.fontSize ? `${block.config.fontSize}px` : 'Auto' }}</span>
                <svg class="chevron" :class="open('font-size') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('font-size')" class="accordion-body">
              <div class="grid grid-cols-5 gap-1.5">
                <button v-for="size in FONT_SIZES" :key="size"
                  class="py-1.5 rounded-xl border text-xs font-semibold transition-colors"
                  :class="(block.config.fontSize ?? 0) === size ? 'cfg-active' : 'cfg-inactive'"
                  @click="updateConfig('fontSize', size)">{{ size }}</button>
              </div>
              <button v-if="block.config.fontSize"
                class="mt-2 text-[11px] text-slate-400 hover:text-red-400 transition-colors"
                @click="updateConfig('fontSize', null)">↺ Réinitialiser</button>
            </div>
          </div>

          <!-- Fond (callout) -->
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
