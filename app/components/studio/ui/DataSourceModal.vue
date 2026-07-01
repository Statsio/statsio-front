<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetMeta, DatasetColumn, BlockJoin, SearchSource, SearchJoin } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'

const props = defineProps<{
  show: boolean
  block: StudioBlock
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()

const isSearch = computed(() => props.block.type === 'search')

// ─── Navigation ──────────────────────────────────────────────────────────────

type NavItem =
  | { kind: 'primary' }
  | { kind: 'join'; index: number }
  | { kind: 'source'; index: number }
  | { kind: 'search-join'; index: number }

const active = ref<NavItem>({ kind: 'primary' })
const dsFilter = ref('')

watch(() => props.show, (open) => {
  if (!open) return
  dsFilter.value = ''
  if (isSearch.value) {
    active.value = searchSources.value.length > 0 ? { kind: 'source', index: 0 } : { kind: 'source', index: -1 }
  } else {
    active.value = { kind: 'primary' }
  }
  // Pre-load schemas
  if (props.block.datasetId) datasets.loadSchema(props.block.datasetId)
  ;(props.block.joins ?? []).forEach((j: BlockJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
  ;(props.block.fieldMapping.searchSources ?? []).forEach((s: SearchSource) => { if (s.datasetId) datasets.loadSchema(s.datasetId) })
  ;(props.block.fieldMapping.searchJoins ?? []).forEach((j: SearchJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
})

function isActive(item: NavItem): boolean {
  if (item.kind !== active.value.kind) return false
  if (item.kind === 'join' || item.kind === 'source' || item.kind === 'search-join') {
    return (active.value as typeof item).index === item.index
  }
  return true
}

// ─── Data block: dataset + joins ─────────────────────────────────────────────

const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])
const primarySchema = computed(() => datasets.getSchema(props.block.datasetId ?? ''))
const primaryName = computed(() => datasets.readyDatasets.find((d: DatasetMeta) => d.id === props.block.datasetId)?.name ?? null)

function setDataset(id: string) {
  studio.updateBlockDataset(props.block.id, id)
  if (id) datasets.loadSchema(id)
}

function addJoin() {
  const next: BlockJoin[] = [...joins.value, { datasetId: '', leftColumn: '', rightColumn: '', columns: [], type: 'left' }]
  studio.updateBlockJoins(props.block.id, next)
  active.value = { kind: 'join', index: next.length - 1 }
}

function removeJoin(i: number) {
  studio.updateBlockJoins(props.block.id, joins.value.filter((_: BlockJoin, idx: number) => idx !== i))
  active.value = { kind: 'primary' }
}

function patchJoin(i: number, patch: Partial<BlockJoin>) {
  const next = joins.value.map((j: BlockJoin, idx: number) => idx === i ? { ...j, ...patch } : j)
  studio.updateBlockJoins(props.block.id, next)
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}

function toggleJoinCol(i: number, col: string) {
  const cols = joins.value[i]?.columns ?? []
  patchJoin(i, { columns: cols.includes(col) ? cols.filter((c: string) => c !== col) : [...cols, col] })
}

function joinSchema(i: number) {
  return datasets.getSchema(joins.value[i]?.datasetId ?? '')
}

function joinColGroup(i: number): ColumnGroup[] {
  const schema = joinSchema(i)
  if (!schema) return []
  const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === joins.value[i]?.datasetId)?.name ?? `Jointure ${i + 1}`
  return [{ label: `Jointure — ${name}`, columns: schema.columns }]
}

function primaryColGroup(): ColumnGroup[] {
  if (!primarySchema.value) return []
  return [{ label: primaryName.value ?? 'Source principale', columns: primarySchema.value.columns }]
}

// ─── Search block: sources + search joins ────────────────────────────────────

const searchSources = computed<SearchSource[]>(() => props.block.fieldMapping.searchSources ?? [])
const searchJoins   = computed<SearchJoin[]>(() => props.block.fieldMapping.searchJoins ?? [])

function addSource() {
  const next: SearchSource[] = [...searchSources.value, { datasetId: '', columns: [] }]
  studio.updateBlockFieldMapping(props.block.id, { searchSources: next })
  active.value = { kind: 'source', index: next.length - 1 }
}

function removeSource(i: number) {
  const next = searchSources.value.filter((_: SearchSource, idx: number) => idx !== i)
  studio.updateBlockFieldMapping(props.block.id, { searchSources: next })
  active.value = next.length > 0 ? { kind: 'source', index: Math.min(i, next.length - 1) } : { kind: 'source', index: -1 }
}

function patchSource(i: number, patch: Partial<SearchSource>) {
  const next = searchSources.value.map((s: SearchSource, idx: number) => idx === i ? { ...s, ...patch } : s)
  studio.updateBlockFieldMapping(props.block.id, { searchSources: next })
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}

function toggleSourceCol(i: number, col: string) {
  const cols = searchSources.value[i]?.columns ?? []
  patchSource(i, { columns: cols.includes(col) ? cols.filter((c: string) => c !== col) : [...cols, col] })
}

function sourceSchema(i: number) {
  return datasets.getSchema(searchSources.value[i]?.datasetId ?? '')
}

function addSearchJoin() {
  const firstSrc = searchSources.value[0]?.datasetId ?? ''
  const next: SearchJoin[] = [...searchJoins.value, { sourceDatasetId: firstSrc, datasetId: '', leftColumn: '', rightColumn: '', columns: [], type: 'left' }]
  studio.updateBlockFieldMapping(props.block.id, { searchJoins: next })
  active.value = { kind: 'search-join', index: next.length - 1 }
}

function removeSearchJoin(i: number) {
  const next = searchJoins.value.filter((_: SearchJoin, idx: number) => idx !== i)
  studio.updateBlockFieldMapping(props.block.id, { searchJoins: next })
  active.value = searchSources.value.length > 0 ? { kind: 'source', index: 0 } : { kind: 'source', index: -1 }
}

function patchSearchJoin(i: number, patch: Partial<SearchJoin>) {
  const next = searchJoins.value.map((j: SearchJoin, idx: number) => idx === i ? { ...j, ...patch } : j)
  studio.updateBlockFieldMapping(props.block.id, { searchJoins: next })
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}

function toggleSearchJoinCol(i: number, col: string) {
  const cols = searchJoins.value[i]?.columns ?? []
  patchSearchJoin(i, { columns: cols.includes(col) ? cols.filter((c: string) => c !== col) : [...cols, col] })
}

function searchJoinPrimSchema(i: number) {
  return datasets.getSchema(searchJoins.value[i]?.sourceDatasetId ?? '')
}

function searchJoinSecSchema(i: number) {
  return datasets.getSchema(searchJoins.value[i]?.datasetId ?? '')
}

function searchJoinLeftColGroup(i: number): ColumnGroup[] {
  const schema = searchJoinPrimSchema(i)
  if (!schema) return []
  const srcId = searchJoins.value[i]?.sourceDatasetId
  const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === srcId)?.name ?? 'Source'
  return [{ label: name, columns: schema.columns }]
}

function searchJoinRightColGroup(i: number): ColumnGroup[] {
  const schema = searchJoinSecSchema(i)
  if (!schema) return []
  const dsId = searchJoins.value[i]?.datasetId
  const name = datasets.readyDatasets.find((d: DatasetMeta) => d.id === dsId)?.name ?? 'Jointure'
  return [{ label: `Jointure — ${name}`, columns: schema.columns }]
}

// ─── Dataset search ───────────────────────────────────────────────────────────

const filteredDatasets = computed<DatasetMeta[]>(() => {
  const q = dsFilter.value.toLowerCase().trim()
  if (!q) return datasets.readyDatasets
  return datasets.readyDatasets.filter((d: DatasetMeta) => d.name.toLowerCase().includes(q))
})

// ─── Type badges ─────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  integer:  { label: '#',  cls: 'bg-amber-100 text-amber-700' },
  float:    { label: '~',  cls: 'bg-amber-100 text-amber-700' },
  string:   { label: 'T',  cls: 'bg-blue-100 text-blue-600' },
  date:     { label: 'd',  cls: 'bg-emerald-100 text-emerald-700' },
  datetime: { label: 'dt', cls: 'bg-emerald-100 text-emerald-700' },
  boolean:  { label: '?',  cls: 'bg-violet-100 text-violet-700' },
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6"
      @keydown="onKeydown"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <!-- Panel -->
      <div
        class="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style="max-height: min(85vh, 700px);"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">Sources de données</h3>
          </div>
          <button
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            @click="emit('close')"
          >×</button>
        </div>

        <!-- Body -->
        <div class="flex flex-1 min-h-0">

          <!-- ─── Left nav ─────────────────────────────────────────────────── -->
          <nav class="w-52 shrink-0 border-r border-slate-100 overflow-y-auto py-3 flex flex-col gap-0.5">

            <!-- DATA BLOCKS: Source principale + jointures -->
            <template v-if="!isSearch">
              <p class="px-4 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Source</p>

              <button
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="isActive({ kind: 'primary' })
                  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                style="width: calc(100% - 1rem);"
                @click="active = { kind: 'primary' }"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
                <span class="truncate">{{ primaryName ?? 'Source principale' }}</span>
                <span v-if="block.datasetId && primarySchema" class="ml-auto shrink-0 text-[9px] font-normal opacity-50">{{ primarySchema.columns.length }}</span>
              </button>

              <template v-if="joins.length > 0">
                <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Jointures</p>
                <button
                  v-for="(join, ji) in joins" :key="ji"
                  class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                  :class="isActive({ kind: 'join', index: ji })
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                  style="width: calc(100% - 1rem);"
                  @click="active = { kind: 'join', index: ji }"
                >
                  <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="truncate">{{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name ?? `Jointure ${ji + 1}` }}</p>
                    <p v-if="join.type" class="text-[9px] font-normal opacity-60 uppercase">{{ join.type }}</p>
                  </div>
                </button>
              </template>

              <div class="px-2 pt-2">
                <button
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-600"
                  @click="addJoin"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Jointure
                </button>
              </div>
            </template>

            <!-- SEARCH BLOCKS: Sources + search joins -->
            <template v-else>
              <p class="px-4 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Sources de recherche</p>

              <button
                v-for="(src, si) in searchSources" :key="si"
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="isActive({ kind: 'source', index: si })
                  ? 'bg-cyan-50 text-cyan-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                style="width: calc(100% - 1rem);"
                @click="active = { kind: 'source', index: si }"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="truncate">{{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? `Source ${si + 1}` }}</p>
                  <p v-if="src.columns.length" class="text-[9px] font-normal opacity-60">{{ src.columns.length }} col. cherchée{{ src.columns.length > 1 ? 's' : '' }}</p>
                </div>
              </button>

              <div class="px-2 pt-1">
                <button
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-600"
                  @click="addSource"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Source
                </button>
              </div>

              <template v-if="searchJoins.length > 0 || searchSources.some((s: SearchSource) => s.datasetId)">
                <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Jointures</p>
                <button
                  v-for="(join, ji) in searchJoins" :key="ji"
                  class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                  :class="isActive({ kind: 'search-join', index: ji })
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
                  style="width: calc(100% - 1rem);"
                  @click="active = { kind: 'search-join', index: ji }"
                >
                  <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="truncate">{{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === join.datasetId)?.name ?? `Jointure ${ji + 1}` }}</p>
                    <p v-if="join.type" class="text-[9px] font-normal opacity-60 uppercase">{{ join.type }}</p>
                  </div>
                </button>

                <div class="px-2 pt-1">
                  <button
                    class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-600"
                    @click="addSearchJoin"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Jointure
                  </button>
                </div>
              </template>
            </template>
          </nav>

          <!-- ─── Right content ────────────────────────────────────────────── -->
          <div class="flex-1 min-w-0 overflow-y-auto p-5 flex flex-col gap-5">

            <!-- ══ SOURCE PRINCIPALE (data blocks) ══ -->
            <template v-if="!isSearch && active.kind === 'primary'">
              <div>
                <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Dataset principal</p>

                <!-- Search -->
                <div class="relative mb-3">
                  <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    v-model="dsFilter"
                    type="text"
                    placeholder="Rechercher un dataset…"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 transition-all focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>

                <!-- Dataset list -->
                <div v-if="filteredDatasets.length > 0" class="flex flex-col gap-1.5">
                  <button
                    v-for="ds in filteredDatasets" :key="ds.id"
                    type="button"
                    class="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                    :class="block.datasetId === ds.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
                    @click="setDataset(ds.id)"
                  >
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                      </svg>
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-800 truncate">{{ ds.name }}</p>
                      <p class="text-[11px] text-slate-400">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
                    </div>
                    <svg v-if="block.datasetId === ds.id" class="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </div>
                <p v-else class="py-6 text-center text-xs italic text-slate-400">Aucun dataset disponible</p>
              </div>

              <!-- Column preview -->
              <div v-if="primarySchema">
                <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Colonnes <span class="font-normal normal-case tracking-normal">({{ primarySchema.columns.length }})</span></p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="col in primarySchema.columns.slice(0, 24)" :key="col.name"
                    class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1"
                  >
                    <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                    <span class="font-mono text-[11px] text-slate-600">{{ col.name }}</span>
                  </span>
                  <span v-if="primarySchema.columns.length > 24" class="flex items-center rounded-lg border border-dashed border-slate-200 px-2 py-1 text-[11px] text-slate-400">
                    +{{ primarySchema.columns.length - 24 }} colonnes
                  </span>
                </div>
              </div>
            </template>

            <!-- ══ JOIN (data blocks) ══ -->
            <template v-else-if="!isSearch && active.kind === 'join'">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Jointure {{ (active as { kind: 'join'; index: number }).index + 1 }}</p>
                <button
                  class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-100"
                  @click="removeJoin((active as { kind: 'join'; index: number }).index)"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  Supprimer
                </button>
              </div>

              <!-- Type LEFT/INNER -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Type de jointure</p>
                <div class="flex gap-2">
                  <button
                    v-for="t in [{ v: 'left', l: 'LEFT', desc: 'Toutes les lignes de la source' }, { v: 'inner', l: 'INNER', desc: 'Seulement les correspondances' }]"
                    :key="t.v"
                    class="flex-1 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="joins[(active as { kind: 'join'; index: number }).index]?.type === t.v
                      ? 'border-violet-300 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    @click="patchJoin((active as { kind: 'join'; index: number }).index, { type: t.v as 'left' | 'inner' })"
                  >
                    <p class="text-xs font-bold font-mono">{{ t.l }}</p>
                    <p class="mt-0.5 text-[10px] opacity-70">{{ t.desc }}</p>
                  </button>
                </div>
              </div>

              <!-- Dataset picker -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Dataset à joindre</p>
                <div class="relative mb-2">
                  <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input v-model="dsFilter" type="text" placeholder="Rechercher…" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                </div>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="ds in filteredDatasets.filter((d: DatasetMeta) => d.id !== block.datasetId)" :key="ds.id"
                    type="button"
                    class="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="joins[(active as { kind: 'join'; index: number }).index]?.datasetId === ds.id
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
                    @click="patchJoin((active as { kind: 'join'; index: number }).index, { datasetId: ds.id, leftColumn: '', rightColumn: '', columns: [] })"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-slate-700 truncate">{{ ds.name }}</p>
                      <p class="text-[10px] text-slate-400">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
                    </div>
                    <svg v-if="joins[(active as { kind: 'join'; index: number }).index]?.datasetId === ds.id" class="h-4 w-4 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Join keys -->
              <template v-if="joins[(active as { kind: 'join'; index: number }).index]?.datasetId">
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Clé de jointure</p>
                  <div class="flex items-center gap-2">
                    <ColumnButton
                      class="flex-1 min-w-0"
                      :model-value="joins[(active as { kind: 'join'; index: number }).index]?.leftColumn || null"
                      :block="block"
                      :custom-groups="primaryColGroup()"
                      placeholder="source"
                      @update:model-value="patchJoin((active as { kind: 'join'; index: number }).index, { leftColumn: $event as string })"
                    />
                    <span class="shrink-0 text-sm font-bold text-violet-400">=</span>
                    <ColumnButton
                      class="flex-1 min-w-0"
                      :model-value="joins[(active as { kind: 'join'; index: number }).index]?.rightColumn || null"
                      :block="block"
                      :custom-groups="joinColGroup((active as { kind: 'join'; index: number }).index)"
                      placeholder="jointure"
                      @update:model-value="patchJoin((active as { kind: 'join'; index: number }).index, { rightColumn: $event as string })"
                    />
                  </div>
                </div>

                <!-- Columns to include -->
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Colonnes à inclure</p>
                  <div v-if="joinSchema((active as { kind: 'join'; index: number }).index)" class="flex flex-wrap gap-1.5">
                    <button
                      v-for="col in joinSchema((active as { kind: 'join'; index: number }).index)!.columns" :key="col.name"
                      type="button"
                      class="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                      :class="joins[(active as { kind: 'join'; index: number }).index]?.columns.includes(col.name)
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50'"
                      @click="toggleJoinCol((active as { kind: 'join'; index: number }).index, col.name)"
                    >
                      <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                      <span class="font-mono">{{ col.name }}</span>
                      <svg v-if="joins[(active as { kind: 'join'; index: number }).index]?.columns.includes(col.name)" class="ml-0.5 h-3 w-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </button>
                  </div>
                  <p v-else class="text-[11px] text-slate-400 italic">Chargement du schéma…</p>
                </div>
              </template>
            </template>

            <!-- ══ SOURCE (search blocks) ══ -->
            <template v-else-if="isSearch && active.kind === 'source'">
              <template v-if="(active as { kind: 'source'; index: number }).index >= 0">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Source de recherche</p>
                  <button
                    v-if="searchSources.length > 0"
                    class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-100"
                    @click="removeSource((active as { kind: 'source'; index: number }).index)"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    Supprimer
                  </button>
                </div>

                <!-- Dataset picker -->
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Dataset</p>
                  <div class="relative mb-2">
                    <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input v-model="dsFilter" type="text" placeholder="Rechercher…" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <button
                      v-for="ds in filteredDatasets" :key="ds.id"
                      type="button"
                      class="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
                      :class="searchSources[(active as { kind: 'source'; index: number }).index]?.datasetId === ds.id
                        ? 'border-cyan-300 bg-cyan-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
                      @click="patchSource((active as { kind: 'source'; index: number }).index, { datasetId: ds.id, columns: [] })"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-slate-700 truncate">{{ ds.name }}</p>
                        <p class="text-[10px] text-slate-400">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
                      </div>
                      <svg v-if="searchSources[(active as { kind: 'source'; index: number }).index]?.datasetId === ds.id" class="h-4 w-4 shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Columns to search on -->
                <div v-if="sourceSchema((active as { kind: 'source'; index: number }).index)">
                  <p class="mb-1 text-[11px] font-semibold text-slate-600">Colonnes de recherche</p>
                  <p class="mb-2 text-[10px] text-slate-400">Colonnes sur lesquelles la recherche textuelle s'effectue</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="col in sourceSchema((active as { kind: 'source'; index: number }).index)!.columns" :key="col.name"
                      type="button"
                      class="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                      :class="searchSources[(active as { kind: 'source'; index: number }).index]?.columns.includes(col.name)
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50/50'"
                      @click="toggleSourceCol((active as { kind: 'source'; index: number }).index, col.name)"
                    >
                      <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                      <span class="font-mono">{{ col.name }}</span>
                      <svg v-if="searchSources[(active as { kind: 'source'; index: number }).index]?.columns.includes(col.name)" class="ml-0.5 h-3 w-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </button>
                  </div>
                </div>
              </template>

              <!-- Empty state: no source yet -->
              <template v-else>
                <div class="flex h-full flex-col items-center justify-center gap-3 text-center py-12">
                  <svg class="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-slate-600">Aucune source configurée</p>
                    <p class="mt-1 text-xs text-slate-400">Ajoutez une source de recherche via le panneau gauche</p>
                  </div>
                </div>
              </template>
            </template>

            <!-- ══ SEARCH JOIN (search blocks) ══ -->
            <template v-else-if="isSearch && active.kind === 'search-join'">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Jointure {{ (active as { kind: 'search-join'; index: number }).index + 1 }}</p>
                <button
                  class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-100"
                  @click="removeSearchJoin((active as { kind: 'search-join'; index: number }).index)"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  Supprimer
                </button>
              </div>

              <!-- Source to enrich -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Enrichit les résultats de</p>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="src in searchSources.filter((s: SearchSource) => s.datasetId)" :key="src.datasetId"
                    type="button"
                    class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId === src.datasetId
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { sourceDatasetId: src.datasetId, leftColumn: '' })"
                  >
                    <svg class="h-3.5 w-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <span class="text-xs font-medium text-slate-700">{{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? src.datasetId }}</span>
                    <svg v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId === src.datasetId" class="ml-auto h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </button>
                </div>
              </div>

              <!-- Type LEFT/INNER -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Type de jointure</p>
                <div class="flex gap-2">
                  <button
                    v-for="t in [{ v: 'left', l: 'LEFT', desc: 'Toutes les lignes source' }, { v: 'inner', l: 'INNER', desc: 'Seulement les correspondances' }]"
                    :key="t.v"
                    class="flex-1 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.type === t.v
                      ? 'border-violet-300 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { type: t.v as 'left' | 'inner' })"
                  >
                    <p class="text-xs font-bold font-mono">{{ t.l }}</p>
                    <p class="mt-0.5 text-[10px] opacity-70">{{ t.desc }}</p>
                  </button>
                </div>
              </div>

              <!-- Join dataset -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Dataset à joindre</p>
                <div class="relative mb-2">
                  <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input v-model="dsFilter" type="text" placeholder="Rechercher…" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                </div>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="ds in filteredDatasets.filter((d: DatasetMeta) => d.id !== searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId)" :key="ds.id"
                    type="button"
                    class="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.datasetId === ds.id
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { datasetId: ds.id, rightColumn: '', columns: [] })"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-slate-700 truncate">{{ ds.name }}</p>
                      <p class="text-[10px] text-slate-400">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
                    </div>
                    <svg v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.datasetId === ds.id" class="h-4 w-4 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Join keys -->
              <template v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId && searchJoins[(active as { kind: 'search-join'; index: number }).index]?.datasetId">
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Clé de jointure</p>
                  <div class="flex items-center gap-2">
                    <ColumnButton
                      class="flex-1 min-w-0"
                      :model-value="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.leftColumn || null"
                      :block="block"
                      :custom-groups="searchJoinLeftColGroup((active as { kind: 'search-join'; index: number }).index)"
                      placeholder="source"
                      @update:model-value="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { leftColumn: $event as string })"
                    />
                    <span class="shrink-0 text-sm font-bold text-violet-400">=</span>
                    <ColumnButton
                      class="flex-1 min-w-0"
                      :model-value="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.rightColumn || null"
                      :block="block"
                      :custom-groups="searchJoinRightColGroup((active as { kind: 'search-join'; index: number }).index)"
                      placeholder="jointure"
                      @update:model-value="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { rightColumn: $event as string })"
                    />
                  </div>
                </div>

                <!-- Columns to retrieve -->
                <div>
                  <p class="mb-1 text-[11px] font-semibold text-slate-600">Colonnes à récupérer</p>
                  <p class="mb-2 text-[10px] text-slate-400">Colonnes disponibles pour l'affichage des résultats et les paramètres URL</p>
                  <div v-if="searchJoinSecSchema((active as { kind: 'search-join'; index: number }).index)" class="flex flex-wrap gap-1.5">
                    <button
                      v-for="col in searchJoinSecSchema((active as { kind: 'search-join'; index: number }).index)!.columns" :key="col.name"
                      type="button"
                      class="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                      :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.columns.includes(col.name)
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50'"
                      @click="toggleSearchJoinCol((active as { kind: 'search-join'; index: number }).index, col.name)"
                    >
                      <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                      <span class="font-mono">{{ col.name }}</span>
                      <svg v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.columns.includes(col.name)" class="ml-0.5 h-3 w-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </button>
                  </div>
                  <p v-else class="text-[11px] text-slate-400 italic">Chargement…</p>
                </div>
              </template>
            </template>

          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3">
          <button
            class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            @click="emit('close')"
          >Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
