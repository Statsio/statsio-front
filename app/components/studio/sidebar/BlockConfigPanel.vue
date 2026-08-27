<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { isTextBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FormBlockInspector from '@/components/studio/inspector/FormBlockInspector.vue'
import MediaBlockInspector from '@/components/studio/inspector/MediaBlockInspector.vue'
import RichBlockInspector from '@/components/studio/inspector/RichBlockInspector.vue'
import type { BlockFilter, BlockType, BlockJoin, DatasetMeta, DatasetColumn } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()
const { setActiveInput } = useActiveEditor()

const block    = computed(() => studio.selectedBlock)
const isText   = computed(() => block.value ? isTextBlock(block.value.type) : false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const EDITORIAL_TYPES = ['image', 'video', 'button', 'link-card', 'retenir'] as const
const FORM_TYPES = ['choice', 'checkboxes', 'dropdown', 'scale', 'rating'] as const

const DATA_TABS      = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const KPI_TABS       = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
const TEXT_TABS      = [{ id: 'style', label: 'Style' }]
const SEARCH_TABS    = [{ id: 'config', label: 'Configuration' }]
const EDITORIAL_TABS = [{ id: 'editorial', label: 'Contenu' }]
const FORM_TABS      = [{ id: 'form', label: 'Question' }]

const isSearch    = computed(() => block.value?.type === 'search')
const isEditorial = computed(() => EDITORIAL_TYPES.includes(block.value?.type as typeof EDITORIAL_TYPES[number]))
const isForm      = computed(() => FORM_TYPES.includes(block.value?.type as typeof FORM_TYPES[number]))

const currentTabs = computed(() => {
  if (isText.value) return TEXT_TABS
  if (isSearch.value) return SEARCH_TABS
  if (isEditorial.value) return EDITORIAL_TABS
  if (isForm.value) return FORM_TABS
  if (block.value?.type === 'kpi') return KPI_TABS
  return DATA_TABS
})

const activeTab = ref('data')

watch([() => block.value?.id, isText, isSearch, isEditorial, isForm], () => {
  if (isText.value) activeTab.value = 'style'
  else if (isSearch.value) activeTab.value = 'config'
  else if (isEditorial.value) activeTab.value = 'editorial'
  else if (isForm.value) activeTab.value = 'form'
  else activeTab.value = 'data'
}, { immediate: true })

// ─── Accordion state ──────────────────────────────────────────────────────────

const openSections = ref<Set<string>>(new Set<string>())

function toggle(id: string) {
  const s = new Set(openSections.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
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
  image:     { label: 'Image',      colorClass: 'bg-pink-100 text-pink-600',       iconPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z' },
  video:     { label: 'Vidéo',      colorClass: 'bg-red-100 text-red-600',         iconPath: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z' },
  button:    { label: 'Bouton',     colorClass: 'bg-violet-100 text-violet-600',   iconPath: 'M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5' },
  'link-card': { label: 'Lien',    colorClass: 'bg-blue-100 text-blue-600',       iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
  retenir:   { label: 'À retenir', colorClass: 'bg-emerald-100 text-emerald-600', iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
  choice:     { label: 'Choix unique',      colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z' },
  checkboxes: { label: 'Cases à cocher',    colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M9 12.75 11.25 15 15 9.75M3.75 12c0-4.556 3.694-8.25 8.25-8.25s8.25 3.694 8.25 8.25-3.694 8.25-8.25 8.25S3.75 16.556 3.75 12Z' },
  dropdown:   { label: 'Liste déroulante', colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' },
  scale:      { label: 'Échelle linéaire', colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M3 6.75h18M3 12h18M3 17.25h18M6 6.75v0M12 12v0M18 17.25v0' },
  rating:     { label: 'Avis',              colorClass: 'bg-amber-100 text-amber-600',   iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
}
const blockMeta = computed(() => block.value ? BLOCK_META[block.value.type as BlockType] : null)

// ─── Dataset ──────────────────────────────────────────────────────────────────

import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'

const schema      = computed(() => block.value?.datasetId ? (datasets.getSchema(block.value.datasetId) ?? null) : null)
const columnNames = computed(() => schema.value?.columns.map((c: DatasetColumn) => c.name) ?? [])

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

const needsXY       = computed(() => block.value?.type === 'bar' || block.value?.type === 'line')
const needsLabelVal = computed(() => block.value?.type === 'pie')

// ─── Y-axes management (multi-column for bar/line) ────────────────────────────

const yAxes = computed<string[]>(() => {
  const axes = block.value?.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = block.value?.fieldMapping.yAxis
  return single ? [single] : []
})

const needsValue    = computed(() => block.value?.type === 'kpi')
const isTable       = computed(() => block.value?.type === 'table')

const CHART_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316']

// ─── Filters ──────────────────────────────────────────────────────────────────

const filters = computed<BlockFilter[]>(() => block.value?.filters ?? [])

// ─── Comparison filters ───────────────────────────────────────────────────────

const compFilters = computed<BlockFilter[]>(() => block.value?.comparisonFilters ?? [])

// ─── Joins ────────────────────────────────────────────────────────────────────

const joins = computed<BlockJoin[]>(() => block.value?.joins ?? [])

function updateJoin(i: number, patch: Partial<BlockJoin>) {
  if (!block.value) return
  const updated = joins.value.map((j: BlockJoin, idx: number) => idx === i ? { ...j, ...patch } : j)
  studio.updateBlockJoins(block.value.id, updated)
  // Load schema for the newly selected dataset
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
// Load schemas for existing join datasets on block change
watch(() => block.value?.id, () => {
  joins.value.forEach((j: BlockJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
}, { immediate: true })

function joinSchema(joinIdx: number) {
  const id = joins.value[joinIdx]?.datasetId
  return id ? (datasets.getSchema(id) ?? null) : null
}
// ─── Search sources ───────────────────────────────────────────────────────────

import type { SearchSource, SearchJoin } from '@/types/studio'

const searchSources = computed<SearchSource[]>(() => block.value?.fieldMapping.searchSources ?? [])

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

function searchJoinSecondaryColumns(ji: number) {
  const id = searchJoins.value[ji]?.datasetId
  return id ? (datasets.getSchema(id)?.columns.map((c: DatasetColumn) => c.name) ?? []) : []
}
watch(searchJoins, (joins: SearchJoin[]) => {
  joins.forEach((j: SearchJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
}, { immediate: true, deep: true })


const urlParams = computed<string[]>(() => block.value?.fieldMapping.urlParams ?? [])

// Grouped by dataset for the column picker modal — only sources with search columns
const searchSourceColumnGroups = computed(() => {
  const groups: { label: string; datasetId: string; columns: string[] }[] = []
  searchSources.value.forEach((src: SearchSource, si: number) => {
    if (!src.columns.length) return
    const cols = searchSourceColumnNames(si)
    if (cols.length) {
      const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? `Source ${si + 1}`
      groups.push({ label: name, datasetId: src.datasetId, columns: cols })
    }
  })
  searchJoins.value.forEach((join: SearchJoin, ji: number) => {
    if (!join.columns.length) return
    const cols = searchJoinSecondaryColumns(ji)
    if (cols.length) {
      const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name ?? `Jointure ${ji + 1}`
      groups.push({ label: `Jointure — ${name}`, datasetId: join.datasetId, columns: cols })
    }
  })
  return groups
})

// Flat list of ALL columns from all source datasets (including non-search columns)
const allSourceColumns = computed(() => {
  const cols = new Set<string>()
  searchSourceColumnGroups.value.forEach((g) => g.columns.forEach((c: string) => cols.add(c)))
  return Array.from(cols)
})

// ─── Result display ────────────────────────────────────────────────────────────

const showDataSourceModal        = ref(false)
const showFiltersModal           = ref(false)
const showCompFiltersModal       = ref(false)
const showColumnsMappingModal    = ref(false)
const showUrlParamPickerModal    = ref(false)
const showSearchResultsDispModal = ref(false)

const resultTitleColumn      = computed<string>(() => block.value?.fieldMapping.resultTitleColumn ?? '')
const resultDescColumns      = computed<string[]>(() => block.value?.fieldMapping.resultDescColumns ?? [])

// ─── Résumés pour les FieldPicker de l'inspecteur (données / colonnes / filtres) ──

const datasetName = computed(() =>
  block.value?.datasetId
    ? (datasets.readyDatasets.find((d: DatasetMeta) => d.id === block.value?.datasetId)?.name ?? 'Source sélectionnée')
    : 'Aucune source',
)

const sourceSummary = computed(() => {
  if (!block.value?.datasetId) return 'Aucune source sélectionnée'
  return datasetName.value + (joins.value.length ? ` · ${joins.value.length} jointure${joins.value.length > 1 ? 's' : ''}` : '')
})

const columnsSummary = computed(() => {
  const fm = block.value?.fieldMapping ?? {}
  if (needsXY.value) {
    const parts = []
    if (fm.xAxis) parts.push(`X : ${fm.xAxis}`)
    if (yAxes.value.length) parts.push(`Y : ${yAxes.value.slice(0, 2).join(', ')}${yAxes.value.length > 2 ? '…' : ''}`)
    return parts.join(' · ') || 'Configurer les axes'
  }
  if (needsLabelVal.value) return (fm.label || fm.value) ? `${fm.label ?? '?'} / ${fm.value ?? '?'}` : 'Configurer étiquettes et valeurs'
  if (needsValue.value) return fm.valueColumn ? `${(fm.aggregate ?? '').toUpperCase()} (${fm.valueColumn})` : 'Configurer la valeur'
  if (isTable.value) return fm.columns?.length ? `${fm.columns.length} colonne${fm.columns.length > 1 ? 's' : ''} affichée${fm.columns.length > 1 ? 's' : ''}` : 'Toutes les colonnes affichées'
  return 'Toutes les colonnes affichées'
})

const filtersSummary = computed(() =>
  filters.value.length
    ? `${filters.value.length} filtre${filters.value.length > 1 ? 's' : ''} appliqué${filters.value.length > 1 ? 's' : ''}`
    : 'Aucun filtre',
)

const compFiltersSummary = computed(() =>
  compFilters.value.length
    ? `${compFilters.value.length} règle${compFilters.value.length > 1 ? 's' : ''} de comparaison`
    : 'Aucune règle de comparaison',
)

// ColumnGroup[] built from search source schemas (for ColumnPickerModal / ColumnButton)
const displayColumnGroups = computed<ColumnGroup[]>(() => {
  const groups: ColumnGroup[] = []
  searchSources.value.forEach((src: SearchSource, si: number) => {
    if (!src.datasetId) return
    const schema = searchSourceSchema(si)
    if (!schema) return
    const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? `Source ${si + 1}`
    groups.push({ label: name, columns: schema.columns })
  })
  searchJoins.value.forEach((join: SearchJoin, ji: number) => {
    if (!join.datasetId) return
    const schema = datasets.getSchema(join.datasetId)
    if (!schema) return
    const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name ?? `Jointure ${ji + 1}`
    const cols = join.columns.length
      ? schema.columns.filter((c: DatasetColumn) => join.columns.includes(c.name))
      : schema.columns
    if (cols.length) groups.push({ label: `Jointure — ${name}`, columns: cols })
  })
  return groups
})


</script>

<template>
  <!-- ─── Block selected ──────────────────────────────────────────────────── -->
  <div v-if="block" class="flex h-full flex-col overflow-hidden font-sans">

    <!-- Header -->
    <div class="flex shrink-0 items-center gap-3 px-5 pb-3.5 pt-[18px]">
      <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--studio-tag)]">
        <svg class="h-4 w-4 text-[var(--studio-tag-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="blockMeta?.iconPath" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[16px] font-extrabold text-[var(--studio-ink)]">{{ blockMeta?.label }}</p>
        <p class="text-[12.5px] text-[var(--studio-muted)]">Configuration du bloc</p>
      </div>
      <button
        class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="studio.selectBlock(null)"
      >✕</button>
    </div>

    <!-- Tab bar -->
    <div v-if="currentTabs.length > 1" class="shrink-0 px-4 pb-1">
      <div class="flex gap-1 rounded-full bg-[var(--studio-wash)] p-[5px]">
        <button
          v-for="tab in currentTabs" :key="tab.id"
          class="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full py-[9px] text-[12.5px] font-bold transition-colors"
          :class="activeTab === tab.id ? 'bg-white text-[var(--studio-ink)] shadow-[0_1px_2px_rgba(20,20,30,0.12)]' : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'filters' && filters.length > 0"
            class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">{{ filters.length }}</span>
          <span v-if="tab.id === 'comparison' && compFilters.length > 0"
            class="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{{ compFilters.length }}</span>
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto min-h-0">

      <!-- ══════════════ SEARCH BLOCK ══════════════ -->
      <template v-if="isSearch">
        <template v-if="activeTab === 'config'">

          <!-- Section: Titre & description -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('search-title')">
              <span>Titre &amp; description</span>
              <svg class="chevron" :class="open('search-title') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('search-title')" class="accordion-body flex flex-col gap-2">
              <div>
                <label class="cfg-label">Titre</label>
                <input
                  type="text"
                  class="cfg-input"
                  placeholder="Ex : Rechercher une commune"
                  :value="block.config.title ?? ''"
                  @focus="setActiveInput($event.target as HTMLInputElement)"
                  @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div>
                <label class="cfg-label">Description</label>
                <textarea
                  rows="2"
                  class="cfg-input resize-none"
                  placeholder="Ex : Tapez le nom d'une commune pour voir ses résultats"
                  :value="block.config.description ?? ''"
                  @focus="setActiveInput($event.target as HTMLTextAreaElement)"
                  @input="updateConfig('description', ($event.target as HTMLTextAreaElement).value)"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Section: Sources & jointures → modal -->
          <div class="px-3 pt-2.5 pb-1">
            <button
              class="group flex w-full items-center gap-3 rounded-xl border border-[var(--studio-line)] bg-white px-3 py-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3"
              @click="showDataSourceModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[var(--studio-faint)] transition-colors group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)]">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p v-if="searchSources.some((s: SearchSource) => s.datasetId)" class="text-xs font-semibold text-[var(--studio-ink)]">
                  {{ searchSources.filter((s: SearchSource) => s.datasetId).length }} source{{ searchSources.filter((s: SearchSource) => s.datasetId).length > 1 ? 's' : '' }} de recherche
                </p>
                <p v-else class="text-xs text-[var(--studio-faint)]">Aucune source configurée</p>
                <p class="mt-0.5 text-[11px] text-[var(--studio-faint)]">
                  {{ searchJoins.length > 0 ? `+ ${searchJoins.length} jointure${searchJoins.length > 1 ? 's' : ''}` : 'Configurer les sources →' }}
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-[var(--studio-faint)] transition-colors group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <DataSourceModal :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />
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

          <!-- Section: Affichage des résultats -->
          <!-- Affichage des résultats → modal -->
          <div v-if="displayColumnGroups.length > 0" class="px-3 pt-1 pb-1">
            <button
              class="group flex w-full items-center gap-3 rounded-xl border border-[var(--studio-line)] bg-white px-3 py-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/40"
              @click="showSearchResultsDispModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-100">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-[var(--studio-ink)]">Affichage des résultats</p>
                <p class="mt-0.5 text-[11px] text-[var(--studio-faint)]">
                  <span v-if="resultTitleColumn">Titre : <strong class="font-mono font-normal text-[var(--studio-muted)]">{{ resultTitleColumn }}</strong></span>
                  <span v-else-if="resultDescColumns.length">{{ resultDescColumns.length }} colonne{{ resultDescColumns.length > 1 ? 's' : '' }} de description</span>
                  <span v-else>Auto — configurer →</span>
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-[var(--studio-faint)] group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <SearchResultsDisplayModal
              :show="showSearchResultsDispModal"
              :block="block"
              :column-groups="displayColumnGroups"
              @close="showSearchResultsDispModal = false"
            />
          </div>

          <!-- Paramètres URL → modal -->
          <div class="px-3 pt-1 pb-2">
            <button
              class="group flex w-full items-center gap-3 rounded-xl border border-[var(--studio-line)] bg-white px-3 py-2.5 text-left transition-all hover:border-violet-300 hover:bg-violet-50/40"
              :disabled="allSourceColumns.length === 0"
              @click="showUrlParamPickerModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[var(--studio-faint)] transition-colors group-hover:bg-violet-100 group-hover:text-violet-500">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-[var(--studio-ink)]">Paramètres URL</p>
                <p class="mt-0.5 text-[11px] text-[var(--studio-faint)]">
                  <span v-if="urlParams.length">{{ urlParams.length }} colonne{{ urlParams.length > 1 ? 's' : '' }} → <code class="font-mono text-[10px]">?{{ urlParams.slice(0,2).map(c => c + '=…').join('&') }}{{ urlParams.length > 2 ? '…' : '' }}</code></span>
                  <span v-else-if="allSourceColumns.length === 0">Configurez d'abord les sources</span>
                  <span v-else>Aucun paramètre configuré →</span>
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-[var(--studio-faint)] group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <URLParamPickerModal
              :show="showUrlParamPickerModal"
              :block="block"
              :column-groups="searchSourceColumnGroups"
              @close="showUrlParamPickerModal = false"
            />
          </div>

        </template>
      </template>

      <!-- ══════════════ EDITORIAL BLOCKS (image / video / button / link-card / retenir) ══════════════ -->
      <MediaBlockInspector v-if="isEditorial && block && activeTab === 'editorial'" :block="block" />


      <!-- ══════════════ FORM BLOCKS (choice / checkboxes / dropdown / scale / rating) ══════════════ -->
      <FormBlockInspector v-if="isForm && block && activeTab === 'form'" :block="block" />

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <template v-if="!isText && !isSearch && !isEditorial && !isForm">

        <!-- ── Tab: Données ── -->
        <template v-if="activeTab === 'data'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldPicker
              label="Source"
              :value="sourceSummary"
              action="Changer"
              @open="showDataSourceModal = true"
            />
            <DataSourceModal :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />

            <template v-if="block.datasetId">
              <FieldPicker
                label="Colonnes"
                :value="columnsSummary"
                action="Configurer"
                @open="showColumnsMappingModal = true"
              />
              <ColumnsMappingModal :show="showColumnsMappingModal" :block="block" @close="showColumnsMappingModal = false" />
            </template>
          </div>

        </template>

        <!-- ── Tab: Filtres ── -->
        <template v-if="activeTab === 'filters'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldNote v-if="!block.datasetId">Connectez d'abord une source dans l'onglet Données.</FieldNote>
            <template v-else>
              <FieldPicker
                label="Filtres"
                :value="filtersSummary"
                :action="filters.length ? 'Modifier' : 'Ajouter'"
                @open="showFiltersModal = true"
              />
              <FiltersModal :show="showFiltersModal" :block="block" mode="primary" @close="showFiltersModal = false" />
              <FieldNote>Les filtres s'appliquent avant l'agrégation et se cumulent avec ceux de la source.</FieldNote>
            </template>
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
                  class="text-[11px] text-[var(--studio-faint)] hover:text-red-400 transition-colors shrink-0"
                  @click="updateConfig('rowLimit', null)"
                >↺</button>
              </div>
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Tronque les résultats au nombre de lignes souhaité.</p>
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
              <ColumnButton
                :model-value="block.config.distinctColumn ?? null"
                :block="block"
                placeholder="— Aucun —"
                clearable
                @update:model-value="updateConfig('distinctColumn', $event || null)"
              />
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Garde une seule ligne par valeur unique de la colonne sélectionnée.</p>
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
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Colonne</label>
                <ColumnButton
                  :model-value="block.config.sortColumn ?? null"
                  :block="block"
                  placeholder="— Aucun tri —"
                  clearable
                  @update:model-value="updateConfig('sortColumn', $event || null); if (!$event) updateConfig('sortDirection', null)"
                />
              </div>

              <!-- Direction -->
              <div v-if="block.config.sortColumn" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Direction</label>
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

          <div v-if="!block.datasetId" class="p-4 text-xs text-[var(--studio-faint)] text-center">Connectez d'abord une source dans l'onglet Données.</div>
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
                <p class="text-[11px] text-[var(--studio-faint)] mb-2 leading-relaxed">Par défaut, même colonne que la valeur principale.</p>
                <ColumnButton
                  :model-value="block.fieldMapping.comparisonColumn ?? null"
                  :block="block"
                  placeholder="— Même que la valeur principale —"
                  clearable
                  @update:model-value="updateMappingWithJoinSync('comparisonColumn', ($event ?? '') as string)"
                />
              </div>
            </div>

            <!-- Filtres de comparaison → modal -->
            <div class="px-4 pb-1 pt-1">
              <FieldPicker
                label="Filtres de comparaison"
                :value="compFiltersSummary"
                :action="compFilters.length ? 'Modifier' : 'Configurer'"
                @open="showCompFiltersModal = true"
              />
              <FiltersModal :show="showCompFiltersModal" :block="block" mode="comparison" @close="showCompFiltersModal = false" />
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

          <!-- Options barre (bar) -->
          <div v-if="block.type === 'bar'" class="accordion-item">
            <button class="accordion-header" @click="toggle('bar-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('bar-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('bar-opts')" class="accordion-body flex flex-col gap-3">
              <div class="toggle-row" @click="updateConfig('showValueLabels', !block.config.showValueLabels)">
                <span class="text-sm text-[var(--studio-ink)]">Afficher les valeurs sur les barres</span>
                <div class="toggle" :class="block.config.showValueLabels ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showValueLabels ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div class="toggle-row" @click="updateConfig('logScale', !block.config.logScale)">
                <div>
                  <span class="text-sm text-[var(--studio-ink)]">Échelle logarithmique</span>
                  <p class="text-[11px] text-[var(--studio-faint)] mt-0.5">Garde les petites valeurs visibles quand l'écart avec les plus grandes est important</p>
                </div>
                <div class="toggle shrink-0" :class="block.config.logScale ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.logScale ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-[var(--studio-muted)] mb-1.5 block">Style d'affichage</label>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="o in [
                    { v: 'chart',    l: 'Graphique' },
                    { v: 'progress', l: 'Liste de progression' },
                  ]" :key="o.v"
                    class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
                    :class="(block.config.barStyle ?? 'chart') === o.v ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('barStyle', o.v)">
                    {{ o.l }}
                  </button>
                </div>
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
            <div v-show="open('line-opts')" class="accordion-body flex flex-col gap-3">
              <div class="toggle-row" @click="updateConfig('smooth', !block.config.smooth)">
                <span class="text-sm text-[var(--studio-ink)]">Courbe lisse</span>
                <div class="toggle" :class="block.config.smooth ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.smooth ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-[var(--studio-muted)] mb-1.5 block">Pastille de tendance (optionnel)</label>
                <input
                  :value="block.config.trendLabel ?? ''"
                  type="text"
                  placeholder="Ex: +2.1 pts vs 2022 à 12h"
                  class="cfg-input"
                  @input="updateConfig('trendLabel', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div v-if="block.config.trendLabel" class="grid grid-cols-2 gap-2">
                <button v-for="o in [
                  { v: 'up',   l: '▲ Hausse' },
                  { v: 'down', l: '▼ Baisse' },
                ]" :key="o.v"
                  class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
                  :class="(block.config.trendDirection ?? 'up') === o.v ? 'cfg-active' : 'cfg-inactive'"
                  @click="updateConfig('trendDirection', o.v)">
                  {{ o.l }}
                </button>
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
                <span class="text-sm text-[var(--studio-ink)]">Colonnes triables</span>
                <div class="toggle" :class="block.config.sortable ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.sortable ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div class="toggle-row" @click="updateConfig('showPagination', !block.config.showPagination)">
                <span class="text-sm text-[var(--studio-ink)]">Pagination</span>
                <div class="toggle" :class="block.config.showPagination ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showPagination ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
            </div>
          </div>

          <!-- Couleur principale (bar/line non multi-séries) -->
          <div v-if="(block.type === 'bar' || block.type === 'line') && !block.fieldMapping.series" class="accordion-item">
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
      <RichBlockInspector v-if="isText && block && activeTab === 'style'" :block="block" />

    </div>

    <!-- Footer: duplicate / delete -->
    <div class="px-3 py-3 border-t border-[var(--studio-line)] shrink-0 flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[var(--studio-muted)] hover:bg-[var(--studio-wash)] rounded-xl transition-colors"
        @click="studio.duplicateBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
        Dupliquer
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        @click="studio.removeBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        Supprimer
      </button>
    </div>

  </div>

  <!-- ─── Empty state ─────────────────────────────────────────────────────── -->
  <div v-else class="flex h-full flex-col items-center justify-center px-6 text-center">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--studio-tag)]">
      <svg class="h-8 w-8 text-[var(--studio-tag-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    </div>
    <p class="text-sm font-bold text-[var(--studio-ink)]">Aucun bloc sélectionné</p>
    <p class="mt-1.5 text-xs leading-relaxed text-[var(--studio-faint)]">Cliquez sur un bloc du canevas<br />pour accéder à sa configuration</p>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Accordion ── */
.accordion-item {
  @apply border-b border-[var(--studio-line)] last:border-0;
}
.accordion-header {
  @apply w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors;
  @apply text-[10.5px] font-extrabold uppercase tracking-[0.07em];
  color: var(--studio-faint);
}
.accordion-header:hover {
  background: var(--studio-note);
}
.accordion-body {
  @apply px-4 pb-4;
}
.chevron {
  @apply w-3.5 h-3.5 transition-transform duration-150 shrink-0;
  color: var(--studio-faint);
}

/* ── Filter card ── */
.filter-card {
  @apply flex flex-col p-3;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
  background: #fff;
}

/* ── Form controls ── */
.cfg-label {
  @apply flex items-center mb-[7px] text-[12.5px] font-bold;
  color: var(--studio-ink);
}
.cfg-select,
.cfg-input {
  @apply w-full;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-select-sm,
.cfg-input-sm {
  @apply w-full;
  box-sizing: border-box;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 12px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-select:focus,
.cfg-select-sm:focus,
.cfg-input:focus,
.cfg-input-sm:focus {
  outline: none;
  border-color: var(--color-primary);
}
.cfg-input::placeholder,
.cfg-input-sm::placeholder {
  color: var(--studio-faint);
}
.cfg-active {
  border-color: var(--studio-ink);
  background: var(--studio-ink);
  color: #fff;
}
.cfg-inactive {
  border-color: var(--studio-line-strong);
  color: color-mix(in srgb, var(--studio-ink) 70%, transparent);
}
.cfg-inactive:hover {
  border-color: var(--color-primary);
}

/* ── Toggle switch ── */
.toggle-row {
  @apply flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
}
.toggle      { @apply w-8 h-5 rounded-full relative shrink-0 transition-colors; }
.toggle-on   { background: var(--color-primary); }
.toggle-off  { background: color-mix(in srgb, var(--studio-ink) 16%, transparent); }
.toggle-knob { @apply absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform; }
</style>
