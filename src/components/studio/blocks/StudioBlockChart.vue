<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import { buildStatsDataQueryForChart } from '@/lib/statsdata-query-build'
import { formatApiErrorDetail } from '@/lib/http-errors'
import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveChartSeriesFromBinding } from '@/types/studio-data-source'

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
  const q = props.payload.query as any
  if (q?.specVersion === 2 && Array.isArray(q.sources) && Array.isArray(q.select) && q.sources.length && q.select.length) {
    return q as StatsDataQueryRequestV2
  }
  if ((props.payload.query as StatsDataQueryRequest | undefined)?.sources?.length && (props.payload.query as StatsDataQueryRequest).columns?.length) {
    return props.payload.query
  }
  return buildStatsDataQueryForChart(props.payload.dataBinding)
})

const searchedQuery = computed((): StatsDataAnyQueryRequest => {
  const q = effectiveQuery.value
  const searchQ = searchDraft.value.trim()
  const canSearch =
    widgetCtx.value.enabled && searchMode.value === 'api' && props.payload.search?.enabled === true && searchQ.length > 0
  return { ...(q as any), ...(canSearch ? { search: { q: searchQ } } : {}) } as StatsDataAnyQueryRequest
})

const remoteAxisLabels = computed(() => {
  const q = effectiveQuery.value as any
  const isV2 = q?.specVersion === 2
  const xLabel = isV2 ? (q as StatsDataQueryRequestV2).select?.[0]?.label : (q as StatsDataQueryRequest).columns?.[0]?.label
  const yLabel = isV2 ? (q as StatsDataQueryRequestV2).select?.[1]?.label : (q as StatsDataQueryRequest).columns?.[1]?.label
  return {
    xLabel: typeof xLabel === 'string' && xLabel ? xLabel : 'label',
    yLabel: typeof yLabel === 'string' && yLabel ? yLabel : 'value',
  }
})

const runRemoteQuery = async () => {
  remoteError.value = null
  if (!widgetCtx.value.enabled) {
    remoteRows.value = []
    return
  }
  const q = searchedQuery.value
  const isV2 = (q as any)?.specVersion === 2
  const minCols = props.payload.type === 'chart_pie' ? 1 : 2
  const hasMinCols = isV2
    ? (q as StatsDataQueryRequestV2).sources.length > 0 && (q as StatsDataQueryRequestV2).select.length >= minCols
    : (q as StatsDataQueryRequest).sources.length > 0 && (q as StatsDataQueryRequest).columns.length >= minCols
  if (!hasMinCols) {
    remoteRows.value = []
    return
  }
  remoteLoading.value = true
  try {
    const rows = await widgetCtx.value.executeQuery(q)
    remoteRows.value = rows as Record<string, unknown>[]
  } catch (e) {
    remoteError.value = formatApiErrorDetail(e, 'Requête graphique impossible.')
    remoteRows.value = []
  } finally {
    remoteLoading.value = false
  }
}

watch(
  () => [widgetCtx.value.enabled, props.payload] as const,
  () => {
    void runRemoteQuery()
  },
  { deep: true, immediate: true },
)

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

const showSearchBar = computed(() => props.payload.search?.enabled === true && (widgetCtx.value.enabled ? widgetRows.value.length > 0 : localSeries.value.labels.length > 0))
const showFilters = computed(() => props.payload.filters?.enabled === true && (widgetCtx.value.enabled ? widgetRows.value.length > 0 : localSeries.value.labels.length > 0))

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
  return [remoteAxisLabels.value.xLabel, remoteAxisLabels.value.yLabel].filter(Boolean)
})

const filterBadgeValuesByLabel = computed(() => {
  const out: Record<string, string[]> = {}
  if (!widgetCtx.value.enabled) {
    const { labels, values } = localSeries.value
    const n = Math.min(labels.length, values.length)
    const xLabel = remoteAxisLabels.value.xLabel
    const yLabel = remoteAxisLabels.value.yLabel
    const xSet = new Set<string>()
    const ySet = new Set<string>()
    for (let i = 0; i < n; i++) {
      const lab = String(labels[i] ?? '').trim()
      const val = String(values[i] ?? '').trim()
      if (lab) xSet.add(lab)
      if (val) ySet.add(val)
      if (xSet.size >= 24 && ySet.size >= 24) break
    }
    out[xLabel] = [...xSet].sort((a, b) => a.localeCompare(b)).slice(0, 12)
    out[yLabel] = [...ySet].sort((a, b) => a.localeCompare(b)).slice(0, 12)
    return out
  }

  const rows = widgetRows.value
  const resolveCell = (row: Record<string, unknown>, label: string): string => {
    const direct = (row as any)?.[label]
    if (direct != null && String(direct).trim() !== '') return String(direct)
    if (label.includes('.')) {
      const tail = label.split('.').slice(1).join('.')
      const alt = (row as any)?.[tail]
      if (alt != null && String(alt).trim() !== '') return String(alt)
    }
    return ''
  }
  for (const lab of enabledFilterLabels.value) {
    const set = new Set<string>()
    for (const r of rows) {
      const v = resolveCell(r, lab).trim()
      if (!v) continue
      set.add(v)
      if (set.size >= 24) break
    }
    out[lab] = [...set].sort((a, b) => a.localeCompare(b)).slice(0, 12)
  }
  return out
})

