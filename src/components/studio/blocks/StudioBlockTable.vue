<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import { buildStatsDataQueryForTable } from '@/lib/statsdata-query-build'
import { formatApiErrorDetail } from '@/lib/http-errors'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveTableFromBinding, sourceToTabular, findDataSource } from '@/types/studio-data-source'
import { searchStatsDataSourceExternal } from '@/api/statsdata-sources'

type Payload = {
  type: 'table'
  caption: string
  dataBinding: StudioBlockDataBinding
  query?: StatsDataAnyQueryRequest
  search?: StudioTableSearchConfig
  filters?: StudioTableFilterConfig
}

const props = withDefaults(
  defineProps<{
    payload: Payload
    fieldId: string
    editable?: boolean
  }>(),
  { editable: true },
)

const emit = defineEmits<{
  'update:payload': [Payload]
}>()

const sources = inject(studioDataSourcesKey, ref([]))
const widgetCtx = inject(
  studioStatsDataWidgetKey,
  computed(() => ({
    enabled: false,
    documentId: null as string | null,
    executeQuery: async () => [] as Record<string, unknown>[],
  })),
)

const localTable = computed(() => resolveTableFromBinding(props.payload.dataBinding, sources.value))

const remoteHeaders = ref<string[]>([])
const remoteRows = ref<string[][]>([])
const remoteError = ref<string | null>(null)
const remoteLoading = ref(false)
const pageIndex = ref(0)
const pageSize = ref(500)
const hasNextPage = ref(false)
const searchMode = ref<'page' | 'api'>('page')
const searchDraft = ref('')
const filterDrafts = ref<Record<string, string>>({})

watch(
  () => props.payload.search?.mode,
  (m) => {
    if (m === 'api' || m === 'page') searchMode.value = m
    else searchMode.value = 'page'
  },
  { immediate: true },
)

const headerFallback = computed(() => {
  const src = findDataSource(sources.value, props.payload.dataBinding.sourceId)
  if (!src) return [] as string[]
  return sourceToTabular(src).headers
})

const effectiveQuery = computed(() => {
  const q = props.payload.query as any
  if (q?.specVersion === 2 && Array.isArray(q.sources) && Array.isArray(q.select) && q.sources.length && q.select.length) {
    return q as StatsDataQueryRequestV2
  }
  if ((props.payload.query as StatsDataQueryRequest | undefined)?.sources?.length && (props.payload.query as StatsDataQueryRequest).columns?.length) {
    return props.payload.query
  }
  return buildStatsDataQueryForTable(
    props.payload.dataBinding,
    undefined,
    headerFallback.value,
  )
})

const pagedQuery = computed<StatsDataAnyQueryRequest>(() => {
  const q = effectiveQuery.value
  const baseLimit = typeof (q as any).limit === 'number' && Number.isFinite((q as any).limit) ? (q as any).limit : undefined
  const limit = Math.max(1, Math.min(baseLimit ?? pageSize.value, 10_000))
  const offset = Math.max(0, pageIndex.value * limit)
  const searchQ = searchDraft.value.trim()
  const search =
    widgetCtx.value.enabled && searchMode.value === 'api' && props.payload.search?.enabled === true && searchQ
      ? { q: searchQ }
      : undefined
  return { ...(q as any), limit, offset, ...(search ? { search } : {}) } as StatsDataAnyQueryRequest
})

const externalSearchField = computed((): string | null => {
  const b = props.payload
  const q = effectiveQuery.value
  if (!b.search?.enabled) return null
  if ((q as any)?.specVersion === 2) return null
  const selectedLabels = b.search.columnLabels?.length ? new Set(b.search.columnLabels) : null
  const cols = (q as StatsDataQueryRequest).columns ?? []
  const candidates = selectedLabels
    ? cols.filter((c) => selectedLabels.has(c.label))
    : cols
  for (const c of candidates) {
    const parts = String(c.from ?? '').split('.', 2)
    const field = (parts[1] ?? '').trim()
    if (field) return field
  }
  return null
})

