import { computed, type ComputedRef, type Ref } from 'vue'
import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'

export type StudioChartKind = 'bar' | 'line' | 'pie' | 'donut'

export function useStudioChartFiltering(opts: {
  payloadType: ComputedRef<'chart' | 'chart_line' | 'chart_pie' | 'chart_donut'>
  effectiveQuery: ComputedRef<StatsDataAnyQueryRequest>
  widgetEnabled: ComputedRef<boolean>
  widgetRows: ComputedRef<Record<string, unknown>[]>
  localSeries: ComputedRef<{ labels: string[]; values: number[] }>
  searchMode: Ref<'page' | 'api'>
  searchDraft: Ref<string>
  filterDrafts: Ref<Record<string, string>>
  searchCfg: ComputedRef<StudioTableSearchConfig | undefined>
  filterCfg: ComputedRef<StudioTableFilterConfig | undefined>
}) {
  const chartKind = computed<StudioChartKind>(() => {
    if (opts.payloadType.value === 'chart_line') return 'line'
    if (opts.payloadType.value === 'chart_pie') return 'pie'
    if (opts.payloadType.value === 'chart_donut') return 'donut'
    return 'bar'
  })

  const remoteAxisLabels = computed(() => {
    const q = opts.effectiveQuery.value as any
    const isV2 = q?.specVersion === 2
    const xLabel = isV2 ? (q as StatsDataQueryRequestV2).select?.[0]?.label : (q as StatsDataQueryRequest).columns?.[0]?.label
    const yLabel = isV2 ? (q as StatsDataQueryRequestV2).select?.[1]?.label : (q as StatsDataQueryRequest).columns?.[1]?.label
    return {
      xLabel: typeof xLabel === 'string' && xLabel ? xLabel : 'label',
      yLabel: typeof yLabel === 'string' && yLabel ? yLabel : 'value',
    }
  })

  const showSearchBar = computed(() => {
    const enabled = opts.searchCfg.value?.enabled === true
    if (!enabled) return false
    if (opts.widgetEnabled.value) return opts.widgetRows.value.length > 0
    return opts.localSeries.value.labels.length > 0
  })

  const showFilters = computed(() => {
    const enabled = opts.filterCfg.value?.enabled === true
    if (!enabled) return false
    if (opts.widgetEnabled.value) return opts.widgetRows.value.length > 0
    return opts.localSeries.value.labels.length > 0
  })

  const isFilterColumnEnabled = (label: string) => {
    const cfg = opts.filterCfg.value
    if (!cfg?.enabled) return false
    if (!cfg.columnLabels?.length) return true
    return cfg.columnLabels.includes(label)
  }

  const enabledFilterLabels = computed(() => {
    const cfg = opts.filterCfg.value
    if (!cfg?.enabled) return [] as string[]
    if (cfg.columnLabels?.length) return [...cfg.columnLabels]
    return [remoteAxisLabels.value.xLabel, remoteAxisLabels.value.yLabel].filter(Boolean)
  })

  const filterBadgeValuesByLabel = computed(() => {
    const out: Record<string, string[]> = {}
    if (!opts.widgetEnabled.value) {
      const { labels, values } = opts.localSeries.value
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

    const rows = opts.widgetRows.value
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

  const filteredSeries = computed(() => {
    if (!opts.widgetEnabled.value) {
      const labels = opts.localSeries.value.labels
      const values = opts.localSeries.value.values
      const n = Math.min(labels.length, values.length)
      const outLabels: string[] = []
      const outValues: number[] = []

      const q = opts.searchDraft.value.trim().toLowerCase()
      const localSearchEnabled = opts.searchCfg.value?.enabled === true && opts.searchMode.value === 'page'

      const activeFilters = Object.entries(opts.filterDrafts.value)
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

    const rows = opts.widgetRows.value
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

    const activeFilters = Object.entries(opts.filterDrafts.value)
      .map(([k, v]) => [k, v.trim().toLowerCase()] as const)
      .filter(([, v]) => v.length > 0)

    const q = opts.searchDraft.value.trim().toLowerCase()
    const localSearchEnabled = opts.searchCfg.value?.enabled === true && opts.searchMode.value === 'page'

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

    const isV2 = (opts.effectiveQuery.value as any)?.specVersion === 2
    const hasValueCol = isV2
      ? (opts.effectiveQuery.value as StatsDataQueryRequestV2).select.length >= 2
      : (opts.effectiveQuery.value as StatsDataQueryRequest).columns.length >= 2

    const allowSingleColumn = opts.payloadType.value === 'chart_pie'
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

  return {
    chartKind,
    remoteAxisLabels,
    showSearchBar,
    showFilters,
    enabledFilterLabels,
    isFilterColumnEnabled,
    filterBadgeValuesByLabel,
    filteredSeries,
  }
}