const setFilterExact = (label: string, v: string) => {
  filterDrafts.value = { ...filterDrafts.value, [label]: v }
}

const filteredSeries = computed(() => {
  // Local (non-widget) mode: keep old behavior.
  if (!widgetCtx.value.enabled) {
    const labels = localSeries.value.labels
    const values = localSeries.value.values
    const n = Math.min(labels.length, values.length)
    const outLabels: string[] = []
    const outValues: number[] = []

    const q = searchDraft.value.trim().toLowerCase()
    const localSearchEnabled = props.payload.search?.enabled === true && searchMode.value === 'page'

    const activeFilters = Object.entries(filterDrafts.value)
      .map(([k, v]) => [k, v.trim().toLowerCase()] as const)
      .filter(([, v]) => v.length > 0)

    for (let i = 0; i < n; i++) {
      const lab = String(labels[i] ?? '')
      const valStr = String(values[i] ?? '')

      if (localSearchEnabled && q) {
        const haystack = `${lab} ${valStr}`.toLowerCase()
        if (!haystack.includes(q)) continue
      }

      if (activeFilters.length) {
        let ok = true
        for (const [col, needle] of activeFilters) {
          if (!isFilterColumnEnabled(col)) continue
          const cell = col === remoteAxisLabels.value.xLabel ? lab : valStr
          if (!String(cell).toLowerCase().includes(needle)) {
            ok = false
            break
          }
        }
        if (!ok) continue
      }

      outLabels.push(lab)
      outValues.push(Number(values[i] ?? 0))
    }

    return { labels: outLabels, values: outValues }
  }

  // Widget mode: filter on full rows, then compute series from axis labels.
  const rows = widgetRows.value
  const { xLabel, yLabel } = remoteAxisLabels.value
  const resolveCell = (row: Record<string, unknown>, label: string): string => {
    const direct = (row as any)?.[label]
    if (direct != null && String(direct).trim() !== '') return String(direct)
    if (label.includes('.')) {
      const tail = label.split('.').slice(1).join('.')
      const alt = (row as any)?.[tail]
      if (alt != null && String(alt).trim() !== '') return String(alt)
    }
    return ''
  }

  const activeFilters = Object.entries(filterDrafts.value)
    .map(([k, v]) => [k, v.trim().toLowerCase()] as const)
    .filter(([, v]) => v.length > 0)

  const q = searchDraft.value.trim().toLowerCase()
  const localSearchEnabled = props.payload.search?.enabled === true && searchMode.value === 'page'

  const kept: Record<string, unknown>[] = []
  for (const r of rows) {
    if (localSearchEnabled && q) {
      const haystack = `${resolveCell(r, xLabel)} ${resolveCell(r, yLabel)}`.toLowerCase()
      if (!haystack.includes(q)) continue
    }
    let ok = true
    for (const [col, needle] of activeFilters) {
      if (!isFilterColumnEnabled(col)) continue
      const cell = resolveCell(r, col).toLowerCase()
      if (!cell.includes(needle)) {
        ok = false
        break
      }
    }
    if (!ok) continue
    kept.push(r)
  }

  const isV2 = (effectiveQuery.value as any)?.specVersion === 2
  const hasValueCol = isV2
    ? (effectiveQuery.value as StatsDataQueryRequestV2).select.length >= 2
    : (effectiveQuery.value as StatsDataQueryRequest).columns.length >= 2

  // Pie can work with single column: count occurrences.
  const allowSingleColumn = props.payload.type === 'chart_pie'
  if (!hasValueCol && allowSingleColumn) {
    const counts = new Map<string, number>()
    for (const r of kept) {
      const lab = resolveCell(r, xLabel).trim()
      if (!lab) continue
      counts.set(lab, (counts.get(lab) ?? 0) + 1)
    }
    return { labels: [...counts.keys()], values: [...counts.values()] }
  }

  const outLabels: string[] = []
  const outValues: number[] = []
  for (const r of kept) {
    const raw = resolveCell(r, yLabel)
    const n = Number(String(raw ?? '').replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(n)) continue
    outLabels.push(resolveCell(r, xLabel))
    outValues.push(n)
  }
  return { labels: outLabels, values: outValues }
})

const chartKind = computed<'bar' | 'line' | 'pie' | 'donut'>(() => {
  if (props.payload.type === 'chart_line') return 'line'
  if (props.payload.type === 'chart_pie') return 'pie'
  if (props.payload.type === 'chart_donut') return 'donut'
  return 'bar'
})

const maxVal = computed(() => {
  const v = filteredSeries.value.values
  if (!v.length) return 1
  return Math.max(...v, 1)
})