const runRemoteQuery = async () => {
  remoteError.value = null
  if (!widgetCtx.value.enabled) {
    remoteHeaders.value = []
    remoteRows.value = []
    hasNextPage.value = false
    return
  }
  const q = pagedQuery.value
  const isV2 = (q as any)?.specVersion === 2
  const hasCols = isV2 ? (q as StatsDataQueryRequestV2).select.length > 0 : (q as StatsDataQueryRequest).columns.length > 0
  const hasSources = (q as any).sources?.length > 0
  if (!hasSources || !hasCols) {
    remoteHeaders.value = []
    remoteRows.value = []
    hasNextPage.value = false
    return
  }
  remoteLoading.value = true
  try {
    const activeSourceId = (q as any).sources[0]?.sourceId ?? ''
    const src = activeSourceId ? findDataSource(sources.value, activeSourceId) : undefined
    const canExternal =
      searchMode.value === 'api' &&
      typeof (q.search?.q ?? '') === 'string' &&
      (q.search?.q ?? '').trim().length > 0 &&
      (q as any).sources.length === 1 &&
      src?.kind === 'api' &&
      typeof src.apiSearchTemplate === 'string' &&
      src.apiSearchTemplate.trim().length > 0 &&
      typeof widgetCtx.value.documentId === 'string' &&
      widgetCtx.value.documentId.length > 0
      && !isV2

    const rows = canExternal
      ? (
          await searchStatsDataSourceExternal(widgetCtx.value.documentId!, activeSourceId, {
            q: q.search!.q,
            f: externalSearchField.value,
            limit: (q as any).limit,
            offset: (q as any).offset,
            columns: (q as StatsDataQueryRequest).columns.map((c) => ({ label: c.label, from: c.from })),
          })
        ).rows
      : await widgetCtx.value.executeQuery(q)
    if (!rows.length) {
      remoteHeaders.value = []
      remoteRows.value = []
      hasNextPage.value = false
      return
    }
    const headers = isV2
      ? (q as StatsDataQueryRequestV2).select.map((c) => c.label)
      : (q as StatsDataQueryRequest).columns.map((c) => c.label)
    const body = rows.map((r) => headers.map((h) => String(r[h] ?? '')))
    remoteHeaders.value = headers
    remoteRows.value = body
    hasNextPage.value = rows.length >= (((q as any).limit as number | undefined) ?? pageSize.value)
  } catch (e) {
    remoteError.value = formatApiErrorDetail(e, 'Requête tableau impossible.')
    remoteHeaders.value = []
    remoteRows.value = []
    hasNextPage.value = false
  } finally {
    remoteLoading.value = false
  }
}

