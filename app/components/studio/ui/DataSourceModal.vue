<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetMeta, BlockJoin, BlockSource, SearchSource, SearchJoin } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import { primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'

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
  | { kind: 'block-source'; index: number }
  | { kind: 'join'; index: number }
  | { kind: 'source'; index: number }
  | { kind: 'search-join'; index: number }

const active = ref<NavItem>({ kind: 'block-source', index: 0 })
const dsFilter = ref('')

watch(() => props.show, (open) => {
  if (!open) return
  dsFilter.value = ''
  if (isSearch.value) {
    active.value = searchSources.value.length > 0 ? { kind: 'source', index: 0 } : { kind: 'source', index: -1 }
  } else {
    active.value = { kind: 'block-source', index: 0 }
  }
  // Pre-load schemas
  blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id))
  ;(props.block.fieldMapping.searchSources ?? []).forEach((s: SearchSource) => { if (s.datasetId) datasets.loadSchema(s.datasetId) })
  ;(props.block.fieldMapping.searchJoins ?? []).forEach((j: SearchJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
})

function isActive(item: NavItem): boolean {
  if (item.kind !== active.value.kind) return false
  return (active.value as { index: number }).index === item.index
}

// ─── Data block : sources + graphe de jointures ─────────────────────────────

const blockSources = computed<BlockSource[]>(() => props.block.sources ?? [])
const primaryId = computed(() => primarySourceId(props.block))
const isLive = computed(() => blockSources.value.some(
  (s) => datasets.readyDatasets.find((d: DatasetMeta) => d.id === s.datasetId)?.materialization === 'live',
))

function sourceLabel(s: BlockSource): string {
  return s.alias || datasets.readyDatasets.find((d: DatasetMeta) => d.id === s.datasetId)?.name || s.id
}
function blockSourceSchema(id: string) {
  const src = blockSources.value.find((s) => s.id === id)
  return src ? datasets.getSchema(src.datasetId) : undefined
}
/** Groupe de colonnes d'une source pour un picker de CLÉ de jointure : refs nues
 *  (une clé nomme une colonne dans son propre dataset, pas une ref multi-sources). */
function sourceColGroup(id: string): ColumnGroup[] {
  const schema = blockSourceSchema(id)
  const src = blockSources.value.find((s) => s.id === id)
  if (!schema || !src) return []
  return [{ label: sourceLabel(src), columns: schema.columns }]
}

function addSourceToBlock(datasetId: string) {
  const id = studio.addBlockSource(props.block.id, datasetId)
  datasets.loadSchema(datasetId)
  if (id) active.value = { kind: 'block-source', index: blockSources.value.findIndex((s) => s.id === id) }
}
function pickSourceDataset(i: number, datasetId: string) {
  const cur = blockSources.value[i]
  if (!cur) { addSourceToBlock(datasetId); return }
  const next = blockSources.value.map((s, idx) => idx === i ? { ...s, datasetId } : s)
  studio.updateBlockSources(props.block.id, next)
  datasets.loadSchema(datasetId)
}
function setAlias(i: number, alias: string) {
  const next = blockSources.value.map((s, idx) => idx === i ? { ...s, alias: alias || undefined } : s)
  studio.updateBlockSources(props.block.id, next)
}
function removeBlockSourceAt(i: number) {
  const src = blockSources.value[i]
  if (!src) return
  studio.removeBlockSource(props.block.id, src.id)
  active.value = { kind: 'block-source', index: 0 }
}
function makePrimary(i: number) {
  const src = blockSources.value[i]
  if (src) studio.setPrimarySource(props.block.id, src.id)
}

// ─── Jointures ───────────────────────────────────────────────────────────────

const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])