const linePoints = computed(() => {
  const labels = filteredSeries.value.labels
  const values = filteredSeries.value.values
  const n = Math.min(labels.length, values.length)
  if (n <= 1) return ''
  const w = 640
  const h = 240
  const padX = 24
  const padY = 18
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const m = maxVal.value || 1
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const x = padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const y = padY + innerH - (innerH * (values[i] ?? 0)) / m
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
})

const pieSlices = computed(() => {
  const labels = filteredSeries.value.labels
  const values = filteredSeries.value.values
  const n = Math.min(labels.length, values.length)
  const cleaned: Array<{ label: string; value: number }> = []
  for (let i = 0; i < n; i++) {
    const v = Number(values[i] ?? 0)
    if (!Number.isFinite(v) || v <= 0) continue
    cleaned.push({ label: labels[i] ?? '', value: v })
  }
  const total = cleaned.reduce((s, x) => s + x.value, 0)
  if (total <= 0) return { total: 0, arcs: [] as Array<{ d: string; label: string; pct: number; color: string }> }

  const colors = ['#2563eb', '#06b6d4', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#64748b']
  const cx = 160
  const cy = 120
  const r = 86
  let angle = -Math.PI / 2
  const arcs: Array<{ d: string; label: string; pct: number; color: string }> = []
  cleaned.slice(0, 12).forEach((slice, idx) => {
    const a0 = angle
    const a1 = angle + (slice.value / total) * Math.PI * 2
    angle = a1
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const large = a1 - a0 > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
    arcs.push({
      d,
      label: slice.label,
      pct: slice.value / total,
      color: colors[idx % colors.length]!,
    })
  })
  return { total, arcs }
})

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
    <div v-if="showSearchBar || showFilters" class="mb-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
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
    </div>
    <div
      class="flex w-full aspect-[16/9] max-h-[min(22rem,55vw)] flex-col rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#fafbfc_0%,#f1f5f9_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
      role="img"
      :aria-label="payload.caption"
    >
      <p v-if="remoteError" class="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center text-[11px] text-amber-900">
        {{ remoteError }}
      </p>
      <p v-else-if="widgetCtx.enabled && remoteLoading" class="flex flex-1 items-center justify-center text-xs text-slate-500">
        Chargement…
      </p>
      <template v-else-if="filteredSeries.labels.length && filteredSeries.values.length">
        <div v-if="chartKind === 'bar'" class="flex h-44 items-end gap-1 sm:h-48 sm:gap-2">
          <div
            v-for="(lab, i) in filteredSeries.labels"
            :key="i"
            class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div
              class="w-full max-w-[3.25rem] rounded-t-md bg-[color-mix(in_srgb,var(--color-primary)_78%,white)] transition-[height] motion-reduce:transition-none"
              :style="{ height: `${Math.round(Math.max(6, (filteredSeries.values[i]! / maxVal) * 168))}px` }"
              :title="`${lab}: ${filteredSeries.values[i]}`"
            />
            <span class="max-w-full truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">{{ lab }}</span>
          </div>
        </div>

        <div v-else-if="chartKind === 'line'" class="flex flex-1 flex-col items-center gap-3">
          <svg viewBox="0 0 640 240" class="h-full w-full max-w-[720px]">
            <polyline
              :points="linePoints"
              fill="none"
              stroke="rgb(37 99 235)"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="grid w-full max-w-[720px] grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 sm:grid-cols-3">
            <div v-for="(lab, i) in filteredSeries.labels.slice(0, 6)" :key="`l-${i}`" class="flex items-center justify-between gap-2">
              <span class="truncate font-medium text-slate-700">{{ lab }}</span>
              <span class="shrink-0 tabular-nums text-slate-500">{{ filteredSeries.values[i] }}</span>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-1 flex-col items-center justify-center gap-4">
          <div class="flex w-full items-center justify-center gap-6">
            <svg viewBox="0 0 320 240" class="h-44 w-44">
              <path
                v-for="(arc, i) in pieSlices.arcs"
                :key="`p-${i}`"
                :d="arc.d"
                :fill="arc.color"
                stroke="white"
                stroke-width="2"
              />
              <circle
                v-if="chartKind === 'donut'"
                cx="160"
                cy="120"
                r="56"
                fill="white"
                opacity="1"
              />
            </svg>
            <div class="min-w-0 space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Répartition</p>
              <div class="space-y-1.5">
                <div v-for="(arc, i) in pieSlices.arcs.slice(0, 6)" :key="`pl-${i}`" class="flex items-center gap-2 text-sm">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: arc.color }" />
                  <span class="truncate text-slate-700">{{ arc.label || '—' }}</span>
                  <span class="shrink-0 text-xs tabular-nums text-slate-500">{{ Math.round(arc.pct * 100) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
        <span class="text-sm font-medium text-slate-500">Graphique</span>
        <span class="mt-1 max-w-[90%] text-xs leading-relaxed text-slate-400">
          <template v-if="widgetCtx.enabled">
            Choisissez une source et les champs dans l’inspecteur, puis assurez-vous qu’un refresh snapshot a réussi.
          </template>
          <template v-else> Choisissez une source et les champs dans le panneau de droite. </template>
        </span>
      </div>
    </div>
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