watch(
  () => [widgetCtx.value.enabled, props.payload] as const,
  () => {
    pageIndex.value = 0
    void runRemoteQuery()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.fieldId,
  () => {
    searchDraft.value = ''
    filterDrafts.value = {}
  },
)

const table = computed(() => {
  if (widgetCtx.value.enabled) {
    return { headers: remoteHeaders.value, rows: remoteRows.value }
  }
  return localTable.value
})

const displayedTable = computed(() => {
  const { headers, rows } = filteredTable.value
  const keys = props.payload.dataBinding.visibleColumnKeys ?? []
  if (!keys.length) return { headers, rows }
  const wanted = new Set(keys)
  const idxs = headers
    .map((h, i) => (wanted.has(h) ? i : -1))
    .filter((i) => i >= 0)
  if (!idxs.length) return { headers: [] as string[], rows: [] as string[][] }
  return {
    headers: idxs.map((i) => headers[i]!),
    rows: rows.map((r) => idxs.map((i) => String(r[i] ?? ''))),
  }
})

/** Indices de colonnes interrogées par la recherche (libellés = en-têtes affichés). */
function searchableColumnIndices(headers: string[], cfg: StudioTableSearchConfig | undefined): number[] | null {
  if (!cfg?.enabled) return null
  if (!cfg.columnLabels.length) return headers.map((_, i) => i)
  const wanted = new Set(cfg.columnLabels)
  const idxs = headers.map((h, i) => (wanted.has(h) ? i : -1)).filter((i) => i >= 0)
  if (cfg.columnLabels.length > 0 && idxs.length === 0) return []
  return idxs
}

const filteredTable = computed(() => {
  const { headers, rows } = table.value
  const searched = (() => {
    if (widgetCtx.value.enabled && searchMode.value === 'api') return { headers, rows }
    const cfg = props.payload.search
    const idxs = searchableColumnIndices(headers, cfg)
    if (idxs === null) return { headers, rows }
    const q = searchDraft.value.trim().toLowerCase()
    if (!q) return { headers, rows }
    if (idxs.length === 0) return { headers, rows: [] as string[][] }
    return {
      headers,
      rows: rows.filter((row) => idxs.some((i) => String(row[i] ?? '').toLowerCase().includes(q))),
    }
  })()

  const fcfg = props.payload.filters
  if (!fcfg?.enabled) return searched
  const selected = fcfg.columnLabels?.length ? new Set(fcfg.columnLabels) : null
  const active = Object.entries(filterDrafts.value)
    .map(([k, v]) => [k, v.trim().toLowerCase()] as const)
    .filter(([, v]) => v.length > 0)
  if (active.length === 0) return searched

  const headerToIndex = new Map(searched.headers.map((h, i) => [h, i] as const))
  return {
    headers: searched.headers,
    rows: searched.rows.filter((row) => {
      for (const [label, needle] of active) {
        if (selected && !selected.has(label)) continue
        const idx =
          headerToIndex.get(label) ?? (label.includes('.') ? headerToIndex.get(label.split('.').slice(1).join('.')) : undefined)
        if (idx == null) continue
        const cell = String(row[idx] ?? '').toLowerCase()
        if (!cell.includes(needle)) return false
      }
      return true
    }),
  }
})

const showSearchBar = computed(() => props.payload.search?.enabled === true && table.value.headers.length > 0)
const showFiltersRow = computed(() => props.payload.filters?.enabled === true && table.value.headers.length > 0)

const isFilterColumnEnabled = (label: string) => {
  const cfg = props.payload.filters
  if (!cfg?.enabled) return false
  if (!cfg.columnLabels?.length) return true
  return cfg.columnLabels.includes(label)
}

const enabledFilterLabels = computed(() => {
  const cfg = props.payload.filters
  if (!cfg?.enabled) return [] as string[]
  if (cfg.columnLabels?.length) return [...cfg.columnLabels]
  return [...table.value.headers]
})

const filterBadgeValuesByLabel = computed(() => {
  const { headers, rows } = table.value
  const headerToIndex = new Map(headers.map((h, i) => [h, i] as const))
  const out: Record<string, string[]> = {}
  for (const label of enabledFilterLabels.value) {
    const idx =
      headerToIndex.get(label) ?? (label.includes('.') ? headerToIndex.get(label.split('.').slice(1).join('.')) : undefined)
    if (idx == null) continue
    const set = new Set<string>()
    for (const row of rows) {
      const v = String(row[idx] ?? '').trim()
      if (!v) continue
      set.add(v)
      if (set.size >= 24) break
    }
    out[label] = [...set].sort((a, b) => a.localeCompare(b)).slice(0, 12)
  }
  return out
})

const setFilterExact = (label: string, v: string) => {
  filterDrafts.value = { ...filterDrafts.value, [label]: v }
}

const pageSizeOptions = [100, 500, 1000, 5000, 10000]
const pageSizeSelectOptions = computed(() => pageSizeOptions.map((n) => ({ value: n, label: `${n} lignes` })))
const canPageBack = computed(() => widgetCtx.value.enabled && pageIndex.value > 0 && !remoteLoading.value)
const canPageNext = computed(() => widgetCtx.value.enabled && hasNextPage.value && !remoteLoading.value)

const goPrev = () => {
  if (!canPageBack.value) return
  pageIndex.value = Math.max(0, pageIndex.value - 1)
  void runRemoteQuery()
}
const goNext = () => {
  if (!canPageNext.value) return
  pageIndex.value = pageIndex.value + 1
  void runRemoteQuery()
}

const onPageSizeChange = () => {
  pageIndex.value = 0
  void runRemoteQuery()
}

const setSearchMode = (mode: 'page' | 'api') => {
  searchMode.value = mode
  if (!widgetCtx.value.enabled) return
  pageIndex.value = 0
  void runRemoteQuery()
}

watch(
  () => searchDraft.value,
  () => {
    if (!widgetCtx.value.enabled) return
    if (searchMode.value !== 'api') return
    pageIndex.value = 0
    const t = window.setTimeout(() => void runRemoteQuery(), 250)
    return () => window.clearTimeout(t)
  },
)

const emitCaption = (caption: string) => {
  emit('update:payload', {
    type: 'table',
    caption,
    dataBinding: { ...props.payload.dataBinding },
    ...(props.payload.query ? { query: props.payload.query } : {}),
    ...(props.payload.search ? { search: props.payload.search } : {}),
    ...(props.payload.filters ? { filters: props.payload.filters } : {}),
  })
}
</script>

<template>
  <figure class="content-block content-block--table my-2">
    <figcaption class="mb-3">
      <label class="sr-only" :for="`${fieldId}-tbl`">Titre du tableau</label>
      <input
        v-if="editable"
        :id="`${fieldId}-tbl`"
        :value="payload.caption"
        type="text"
        class="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-base font-semibold tracking-tight text-slate-900 outline-none transition focus-visible:border-slate-300 motion-reduce:transition-none"
        @input="emitCaption(($event.target as HTMLInputElement).value)"
      />
      <span v-else class="text-base font-semibold tracking-tight text-slate-900">{{ payload.caption }}</span>
    </figcaption>
    <div
      :class="
        props.payload.search?.display === 'bar_only'
          ? 'bg-transparent'
          : 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
      "
    >
      <p v-if="remoteError" class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        {{ remoteError }}
      </p>
      <p v-else-if="widgetCtx.enabled && remoteLoading" class="px-4 py-3 text-center text-xs text-slate-500">
        Chargement des données…
      </p>
      <template v-else-if="table.headers.length">
        <div
          v-if="widgetCtx.enabled"
          :class="
            props.payload.search?.display === 'bar_only'
              ? 'flex flex-wrap items-center justify-between gap-2 bg-transparent px-0 py-0'
              : 'flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2'
          "
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-semibold text-slate-600">Pagination</span>
            <label class="sr-only" :for="`${fieldId}-tbl-page-size`">Taille de page</label>
            <AppSelect
              :id="`${fieldId}-tbl-page-size`"
              v-model="pageSize"
              :options="pageSizeSelectOptions"
              size="sm"
              button-class="min-h-0 rounded-xl bg-white px-2 py-1 text-xs focus:ring-2 focus:ring-primary/20"
              panel-class="mt-1"
              aria-label="Taille de page"
              @change="onPageSizeChange"
            />
            <span class="text-[11px] text-slate-500">Page {{ pageIndex + 1 }}</span>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
              :disabled="!canPageBack"
              @click="goPrev"
            >
              Précédent
            </button>
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
              :disabled="!canPageNext"
              @click="goNext"
            >
              Suivant
            </button>
          </div>
        </div>
        <div
          v-if="showSearchBar"
          :class="
            props.payload.search?.display === 'bar_only'
              ? 'bg-transparent px-0 py-0'
              : 'border-b border-slate-100 bg-slate-50/80 px-3 py-2'
          "
        >
          <div v-if="props.payload.search?.display !== 'bar_only'" class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span class="text-[11px] font-semibold text-slate-600">Recherche</span>
          </div>
          <label class="sr-only" :for="`${fieldId}-tbl-search`">Rechercher dans le tableau</label>
          <input
            :id="`${fieldId}-tbl-search`"
            v-model="searchDraft"
            type="search"
            autocomplete="off"
            placeholder="Rechercher dans le tableau…"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
          />
        </div>
        <div v-if="showFiltersRow && enabledFilterLabels.length" class="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span class="text-[11px] font-semibold text-slate-600">Filtres</span>
            <span class="text-[11px] text-slate-400">Clique sur une valeur pour filtrer</span>
          </div>
          <div class="flex flex-col gap-2">
            <div v-for="lab in enabledFilterLabels" :key="`fb-${lab}`" class="flex flex-wrap items-center gap-2">
              <span class="shrink-0 text-xs font-semibold text-slate-700">{{ lab }}</span>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="v in filterBadgeValuesByLabel[lab] ?? []"
                  :key="`fb-${lab}-${v}`"
                  type="button"
                  class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    String(filterDrafts[lab] ?? '').trim() === v
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  "
                  @click="setFilterExact(lab, v)"
                >
                  {{ v }}
                </button>
              </div>
              <input
                :id="`${fieldId}-tbl-filter-inline-${lab}`"
                v-model="filterDrafts[lab]"
                type="search"
                autocomplete="off"
                :disabled="!isFilterColumnEnabled(lab)"
                :placeholder="isFilterColumnEnabled(lab) ? 'Filtrer…' : ''"
                class="ml-auto w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 sm:ml-0 sm:w-56"
              />
            </div>
          </div>
        </div>
        <table
          v-if="props.payload.search?.display !== 'bar_only'"
          class="w-full border-collapse text-left text-sm text-slate-700"
        >
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th
                v-for="h in displayedTable.headers"
                :key="h"
                scope="col"
                class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {{ h }}
              </th>
            </tr>
            <tr v-if="false" class="border-b border-slate-200 bg-slate-50/70">
              <th v-for="h in filteredTable.headers" :key="`f-${h}`" class="px-4 py-2">
                <label class="sr-only" :for="`${fieldId}-tbl-filter-${h}`">Filtrer {{ h }}</label>
                <input
                  :id="`${fieldId}-tbl-filter-${h}`"
                  v-model="filterDrafts[h]"
                  type="search"
                  autocomplete="off"
                  :disabled="!isFilterColumnEnabled(h)"
                  :placeholder="isFilterColumnEnabled(h) ? 'Filtrer…' : ''"
                  class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in displayedTable.rows" :key="ri" class="border-b border-slate-100 last:border-0">
              <td v-for="(cell, ci) in row" :key="ci" class="px-4 py-3 text-slate-700">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <div v-else class="px-4 py-10 text-center text-sm text-slate-500">
        <template v-if="widgetCtx.enabled">
          Choisissez une source, configurez le mapping et lancez un refresh si besoin, puis définissez les colonnes du
          tableau dans l’inspecteur.
        </template>
        <template v-else> Sélectionnez une source et les colonnes à afficher dans le panneau de droite. </template>
      </div>
    </div>
  </figure>
</template>
