<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import { isTextBlock } from '@/types/studio'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { BlockFilter, FilterOperator, BlockType, BlockJoin, StudioDocumentPage, DatasetMeta, DatasetColumn } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()
const { setActiveInput } = useActiveEditor()

function hasVariable(value: string) { return /\{\{[^}]+\}\}/.test(value) }
function extractVariables(value: string) {
  return [...value.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]!)
}

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

import type { AppSelectOption, AppSelectGroup } from '@/components/ui/AppSelect.vue'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'

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

// ─── Image block upload (bloc "image") ─────────────────────────────────────────

const imageFileInputRef = ref<HTMLInputElement | null>(null)
const imageDragOver     = ref(false)
const imageUploading    = ref(false)
const imageUploadError  = ref('')

async function uploadImageFile(file: File) {
  if (!block.value) return
  imageUploadError.value = ''
  imageUploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('directory', 'studio/images')
    const { data } = await apiHttp.post(STATSIO_API.media.upload, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    updateConfig('imageUrl', data.data.url)
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    imageUploadError.value = msg ?? "Erreur lors de l'upload de l'image"
  } finally {
    imageUploading.value = false
  }
}

function onImageFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) uploadImageFile(input.files[0])
  input.value = ''
}

function onImageDrop(event: DragEvent) {
  imageDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) uploadImageFile(file)
}

function removeImage() {
  imageUploadError.value = ''
  updateConfig('imageUrl', '')
}

// ─── Form block config (choice / checkboxes / dropdown / scale / rating) ──────

const formOptions = computed<string[]>(() => block.value?.config.formOptions ?? [])
function updateFormOption(idx: number, val: string) { updateConfig('formOptions', formOptions.value.map((o, i) => (i === idx ? val : o))) }
function addFormOption() { updateConfig('formOptions', [...formOptions.value, `Option ${formOptions.value.length + 1}`]) }
function removeFormOption(idx: number) { updateConfig('formOptions', formOptions.value.filter((_, i) => i !== idx)) }
const RATING_MAX_CHOICES = [3, 5, 10]

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
// ─── ColumnGroup helpers for ColumnButton / ColumnPickerModal ─────────────────

function joinColumnGroup(joinIdx: number): ColumnGroup[] {
  const jSchema = joinSchema(joinIdx)
  if (!jSchema) return []
  const j = joins.value[joinIdx]
  const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === j?.datasetId)?.name ?? `Jointure ${joinIdx + 1}`
  return [{ label: `Jointure — ${name}`, columns: jSchema.columns }]
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
const urlParamMapping = computed<Record<string, string>>(() => block.value?.fieldMapping.urlParamMapping ?? {})

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
    delete updated[urlKey]
  } else {
    updated[urlKey] = sourceCol
  }
  studio.updateBlockFieldMapping(block.value.id, { urlParamMapping: updated })
}

// ─── Result display ────────────────────────────────────────────────────────────

const showDataSourceModal        = ref(false)
const showFiltersModal           = ref(false)
const showCompFiltersModal       = ref(false)
const showColumnsMappingModal    = ref(false)
const showEditorialModal         = ref(false)
const showUrlParamPickerModal    = ref(false)
const showSearchResultsDispModal = ref(false)

const resultTitleColumn      = computed<string>(() => block.value?.fieldMapping.resultTitleColumn ?? '')
const resultDescColumns      = computed<string[]>(() => block.value?.fieldMapping.resultDescColumns ?? [])
const resultDescColumnLabels = computed<Record<string, string>>(() => block.value?.fieldMapping.resultDescColumnLabels ?? {})

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

function setResultTitleColumn(col: string) {
  if (!block.value) return
  studio.updateBlockFieldMapping(block.value.id, { resultTitleColumn: col || undefined })
}

function toggleResultDescColumn(col: string) {
  if (!block.value) return
  const current = resultDescColumns.value
  const updated = current.includes(col)
    ? current.filter((c: string) => c !== col)
    : [...current, col]
  // Also clean up the label if the column is removed
  if (!updated.includes(col)) {
    const labels = { ...resultDescColumnLabels.value }
    delete labels[col]
    studio.updateBlockFieldMapping(block.value.id, { resultDescColumns: updated.length ? updated : undefined, resultDescColumnLabels: Object.keys(labels).length ? labels : undefined })
  } else {
    studio.updateBlockFieldMapping(block.value.id, { resultDescColumns: updated.length ? updated : undefined })
  }
}

