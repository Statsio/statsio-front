<script setup lang="ts">
import { computed, inject, ref, watch, nextTick } from 'vue'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveTableFromBinding, sourceToTabular, findDataSource } from '@/types/studio-data-source'
import { searchStatsDataSourceExternal } from '@/api/statsdata-sources'
import { resolveEffectiveStatsDataQuery } from '@/lib/studio-statsdata/resolveEffectiveQuery'
import { useStudioWidgetQueryRunner } from '@/composables/studio/statsdata/useStudioWidgetQueryRunner'
import { useStudioTableFiltering } from '@/composables/studio/table/useStudioTableFiltering'
import { usePageFilters } from '@/composables/studio/usePageFilters'
import StudioTablePaginationBar from '@/components/studio/blocks/table/StudioTablePaginationBar.vue'
import StudioTableSearchBar from '@/components/studio/blocks/table/StudioTableSearchBar.vue'
import StudioTableFiltersRow from '@/components/studio/blocks/table/StudioTableFiltersRow.vue'
import StudioTableRenderer from '@/components/studio/blocks/table/StudioTableRenderer.vue'

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

const { applyFiltersToQuery, filterLocalRows, hasFilters } = usePageFilters()

const localTable = computed(() => resolveTableFromBinding(props.payload.dataBinding, sources.value))

const remoteHeaders = ref<string[]>([])
const remoteRows = ref<string[][]>([])
const remoteError = ref<string | null>(null)
const remoteLoading = ref(false)
const pageIndex = ref(0)
const pageSize = ref(props.payload.rowsPerPage ?? 500)
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

watch(
  () => props.payload.rowsPerPage,
  (newRowsPerPage) => {
    if (newRowsPerPage && newRowsPerPage > 0) {
      pageSize.value = newRowsPerPage
    }
  },
  { immediate: true },
)

const headerFallback = computed(() => {
  const src = findDataSource(sources.value, props.payload.dataBinding.sourceId)
  if (!src) return [] as string[]
  const tabular = sourceToTabular(src)
  return tabular?.headers ?? []
})