function addJoin() {
  const s = blockSources.value
  const next: BlockJoin[] = [...joins.value, {
    leftSourceId: primaryId.value,
    leftColumn: '',
    rightSourceId: s.find((x) => x.id !== primaryId.value)?.id ?? '',
    rightColumn: '',
    type: 'left',
  }]
  studio.updateBlockJoins(props.block.id, next)
  active.value = { kind: 'join', index: next.length - 1 }
}
function removeJoin(i: number) {
  studio.updateBlockJoins(props.block.id, joins.value.filter((_, idx) => idx !== i))
  active.value = { kind: 'block-source', index: 0 }
}
function patchJoin(i: number, patch: Partial<BlockJoin>) {
  studio.updateBlockJoins(props.block.id, joins.value.map((j, idx) => idx === i ? { ...j, ...patch } : j))
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
      <div class="absolute inset-0 bg-[rgba(18,18,26,0.5)] backdrop-blur-[3px]" @click="emit('close')" />

      <!-- Panel -->
      <div
        class="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-[var(--studio-line)] bg-white shadow-[var(--studio-shadow-modal)]"
        style="max-height: min(85vh, 700px);"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--studio-line)] px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[var(--studio-muted)]">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-[var(--studio-ink)]">Sources de données</h3>
          </div>
          <button
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-[var(--studio-faint)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--studio-ink)]"
            @click="emit('close')"
          >×</button>
        </div>

        <!-- Body -->
        <div class="flex flex-1 min-h-0">

          <!-- ─── Left nav ─────────────────────────────────────────────────── -->
          <nav class="w-52 shrink-0 border-r border-[var(--studio-line)] overflow-y-auto py-3 flex flex-col gap-0.5">

            <!-- DATA BLOCKS: Sources + graphe de jointures -->
            <template v-if="!isSearch">
              <p class="px-4 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--studio-faint)]">Sources</p>

              <button
                v-for="(src, si) in blockSources" :key="src.id"
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="isActive({ kind: 'block-source', index: si })
                  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)] hover:text-[var(--studio-ink)]'"
                style="width: calc(100% - 1rem);"
                @click="active = { kind: 'block-source', index: si }"
              >
                <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
                <span class="truncate">{{ sourceLabel(src) }}</span>
                <span v-if="src.id === primaryId" class="ml-auto shrink-0 text-[9px] font-bold uppercase opacity-70">★</span>
              </button>

              <div class="px-2 pt-1">
                <button
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--studio-line-strong)] py-1.5 text-[11px] font-medium text-[var(--studio-faint)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  @click="addSourceToBlock('')"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Source
                </button>
              </div>

              <template v-if="blockSources.length > 1">
                <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--studio-faint)]">Jointures</p>
                <button
                  v-for="(join, ji) in joins" :key="ji"
                  class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                  :class="isActive({ kind: 'join', index: ji })
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)] hover:text-[var(--studio-ink)]'"
                  style="width: calc(100% - 1rem);"
                  @click="active = { kind: 'join', index: ji }"
                >
                  <svg class="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="truncate">{{ blockSources.find((s) => s.id === join.leftSourceId) ? sourceLabel(blockSources.find((s) => s.id === join.leftSourceId)!) : '?' }} ⋈ {{ blockSources.find((s) => s.id === join.rightSourceId) ? sourceLabel(blockSources.find((s) => s.id === join.rightSourceId)!) : '?' }}</p>
                    <p v-if="join.type" class="text-[9px] font-normal opacity-60 uppercase">{{ join.type }}</p>
                  </div>
                </button>

                <div class="px-2 pt-1">
                  <button
                    class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--studio-line-strong)] py-1.5 text-[11px] font-medium text-[var(--studio-faint)] transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-600 disabled:opacity-40"
                    :disabled="isLive"
                    @click="addJoin"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Jointure
                  </button>
                </div>
              </template>
              <p v-if="isLive" class="px-4 pt-2 text-[10px] leading-snug text-[var(--studio-faint)]">
                Une source en direct ne peut pas être jointe à d'autres sources.
              </p>
            </template>

            <!-- SEARCH BLOCKS: Sources + search joins -->
            <template v-else>
              <p class="px-4 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--studio-faint)]">Sources de recherche</p>

              <button
                v-for="(src, si) in searchSources" :key="si"
                class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                :class="isActive({ kind: 'source', index: si })
                  ? 'bg-cyan-50 text-cyan-700 font-semibold'
                  : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)] hover:text-[var(--studio-ink)]'"
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
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--studio-line-strong)] py-1.5 text-[11px] font-medium text-[var(--studio-faint)] transition-colors hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-600"
                  @click="addSource"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Source
                </button>
              </div>

              <template v-if="searchJoins.length > 0 || searchSources.some((s: SearchSource) => s.datasetId)">
                <p class="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--studio-faint)]">Jointures</p>
                <button
                  v-for="(join, ji) in searchJoins" :key="ji"
                  class="flex w-full items-center gap-2 rounded-lg mx-2 px-3 py-2 text-left text-xs transition-all"
                  :class="isActive({ kind: 'search-join', index: ji })
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)] hover:text-[var(--studio-ink)]'"
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
                    class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--studio-line-strong)] py-1.5 text-[11px] font-medium text-[var(--studio-faint)] transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-600"
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

            <!-- ══ SOURCE (data blocks) ══ -->
            <template v-if="!isSearch && active.kind === 'block-source'">
              <template v-for="(src, si) in blockSources" :key="src.id">
                <template v-if="si === (active as { index: number }).index">
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">
                      Source {{ si + 1 }}<span v-if="src.id === primaryId" class="ml-1.5 text-[var(--color-primary)]">· principale</span>
                    </p>
                    <div class="flex items-center gap-1.5">
                      <button
                        v-if="src.id !== primaryId"
                        class="rounded-lg border border-[var(--studio-line-strong)] px-2 py-1 text-[10px] font-medium text-[var(--studio-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        @click="makePrimary(si)"
                      >Définir principale</button>
                      <button
                        v-if="blockSources.length > 1"
                        class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-100"
                        @click="removeBlockSourceAt(si)"
                      >Retirer</button>
                    </div>
                  </div>

                  <div>
                    <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Dataset</p>
                    <div class="relative mb-2">
                      <input v-model="dsFilter" type="text" placeholder="Rechercher un dataset…" class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] py-2 px-3 text-xs text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none transition-all" />
                    </div>
                    <div v-if="filteredDatasets.length > 0" class="flex flex-col gap-1.5">
                      <button
                        v-for="ds in filteredDatasets" :key="ds.id"
                        type="button"
                        class="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                        :class="src.datasetId === ds.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                          : 'border-[var(--studio-line-strong)] bg-white hover:border-slate-300 hover:bg-[var(--studio-note)]'"
                        @click="pickSourceDataset(si, ds.id)"
                      >
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-[var(--studio-ink)] truncate">{{ ds.name }}</p>
                          <p class="text-[11px] text-[var(--studio-faint)]">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes{{ ds.materialization === 'live' ? ' · direct' : '' }}</p>
                        </div>
                        <svg v-if="src.datasetId === ds.id" class="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    </div>
                    <p v-else class="py-6 text-center text-xs italic text-[var(--studio-faint)]">Aucun dataset disponible</p>
                  </div>

                  <div v-if="src.datasetId">
                    <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Alias (optionnel)</p>
                    <input
                      :value="src.alias ?? ''"
                      type="text"
                      :placeholder="sourceLabel(src)"
                      class="w-full rounded-xl border border-[var(--studio-line-strong)] py-2 px-3 text-xs text-[var(--studio-ink)] focus:border-[var(--color-primary)] focus:outline-none"
                      @change="setAlias(si, ($event.target as HTMLInputElement).value)"
                    />
                  </div>

                  <div v-if="blockSourceSchema(src.id)">
                    <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Colonnes <span class="font-normal normal-case tracking-normal">({{ blockSourceSchema(src.id)!.columns.length }})</span></p>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="col in blockSourceSchema(src.id)!.columns.slice(0, 24)" :key="col.name"
                        class="flex items-center gap-1 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1"
                      >
                        <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-[var(--studio-muted)]'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                        <span class="font-mono text-[11px] text-[var(--studio-muted)]">{{ col.name }}</span>
                      </span>
                    </div>
                  </div>
                </template>
              </template>
              <p v-if="!blockSources.length" class="py-10 text-center text-[13px] text-[var(--studio-faint)]">
                Ajoutez une source avec le bouton « + Source ».
              </p>
            </template>

            <!-- ══ JOIN (data blocks) ══ -->
            <template v-else-if="!isSearch && active.kind === 'join'">
              <template v-for="(join, ji) in joins" :key="ji">
                <template v-if="ji === (active as { index: number }).index">
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Jointure {{ ji + 1 }}</p>
                    <button
                      class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-100"
                      @click="removeJoin(ji)"
                    >
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      Supprimer
                    </button>
                  </div>

                  <!-- Type LEFT/INNER -->
                  <div>
                    <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Type de jointure</p>
                    <div class="flex gap-2">
                      <button
                        v-for="t in [{ v: 'left', l: 'LEFT', desc: 'Toutes les lignes de gauche' }, { v: 'inner', l: 'INNER', desc: 'Seulement les correspondances' }]"
                        :key="t.v"
                        class="flex-1 rounded-xl border px-3 py-2 text-left transition-all"
                        :class="join.type === t.v
                          ? 'border-violet-300 bg-violet-50 text-violet-700'
                          : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-slate-300'"
                        @click="patchJoin(ji, { type: t.v as 'left' | 'inner' })"
                      >
                        <p class="text-xs font-bold font-mono">{{ t.l }}</p>
                        <p class="mt-0.5 text-[10px] opacity-70">{{ t.desc }}</p>
                      </button>
                    </div>
                  </div>

                  <!-- Sources reliées -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Source gauche</p>
                      <select
                        class="w-full rounded-xl border border-[var(--studio-line-strong)] py-2 px-2.5 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                        :value="join.leftSourceId"
                        @change="patchJoin(ji, { leftSourceId: ($event.target as HTMLSelectElement).value, leftColumn: '' })"
                      >
                        <option v-for="s in blockSources" :key="s.id" :value="s.id">{{ sourceLabel(s) }}</option>
                      </select>
                    </div>
                    <div>
                      <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Source droite</p>
                      <select
                        class="w-full rounded-xl border border-[var(--studio-line-strong)] py-2 px-2.5 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                        :value="join.rightSourceId"
                        @change="patchJoin(ji, { rightSourceId: ($event.target as HTMLSelectElement).value, rightColumn: '' })"
                      >
                        <option v-for="s in blockSources" :key="s.id" :value="s.id">{{ sourceLabel(s) }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Clé de jointure -->
                  <div>
                    <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Clé de jointure</p>
                    <div class="flex items-center gap-2">
                      <ColumnButton
                        class="flex-1 min-w-0"
                        :model-value="join.leftColumn || null"
                        :block="block"
                        :custom-groups="sourceColGroup(join.leftSourceId)"
                        placeholder="gauche"
                        @update:model-value="patchJoin(ji, { leftColumn: $event as string })"
                      />
                      <span class="shrink-0 text-sm font-bold text-violet-400">=</span>
                      <ColumnButton
                        class="flex-1 min-w-0"
                        :model-value="join.rightColumn || null"
                        :block="block"
                        :custom-groups="sourceColGroup(join.rightSourceId)"
                        placeholder="droite"
                        @update:model-value="patchJoin(ji, { rightColumn: $event as string })"
                      />
                    </div>
                    <p class="mt-1.5 text-[10px] text-[var(--studio-faint)]">
                      Les colonnes des sources jointes sont disponibles dans tous les sélecteurs du bloc.
                    </p>
                  </div>
                </template>
              </template>
            </template>

            <!-- ══ SOURCE (search blocks) ══ -->
            <template v-else-if="isSearch && active.kind === 'source'">
              <template v-if="(active as { kind: 'source'; index: number }).index >= 0">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Source de recherche</p>
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
                  <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Dataset</p>
                  <div class="relative mb-2">
                    <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input v-model="dsFilter" type="text" placeholder="Rechercher…" class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] py-2 pl-8 pr-3 text-xs text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none  transition-all" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <button
                      v-for="ds in filteredDatasets" :key="ds.id"
                      type="button"
                      class="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
                      :class="searchSources[(active as { kind: 'source'; index: number }).index]?.datasetId === ds.id
                        ? 'border-cyan-300 bg-cyan-50'
                        : 'border-[var(--studio-line-strong)] bg-white hover:border-slate-300 hover:bg-[var(--studio-note)]'"
                      @click="patchSource((active as { kind: 'source'; index: number }).index, { datasetId: ds.id, columns: [] })"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-[var(--studio-ink)] truncate">{{ ds.name }}</p>
                        <p class="text-[10px] text-[var(--studio-faint)]">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
                      </div>
                      <svg v-if="searchSources[(active as { kind: 'source'; index: number }).index]?.datasetId === ds.id" class="h-4 w-4 shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Columns to search on -->
                <div v-if="sourceSchema((active as { kind: 'source'; index: number }).index)">
                  <p class="mb-1 text-[11px] font-semibold text-[var(--studio-muted)]">Colonnes de recherche</p>
                  <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Colonnes sur lesquelles la recherche textuelle s'effectue</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="col in sourceSchema((active as { kind: 'source'; index: number }).index)!.columns" :key="col.name"
                      type="button"
                      class="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                      :class="searchSources[(active as { kind: 'source'; index: number }).index]?.columns.includes(col.name)
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                        : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-cyan-200 hover:bg-cyan-50/50'"
                      @click="toggleSourceCol((active as { kind: 'source'; index: number }).index, col.name)"
                    >
                      <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-[var(--studio-muted)]'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
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
                    <p class="text-sm font-medium text-[var(--studio-muted)]">Aucune source configurée</p>
                    <p class="mt-1 text-xs text-[var(--studio-faint)]">Ajoutez une source de recherche via le panneau gauche</p>
                  </div>
                </div>
              </template>
            </template>

            <!-- ══ SEARCH JOIN (search blocks) ══ -->
            <template v-else-if="isSearch && active.kind === 'search-join'">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Jointure {{ (active as { kind: 'search-join'; index: number }).index + 1 }}</p>
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
                <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Enrichit les résultats de</p>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="src in searchSources.filter((s: SearchSource) => s.datasetId)" :key="src.datasetId"
                    type="button"
                    class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId === src.datasetId
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-[var(--studio-line-strong)] bg-white hover:border-slate-300'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { sourceDatasetId: src.datasetId, leftColumn: '' })"
                  >
                    <svg class="h-3.5 w-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <span class="text-xs font-medium text-[var(--studio-ink)]">{{ datasets.readyDatasets.find((d: DatasetMeta) => d.id === src.datasetId)?.name ?? src.datasetId }}</span>
                    <svg v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId === src.datasetId" class="ml-auto h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </button>
                </div>
              </div>

              <!-- Type LEFT/INNER -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Type de jointure</p>
                <div class="flex gap-2">
                  <button
                    v-for="t in [{ v: 'left', l: 'LEFT', desc: 'Toutes les lignes source' }, { v: 'inner', l: 'INNER', desc: 'Seulement les correspondances' }]"
                    :key="t.v"
                    class="flex-1 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.type === t.v
                      ? 'border-violet-300 bg-violet-50 text-violet-700'
                      : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-slate-300'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { type: t.v as 'left' | 'inner' })"
                  >
                    <p class="text-xs font-bold font-mono">{{ t.l }}</p>
                    <p class="mt-0.5 text-[10px] opacity-70">{{ t.desc }}</p>
                  </button>
                </div>
              </div>

              <!-- Join dataset -->
              <div>
                <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Dataset à joindre</p>
                <div class="relative mb-2">
                  <svg class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input v-model="dsFilter" type="text" placeholder="Rechercher…" class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] py-2 pl-8 pr-3 text-xs text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none  transition-all" />
                </div>
                <div class="flex flex-col gap-1">
                  <button
                    v-for="ds in filteredDatasets.filter((d: DatasetMeta) => d.id !== searchJoins[(active as { kind: 'search-join'; index: number }).index]?.sourceDatasetId)" :key="ds.id"
                    type="button"
                    class="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
                    :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.datasetId === ds.id
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-[var(--studio-line-strong)] bg-white hover:border-slate-300 hover:bg-[var(--studio-note)]'"
                    @click="patchSearchJoin((active as { kind: 'search-join'; index: number }).index, { datasetId: ds.id, rightColumn: '', columns: [] })"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-[var(--studio-ink)] truncate">{{ ds.name }}</p>
                      <p class="text-[10px] text-[var(--studio-faint)]">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</p>
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
                  <p class="mb-1.5 text-[11px] font-semibold text-[var(--studio-muted)]">Clé de jointure</p>
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
                  <p class="mb-1 text-[11px] font-semibold text-[var(--studio-muted)]">Colonnes à récupérer</p>
                  <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Colonnes disponibles pour l'affichage des résultats et les paramètres URL</p>
                  <div v-if="searchJoinSecSchema((active as { kind: 'search-join'; index: number }).index)" class="flex flex-wrap gap-1.5">
                    <button
                      v-for="col in searchJoinSecSchema((active as { kind: 'search-join'; index: number }).index)!.columns" :key="col.name"
                      type="button"
                      class="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all"
                      :class="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.columns.includes(col.name)
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-violet-200 hover:bg-violet-50/50'"
                      @click="toggleSearchJoinCol((active as { kind: 'search-join'; index: number }).index, col.name)"
                    >
                      <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-[var(--studio-muted)]'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                      <span class="font-mono">{{ col.name }}</span>
                      <svg v-if="searchJoins[(active as { kind: 'search-join'; index: number }).index]?.columns.includes(col.name)" class="ml-0.5 h-3 w-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </button>
                  </div>
                  <p v-else class="text-[11px] text-[var(--studio-faint)] italic">Chargement…</p>
                </div>
              </template>
            </template>

          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-end border-t border-[var(--studio-line)] px-5 py-3">
          <button
            class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            @click="emit('close')"
          >Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