function setResultDescColumnLabel(col: string, label: string) {
  if (!block.value) return
  const labels = { ...resultDescColumnLabels.value }
  if (label && label !== col) {
    labels[col] = label
  } else {
    delete labels[col]
  }
  studio.updateBlockFieldMapping(block.value.id, { resultDescColumnLabels: Object.keys(labels).length ? labels : undefined })
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
              class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3"
              @click="showDataSourceModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)]">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p v-if="searchSources.some((s: SearchSource) => s.datasetId)" class="text-xs font-semibold text-slate-700">
                  {{ searchSources.filter((s: SearchSource) => s.datasetId).length }} source{{ searchSources.filter((s: SearchSource) => s.datasetId).length > 1 ? 's' : '' }} de recherche
                </p>
                <p v-else class="text-xs text-slate-400">Aucune source configurée</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  {{ searchJoins.length > 0 ? `+ ${searchJoins.length} jointure${searchJoins.length > 1 ? 's' : ''}` : 'Configurer les sources →' }}
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
              class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/40"
              @click="showSearchResultsDispModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-100">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-700">Affichage des résultats</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  <span v-if="resultTitleColumn">Titre : <strong class="font-mono font-normal text-slate-600">{{ resultTitleColumn }}</strong></span>
                  <span v-else-if="resultDescColumns.length">{{ resultDescColumns.length }} colonne{{ resultDescColumns.length > 1 ? 's' : '' }} de description</span>
                  <span v-else>Auto — configurer →</span>
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
              class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-violet-300 hover:bg-violet-50/40"
              :disabled="allSourceColumns.length === 0"
              @click="showUrlParamPickerModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-violet-100 group-hover:text-violet-500">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-700">Paramètres URL</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  <span v-if="urlParams.length">{{ urlParams.length }} colonne{{ urlParams.length > 1 ? 's' : '' }} → <code class="font-mono text-[10px]">?{{ urlParams.slice(0,2).map(c => c + '=…').join('&') }}{{ urlParams.length > 2 ? '…' : '' }}</code></span>
                  <span v-else-if="allSourceColumns.length === 0">Configurez d'abord les sources</span>
                  <span v-else>Aucun paramètre configuré →</span>
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
      <template v-if="isEditorial && block">
        <template v-if="activeTab === 'editorial'">

          <!-- ── IMAGE ── -->
          <template v-if="block.type === 'image'">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('img-src')">
                <span>Image</span>
                <svg class="chevron" :class="open('img-src') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <div v-show="open('img-src')" class="accordion-body flex flex-col gap-2">
                <div>
                  <label class="cfg-label">Image</label>
                  <div
                    class="relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden"
                    :class="imageDragOver
                      ? 'border-[var(--color-primary)] bg-purple-50'
                      : block.config.imageUrl ? 'border-slate-200' : 'border-slate-200 hover:border-slate-300 bg-slate-50'"
                    @click="imageFileInputRef?.click()"
                    @dragover.prevent="imageDragOver = true"
                    @dragleave="imageDragOver = false"
                    @drop.prevent="onImageDrop"
                  >
                    <input ref="imageFileInputRef" type="file" accept="image/*" class="sr-only" @change="onImageFileChange" />

                    <img v-if="block.config.imageUrl" :src="block.config.imageUrl" class="w-full h-28 object-cover" />
                    <div v-else class="flex flex-col items-center gap-1.5 py-8 px-4 text-center pointer-events-none">
                      <svg class="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      <p class="text-xs font-medium text-slate-500">Glisser une image ici</p>
                      <p class="text-[11px] text-slate-400">ou cliquer pour parcourir</p>
                    </div>

                    <div v-if="imageUploading" class="absolute inset-0 flex items-center justify-center bg-white/70">
                      <svg class="w-5 h-5 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>

                    <button
                      v-if="block.config.imageUrl && !imageUploading"
                      type="button"
                      class="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-slate-500 hover:text-red-500 shadow-sm"
                      @click.stop="removeImage"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="imageUploadError" class="mt-1 text-[11px] text-red-500">{{ imageUploadError }}</p>
                </div>
                <div>
                  <label class="cfg-label">Texte alternatif</label>
                  <input :value="block.config.imageAlt ?? ''" type="text" placeholder="Description de l'image" class="cfg-input" @input="updateConfig('imageAlt', ($event.target as HTMLInputElement).value)" />
                </div>
                <div>
                  <label class="cfg-label">Légende</label>
                  <input :value="block.config.imageCaption ?? ''" type="text" placeholder="Source : …" class="cfg-input" @input="updateConfig('imageCaption', ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
            </div>
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('img-layout')">
                <span>Mise en page</span>
                <svg class="chevron" :class="open('img-layout') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <div v-show="open('img-layout')" class="accordion-body flex flex-col gap-3">
                <div>
                  <label class="cfg-label">Largeur</label>
                  <div class="grid grid-cols-4 gap-1.5">
                    <button v-for="w in ['sm','md','lg','full']" :key="w" class="rounded-lg border py-1.5 text-[11px] font-semibold transition-colors" :class="(block.config.imageWidth ?? 'full') === w ? 'cfg-active' : 'cfg-inactive'" @click="updateConfig('imageWidth', w)">{{ w }}</button>
                  </div>
                </div>
                <div>
                  <label class="cfg-label">Alignement</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button v-for="a in [{ v: 'left', icon: 'M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5' }, { v: 'center', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' }, { v: 'right', icon: 'M3.75 6.75h16.5M12 12h8.25M3.75 17.25h16.5' }]" :key="a.v" class="flex items-center justify-center rounded-lg border py-1.5 transition-colors" :class="(block.config.imageAlign ?? 'center') === a.v ? 'cfg-active' : 'cfg-inactive'" @click="updateConfig('imageAlign', a.v)">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" :d="a.icon" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── VIDEO ── -->
          <template v-if="block.type === 'video'">
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('vid-url')">
                <span>Vidéo</span>
                <svg class="chevron" :class="open('vid-url') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <div v-show="open('vid-url')" class="accordion-body flex flex-col gap-2">
                <div>
                  <label class="cfg-label">Lien vidéo <span class="text-slate-400 font-normal normal-case">(YouTube, Vimeo, Dailymotion)</span></label>
                  <input :value="block.config.videoUrl ?? ''" type="url" placeholder="https://www.youtube.com/watch?v=…" class="cfg-input" @input="updateConfig('videoUrl', ($event.target as HTMLInputElement).value)" />
                </div>
                <div>
                  <label class="cfg-label">Légende</label>
                  <input :value="block.config.videoCaption ?? ''" type="text" placeholder="Description de la vidéo" class="cfg-input" @input="updateConfig('videoCaption', ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
            </div>
          </template>

          <!-- ── BUTTON / LINK-CARD / RETENIR → modal ── -->
          <template v-if="['button', 'link-card', 'retenir'].includes(block.type)">
            <div class="px-3 pt-1 pb-1">
              <button
                class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3"
                @click="showEditorialModal = true"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)]">
                  <svg v-if="block.type === 'link-card'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                  <svg v-else-if="block.type === 'retenir'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" /></svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-700">
                    {{ block.type === 'button' ? 'Bouton' : block.type === 'link-card' ? 'Carte lien' : 'À retenir' }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-slate-400 truncate">
                    <span v-if="block.type === 'button' && block.config.buttonLabel">{{ block.config.buttonLabel }}</span>
                    <span v-else-if="block.type === 'link-card' && block.config.linkTitle">{{ block.config.linkTitle }}</span>
                    <span v-else-if="block.type === 'retenir' && (block.config.retenirItems ?? []).length">{{ (block.config.retenirItems ?? []).length }} point{{ (block.config.retenirItems ?? []).length > 1 ? 's' : '' }} clé{{ (block.config.retenirItems ?? []).length > 1 ? 's' : '' }}</span>
                    <span v-else>Configurer le contenu →</span>
                  </p>
                </div>
                <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[var(--color-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
              <EditorialContentModal :show="showEditorialModal" :block="block" @close="showEditorialModal = false" />
            </div>
          </template>

        </template>
      </template>

      <!-- ══════════════ FORM BLOCKS (choice / checkboxes / dropdown / scale / rating) ══════════════ -->
      <template v-if="isForm && block">
        <template v-if="activeTab === 'form'">

          <!-- Section: Question -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('form-question')">
              <span>Question</span>
              <svg class="chevron" :class="open('form-question') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div v-show="open('form-question')" class="accordion-body flex flex-col gap-2">
              <div>
                <label class="cfg-label">Intitulé</label>
                <input
                  type="text"
                  class="cfg-input"
                  placeholder="Ex : Que pensez-vous de…"
                  :value="block.config.title ?? ''"
                  @focus="setActiveInput($event.target as HTMLInputElement)"
                  @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input type="checkbox" :checked="block.config.formRequired ?? false" @change="updateConfig('formRequired', ($event.target as HTMLInputElement).checked)" />
                Question obligatoire
              </label>
            </div>
          </div>

          <!-- Section: Options (choice / checkboxes / dropdown) -->
          <div v-if="['choice', 'checkboxes', 'dropdown'].includes(block.type)" class="accordion-item">
            <button class="accordion-header" @click="toggle('form-options')">
              <span>Options</span>
              <svg class="chevron" :class="open('form-options') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div v-show="open('form-options')" class="accordion-body flex flex-col gap-2">
              <div v-for="(opt, idx) in formOptions" :key="idx" class="flex items-center gap-2">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">{{ idx + 1 }}</span>
                <input type="text" class="cfg-input" :value="opt" @input="updateFormOption(idx, ($event.target as HTMLInputElement).value)" />
                <button class="shrink-0 p-1 text-slate-300 hover:text-rose-500" @click="removeFormOption(idx)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <button class="mt-1 self-start text-xs font-semibold text-[var(--color-primary)] hover:underline" @click="addFormOption">+ Ajouter une option</button>
            </div>
          </div>

          <!-- Section: Échelle (scale) -->
          <div v-if="block.type === 'scale'" class="accordion-item">
            <button class="accordion-header" @click="toggle('form-scale')">
              <span>Échelle</span>
              <svg class="chevron" :class="open('form-scale') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div v-show="open('form-scale')" class="accordion-body flex flex-col gap-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="cfg-label">Min</label>
                  <input type="number" class="cfg-input" :value="block.config.scaleMin ?? 1" @input="updateConfig('scaleMin', Number(($event.target as HTMLInputElement).value))" />
                </div>
                <div>
                  <label class="cfg-label">Max</label>
                  <input type="number" class="cfg-input" :value="block.config.scaleMax ?? 5" @input="updateConfig('scaleMax', Number(($event.target as HTMLInputElement).value))" />
                </div>
              </div>
              <div>
                <label class="cfg-label">Libellé côté min <span class="text-slate-400 font-normal normal-case">(facultatif)</span></label>
                <input type="text" class="cfg-input" :value="block.config.scaleMinLabel ?? ''" @input="updateConfig('scaleMinLabel', ($event.target as HTMLInputElement).value)" />
              </div>
              <div>
                <label class="cfg-label">Libellé côté max <span class="text-slate-400 font-normal normal-case">(facultatif)</span></label>
                <input type="text" class="cfg-input" :value="block.config.scaleMaxLabel ?? ''" @input="updateConfig('scaleMaxLabel', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </div>

          <!-- Section: Étoiles (rating) -->
          <div v-if="block.type === 'rating'" class="accordion-item">
            <button class="accordion-header" @click="toggle('form-rating')">
              <span>Notation</span>
              <svg class="chevron" :class="open('form-rating') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div v-show="open('form-rating')" class="accordion-body">
              <label class="cfg-label">Nombre d'étoiles</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button v-for="n in RATING_MAX_CHOICES" :key="n" class="rounded-lg border py-1.5 text-[11px] font-semibold transition-colors" :class="(block.config.ratingMax ?? 5) === n ? 'cfg-active' : 'cfg-inactive'" @click="updateConfig('ratingMax', n)">{{ n }}</button>
              </div>
            </div>
          </div>

        </template>
      </template>

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <template v-if="!isText && !isSearch && !isEditorial && !isForm">

        <!-- ── Tab: Données ── -->
        <template v-if="activeTab === 'data'">

          <!-- Section: Source & jointures → modal -->
          <div class="px-3 pt-2.5 pb-1">
            <button
              class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3"
              @click="showDataSourceModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)]">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p v-if="block.datasetId" class="text-xs font-semibold text-slate-700 truncate">
                  {{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === block?.datasetId)?.name ?? 'Dataset sélectionné' }}
                </p>
                <p v-else class="text-xs text-slate-400">Aucun dataset sélectionné</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  {{ joins.length > 0 ? `+ ${joins.length} jointure${joins.length > 1 ? 's' : ''}` : 'Configurer la source →' }}
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <DataSourceModal :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />
          </div>

          <!-- Section: Colonnes → modal (bar/line/pie/kpi/table) -->
          <template v-if="block.datasetId">
            <div class="px-3 pt-1 pb-1">
              <button
                class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-blue-400 hover:bg-blue-50/40"
                @click="showColumnsMappingModal = true"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-700">Colonnes</p>
                  <p class="mt-0.5 text-[11px] text-slate-400">
                    <template v-if="needsXY">
                      <span v-if="block.fieldMapping.xAxis">X : <strong class="font-mono font-normal text-slate-600">{{ block.fieldMapping.xAxis }}</strong></span>
                      <span v-if="yAxes.length" :class="block.fieldMapping.xAxis ? 'ml-2' : ''">Y : <strong class="font-mono font-normal text-slate-600">{{ yAxes.slice(0,2).join(', ') }}{{ yAxes.length > 2 ? '…' : '' }}</strong></span>
                      <span v-if="!block.fieldMapping.xAxis && !yAxes.length">Configurer les axes →</span>
                    </template>
                    <template v-else-if="needsLabelVal">
                      <span v-if="block.fieldMapping.label || block.fieldMapping.value">{{ block.fieldMapping.label }} / {{ block.fieldMapping.value }}</span>
                      <span v-else>Configurer étiquettes et valeurs →</span>
                    </template>
                    <template v-else-if="needsValue">
                      <span v-if="block.fieldMapping.valueColumn">
                        <span v-if="block.fieldMapping.aggregate" class="font-semibold text-[var(--color-primary)] uppercase">{{ block.fieldMapping.aggregate }}</span>(<strong class="font-mono font-normal text-slate-600">{{ block.fieldMapping.valueColumn }}</strong>) — {{ block.config.format ?? 'number' }}
                      </span>
                      <span v-else>Configurer la valeur →</span>
                    </template>
                    <template v-else-if="isTable">
                      <span v-if="block.fieldMapping.columns?.length">{{ block.fieldMapping.columns.length }} colonne{{ block.fieldMapping.columns.length > 1 ? 's' : '' }} sélectionnée{{ block.fieldMapping.columns.length > 1 ? 's' : '' }}</span>
                      <span v-else>Toutes les colonnes affichées</span>
                    </template>
                    <template v-else>Toutes les colonnes affichées</template>
                  </p>
                </div>
                <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <ColumnsMappingModal :show="showColumnsMappingModal" :block="block" @close="showColumnsMappingModal = false" />
            </div>
          </template>

        </template>

        <!-- ── Tab: Filtres ── -->
        <template v-if="activeTab === 'filters'">

          <!-- Filtres → modal -->
          <div class="px-3 pt-2 pb-1">
            <div v-if="!block.datasetId" class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-400">
              Connectez d'abord une source dans l'onglet Données.
            </div>
            <button
              v-else
              class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3"
              @click="showFiltersModal = true"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)]">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-700">Règles de filtrage</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  <span v-if="filters.length">{{ filters.length }} règle{{ filters.length > 1 ? 's' : '' }} active{{ filters.length > 1 ? 's' : '' }}</span>
                  <span v-else>Toutes les lignes affichées →</span>
                </p>
              </div>
              <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[var(--color-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <FiltersModal :show="showFiltersModal" :block="block" mode="primary" @close="showFiltersModal = false" />
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
              <ColumnButton
                :model-value="block.config.distinctColumn ?? null"
                :block="block"
                placeholder="— Aucun —"
                clearable
                @update:model-value="updateConfig('distinctColumn', $event || null)"
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
            <div class="px-3 pb-1">
              <button
                class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-rose-300 hover:bg-rose-50/40"
                @click="showCompFiltersModal = true"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-400 transition-colors group-hover:bg-rose-100 group-hover:text-rose-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-700">Filtres de comparaison</p>
                  <p class="mt-0.5 text-[11px] text-slate-400">
                    <span v-if="compFilters.length">{{ compFilters.length }} règle{{ compFilters.length > 1 ? 's' : '' }}</span>
                    <span v-else>Ex : année = 2023 →</span>
                  </p>
                </div>
                <svg class="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
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
                <span class="text-sm text-slate-700">Afficher les valeurs sur les barres</span>
                <div class="toggle" :class="block.config.showValueLabels ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showValueLabels ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 mb-1.5 block">Style d'affichage</label>
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
                <span class="text-sm text-slate-700">Courbe lisse</span>
                <div class="toggle" :class="block.config.smooth ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.smooth ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 mb-1.5 block">Pastille de tendance (optionnel)</label>
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

    <!-- Footer: duplicate / delete -->
    <div class="px-3 py-3 border-t border-slate-100 shrink-0 flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
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