const effectiveQuery = computed(() => {
  return resolveEffectiveStatsDataQuery({
    kind: 'table',
    binding: props.payload.dataBinding,
    headerFallback: headerFallback.value,
    query: props.payload.query,
  })
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

  let queryWithSearch = { ...(q as any), limit, offset, ...(search ? { search } : {}) } as StatsDataAnyQueryRequest

  // Appliquer les filtres de page
  console.log('StudioBlockTable: Before applyFiltersToQuery', queryWithSearch)
  queryWithSearch = applyFiltersToQuery(queryWithSearch) || queryWithSearch
  console.log('StudioBlockTable: After applyFiltersToQuery', queryWithSearch)

  return queryWithSearch
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

const applyTableRows = (rows: Record<string, unknown>[], q: StatsDataAnyQueryRequest) => {
  const isV2 = (q as any)?.specVersion === 2
  const headers = isV2
    ? (q as StatsDataQueryRequestV2).select.map((c) => c.label)
    : (q as StatsDataQueryRequest).columns.map((c) => c.label)
  const body = rows.map((r) => headers.map((h) => String((r as any)?.[h] ?? '')))
  remoteHeaders.value = headers
  remoteRows.value = body
  hasNextPage.value = rows.length >= (((q as any).limit as number | undefined) ?? pageSize.value)
}

const resetRemote = () => {
  remoteHeaders.value = []
  remoteRows.value = []
  hasNextPage.value = false
}

const { run: runRemoteQuery } = useStudioWidgetQueryRunner({
  widgetCtx,
  enabled: () => {
    const q = pagedQuery.value as any
    const isV2 = q?.specVersion === 2
    const hasSources = Array.isArray(q?.sources) && q.sources.length > 0
    const hasCols = isV2 ? Array.isArray(q?.select) && q.select.length > 0 : Array.isArray(q?.columns) && q.columns.length > 0
    return hasSources && hasCols
  },
  getQuery: () => pagedQuery.value,
  errorMessage: 'Requête tableau impossible.',
  setError: (m) => (remoteError.value = m),
  setLoading: (v) => (remoteLoading.value = v),
  onDisabled: () => resetRemote(),
  onEmpty: () => resetRemote(),
  onSuccess: async (rows, q) => {
    const isV2 = (q as any)?.specVersion === 2
    const activeSourceId = (q as any).sources?.[0]?.sourceId ?? ''
    const src = activeSourceId ? findDataSource(sources.value, activeSourceId) : undefined
    const canExternal =
      !isV2 &&
      searchMode.value === 'api' &&
      typeof (q as any)?.search?.q === 'string' &&
      String((q as any).search.q).trim().length > 0 &&
      Array.isArray((q as any).sources) &&
      (q as any).sources.length === 1 &&
      src?.kind === 'api' &&
      typeof src.apiSearchTemplate === 'string' &&
      src.apiSearchTemplate.trim().length > 0 &&
      typeof widgetCtx.value.documentId === 'string' &&
      widgetCtx.value.documentId.length > 0

    const finalRows = canExternal
      ? (
          await searchStatsDataSourceExternal(widgetCtx.value.documentId!, activeSourceId, {
            q: (q as any).search.q,
            f: externalSearchField.value,
            limit: (q as any).limit,
            offset: (q as any).offset,
            columns: (q as StatsDataQueryRequest).columns.map((c) => ({ label: c.label, from: c.from })),
          })
        ).rows
      : rows

    if (!finalRows.length) {
      resetRemote()
      return
    }
    applyTableRows(finalRows, q)
  },
  watchSources: () => [widgetCtx.value.enabled, props.payload, pageIndex.value, pageSize.value, searchMode.value, searchDraft.value] as const,
})

watch(
  () => props.fieldId,
  () => {
    searchDraft.value = ''
    filterDrafts.value = {}
  },
)

watch(
  () => ({
    payload: props.payload,
    enabled: widgetCtx.value.enabled,
  }),
  () => {
    if (widgetCtx.value.enabled) {
      pageIndex.value = 0
      void runRemoteQuery()
    }
  },
  { deep: true },
)

// En mode lecture (editable=false), s'assurer que la requête est exécutée au montage
if (!props.editable && widgetCtx.value.enabled) {
  void nextTick(() => {
    void runRemoteQuery()
  })
}

watch(
  () => pageSize.value,
  () => {
    emit('update:payload', {
      type: 'table',
      caption: props.payload.caption,
      dataBinding: { ...props.payload.dataBinding },
      ...(props.payload.query ? { query: props.payload.query } : {}),
      ...(props.payload.search ? { search: props.payload.search } : {}),
      ...(props.payload.filters ? { filters: props.payload.filters } : {}),
      rowsPerPage: pageSize.value,
    })
  },
)

const table = computed(() => {
  if (widgetCtx.value.enabled) {
    return { headers: remoteHeaders.value, rows: remoteRows.value }
  }

  // Pour les données locales, appliquer les filtres de page
  const localData = localTable.value
  if (!hasFilters.value) {
    return localData
  }

  // Convertir les lignes en objets pour le filtrage
  const rowsAsObjects = localData.rows.map(row => {
    const obj: Record<string, unknown> = {}
    localData.headers.forEach((header, idx) => {
      obj[header] = row[idx]
    })
    return obj
  })

  // Appliquer les filtres
  const filteredObjects = filterLocalRows(rowsAsObjects)

  // Reconvertir en format tableau
  const filteredRows = filteredObjects.map(obj =>
    localData.headers.map(header => String(obj[header] ?? ''))
  )

  return { headers: localData.headers, rows: filteredRows }
})

const {
  displayedTable,
  showSearchBar,
  showFiltersRow,
  isFilterColumnEnabled,
  enabledFilterLabels,
  filterBadgeValuesByLabel,
} = useStudioTableFiltering({
  table,
  widgetEnabled: computed(() => widgetCtx.value.enabled),
  searchMode,
  searchDraft,
  filterDrafts,
  searchCfg: computed(() => props.payload.search),
  filterCfg: computed(() => props.payload.filters),
  visibleColumnKeys: computed(() => props.payload.dataBinding.visibleColumnKeys ?? []),
})

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
    ...(props.payload.rowsPerPage ? { rowsPerPage: props.payload.rowsPerPage } : {}),
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
        <StudioTablePaginationBar
          v-if="widgetCtx.enabled && props.payload.search?.display !== 'bar_only'"
          :field-id="fieldId"
          :page-index="pageIndex"
          :page-size="pageSize"
          :has-next-page="hasNextPage"
          :disabled="remoteLoading"
          @update:pageIndex="(v) => (pageIndex = v)"
          @update:pageSize="(v) => (pageSize = v)"
          @refresh="runRemoteQuery"
        />

        <StudioTableSearchBar
          v-if="showSearchBar"
          :field-id="fieldId"
          :model-value="searchDraft"
          :bar-only="props.payload.search?.display === 'bar_only'"
          :show-title="props.payload.search?.display !== 'bar_only'"
          @update:modelValue="(v) => (searchDraft = v)"
        />

        <StudioTableFiltersRow
          v-if="showFiltersRow && enabledFilterLabels.length"
          :field-id="fieldId"
          :enabled-filter-labels="enabledFilterLabels"
          :is-filter-column-enabled="isFilterColumnEnabled"
          :filter-drafts="filterDrafts"
          :badge-values-by-label="filterBadgeValuesByLabel"
          @update:filterDrafts="(v) => (filterDrafts = v)"
        />

        <StudioTableRenderer
          v-if="props.payload.search?.display !== 'bar_only'"
          :headers="displayedTable.headers"
          :rows="displayedTable.rows"
        />
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
