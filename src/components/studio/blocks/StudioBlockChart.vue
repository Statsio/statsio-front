<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveChartSeriesFromBinding } from '@/types/studio-data-source'
import { resolveEffectiveStatsDataQuery } from '@/lib/studio-statsdata/resolveEffectiveQuery'
import { useStudioWidgetQueryRunner } from '@/composables/studio/statsdata/useStudioWidgetQueryRunner'
import { useStudioChartFiltering } from '@/composables/studio/chart/useStudioChartFiltering'
import { usePageFilters } from '@/composables/studio/usePageFilters'
import StudioChartShell from '@/components/studio/blocks/chart/StudioChartShell.vue'
import StudioChartSearchFiltersPanel from '@/components/studio/blocks/chart/StudioChartSearchFiltersPanel.vue'
import StudioChartBar from '@/components/studio/blocks/chart/StudioChartBar.vue'
import StudioChartLine from '@/components/studio/blocks/chart/StudioChartLine.vue'
import StudioChartPie from '@/components/studio/blocks/chart/StudioChartPie.vue'

type Payload = {
  type: 'chart' | 'chart_line' | 'chart_pie' | 'chart_donut'
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

const localSeries = computed(() => resolveChartSeriesFromBinding(props.payload.dataBinding, sources.value))

const remoteRows = ref<Record<string, unknown>[]>([])
const remoteError = ref<string | null>(null)
const remoteLoading = ref(false)
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

const effectiveQuery = computed(() => {
  return resolveEffectiveStatsDataQuery({
    kind: props.payload.type,
    binding: props.payload.dataBinding,
    query: props.payload.query,
  })
})

const searchedQuery = computed((): StatsDataAnyQueryRequest => {
  const q = effectiveQuery.value
  const searchQ = searchDraft.value.trim()
  const canSearch =
    widgetCtx.value.enabled && searchMode.value === 'api' && props.payload.search?.enabled === true && searchQ.length > 0

  let queryWithSearch = { ...(q as any), ...(canSearch ? { search: { q: searchQ } } : {}) } as StatsDataAnyQueryRequest

  // Appliquer les filtres de page
  queryWithSearch = applyFiltersToQuery(queryWithSearch) || queryWithSearch

  return queryWithSearch
})

const resetRemote = () => {
  remoteRows.value = []
}

const { run: runRemoteQuery } = useStudioWidgetQueryRunner({
  widgetCtx,
  enabled: () => {
    const q = searchedQuery.value as any
    const isV2 = q?.specVersion === 2
    const minCols = props.payload.type === 'chart_pie' ? 1 : 2
    const hasSources = Array.isArray(q?.sources) && q.sources.length > 0
    const hasMinCols = isV2 ? Array.isArray(q?.select) && q.select.length >= minCols : Array.isArray(q?.columns) && q.columns.length >= minCols
    return hasSources && hasMinCols
  },
  getQuery: () => searchedQuery.value,
  errorMessage: 'Requête graphique impossible.',
  setError: (m) => (remoteError.value = m),
  setLoading: (v) => (remoteLoading.value = v),
  onDisabled: () => resetRemote(),
  onEmpty: () => resetRemote(),
  onSuccess: (rows) => {
    remoteRows.value = rows
  },
  watchSources: () => [widgetCtx.value.enabled, props.payload, searchMode.value, searchDraft.value] as const,
})

watch(
  () => searchDraft.value,
  () => {
    if (!widgetCtx.value.enabled) return
    if (searchMode.value !== 'api') return
    const t = window.setTimeout(() => void runRemoteQuery(), 250)
    return () => window.clearTimeout(t)
  },
)

const widgetRows = computed(() => (widgetCtx.value.enabled ? remoteRows.value : ([] as Record<string, unknown>[])))

const {
  chartKind,
  showSearchBar,
  showFilters,
  enabledFilterLabels,
  isFilterColumnEnabled,
  filterBadgeValuesByLabel,
  filteredSeries,
} = useStudioChartFiltering({
  payloadType: computed(() => props.payload.type),
  effectiveQuery,
  widgetEnabled: computed(() => widgetCtx.value.enabled),
  widgetRows,
  localSeries,
  searchMode,
  searchDraft,
  filterDrafts,
  searchCfg: computed(() => props.payload.search),
  filterCfg: computed(() => props.payload.filters),
})

const setFilterExact = (label: string, v: string) => {
  filterDrafts.value = { ...filterDrafts.value, [label]: v }
}

const emitCaption = (caption: string) => {
  emit('update:payload', {
    type: props.payload.type,
    caption,
    dataBinding: { ...props.payload.dataBinding },
    ...(props.payload.query ? { query: props.payload.query } : {}),
    ...(props.payload.search ? { search: props.payload.search } : {}),
    ...(props.payload.filters ? { filters: props.payload.filters } : {}),
  })
}
</script>

<template>
  <figure class="content-block content-block--chart my-0">
    <StudioChartSearchFiltersPanel :show="showSearchBar || showFilters">
      <div v-if="showSearchBar" class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recherche</span>
          <span v-if="widgetCtx.enabled && (props.payload.search?.mode ?? 'page') === 'api'" class="text-[11px] text-slate-400">
            via API
          </span>
        </div>
        <input
          v-model="searchDraft"
          type="search"
          autocomplete="off"
          placeholder="Rechercher…"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div v-if="showFilters && enabledFilterLabels.length" class="mt-3 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Filtres</span>
          <span class="text-[11px] text-slate-400">Clique sur une valeur pour filtrer</span>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="lab in enabledFilterLabels" :key="`cf-${lab}`" class="flex flex-wrap items-center gap-2">
            <span class="shrink-0 text-xs font-semibold text-slate-700">{{ lab }}</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="v in filterBadgeValuesByLabel[lab] ?? []"
                :key="`cf-${lab}-${v}`"
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
              v-model="filterDrafts[lab]"
              type="search"
              autocomplete="off"
              :disabled="!isFilterColumnEnabled(lab)"
              placeholder="Filtrer…"
              class="ml-auto w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400 sm:ml-0 sm:w-64"
            />
          </div>
        </div>
      </div>
    </StudioChartSearchFiltersPanel>

    <StudioChartShell
      :caption="payload.caption"
      :remote-error="remoteError"
      :loading="widgetCtx.enabled && remoteLoading"
      :has-data="filteredSeries.labels.length > 0 && filteredSeries.values.length > 0"
    >
      <template v-if="filteredSeries.labels.length && filteredSeries.values.length">
        <StudioChartBar
          v-if="chartKind === 'bar'"
          :labels="filteredSeries.labels"
          :values="filteredSeries.values"
        />
        <StudioChartLine
          v-else-if="chartKind === 'line'"
          :labels="filteredSeries.labels"
          :values="filteredSeries.values"
        />
        <StudioChartPie
          v-else
          :labels="filteredSeries.labels"
          :values="filteredSeries.values"
          :kind="chartKind === 'donut' ? 'donut' : 'pie'"
        />
      </template>
      <template #empty>
        <div class="flex flex-1 flex-col items-center justify-center text-center">
          <span class="text-sm font-medium text-slate-500">Graphique</span>
          <span class="mt-1 max-w-[90%] text-xs leading-relaxed text-slate-400">
            <template v-if="widgetCtx.enabled">
              Choisissez une source et les champs dans l’inspecteur, puis assurez-vous qu’un refresh snapshot a réussi.
            </template>
            <template v-else> Choisissez une source et les champs dans le panneau de droite. </template>
          </span>
        </div>
      </template>
    </StudioChartShell>
    <figcaption class="mt-3">
      <label class="sr-only" :for="`${fieldId}-cap`">Légende</label>
      <input
        v-if="editable"
        :id="`${fieldId}-cap`"
        :value="payload.caption"
        type="text"
        class="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-center text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus-visible:border-slate-300 motion-reduce:transition-none"
        @input="emitCaption(($event.target as HTMLInputElement).value)"
      />
      <span v-else class="block text-center text-sm font-medium text-slate-800">{{ payload.caption }}</span>
    </figcaption>
  </figure>
</template>
