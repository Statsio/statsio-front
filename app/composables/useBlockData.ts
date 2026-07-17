import { ref, watch, computed } from 'vue'
import { fetchBlockData, fetchPublicBlockData } from '@/api/studio'
import type { StudioBlock, BlockFilter, BlockQueryResult, AggregateFunction } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'

export function useBlockData(block: () => StudioBlock | null, readonly = false) {
  const studio = useStudioStore()

  const data = ref<BlockQueryResult | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const canFetch = computed(() => {
    const b = block()
    return b?.datasetId != null
  })

  function resolveFilterValue(value: string): string {
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => studio.pageParams[key] ?? match)
  }

  function resolveFilters(filters: BlockFilter[]): BlockFilter[] {
    return filters
      .filter((f) => f.column && f.value)
      .map((f) => ({ ...f, value: resolveFilterValue(f.value) }))
  }

  async function load() {
    const b = block()
    if (!b?.datasetId) {
      data.value = null
      return
    }

    const columns = resolveColumns(b)
    const groupLimit = b.config.rowLimit ?? 500
    // When series grouping is active, each X-group produces N rows (one per series value).
    // Fetch up to 5000 rows so the chart can slice to groupLimit unique X labels.
    const fetchLimit = b.fieldMapping.series ? Math.min(groupLimit * 100, 5000) : groupLimit
    const params = {
      columns,
      limit: fetchLimit,
      distinctColumn: b.config.distinctColumn ?? undefined,
      sortColumn: b.config.sortColumn ?? undefined,
      sortDirection: b.config.sortDirection ?? undefined,
      filters: resolveFilters(b.filters ?? []),
      joins: b.joins?.length ? b.joins : undefined,
      ...resolveAggregationParams(b),
    }

    isLoading.value = true
    error.value = null
    try {
      const docSlug = studio.content?.slug
      data.value = readonly && docSlug
        ? await fetchPublicBlockData(docSlug, b.datasetId, params)
        : await fetchBlockData(b.datasetId, params)
    } catch {
      error.value = 'Impossible de charger les données.'
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Reload when block configuration, filters, or page params change
  watch(
    () => {
      const b = block()
      return b
        ? `${b.datasetId}|${JSON.stringify(b.fieldMapping)}|${JSON.stringify(b.filters ?? [])}|${JSON.stringify(b.joins ?? [])}|${JSON.stringify(studio.pageParams)}|${b.config.rowLimit ?? ''}|${b.config.distinctColumn ?? ''}|${b.config.sortColumn ?? ''}|${b.config.sortDirection ?? ''}`
        : null
    },
    (key: string | null, prev: string | null) => {
      if (key && key !== prev) load()
    },
    { immediate: true },
  )

  return { data, isLoading, error, canFetch, reload: load }
}

/**
 * Derives the aggregation query params from a block's type + fieldMapping.
 * Shared by the main fetch above and by KpiBlock's comparison fetch, so both
 * the primary value and the comparison value use the exact same aggregation.
 */
export function resolveAggregationParams(block: StudioBlock): { aggregate?: AggregateFunction; aggregateColumns?: string[]; groupBy?: string[] } {
  const m = block.fieldMapping
  if (!m.aggregate) return {}

  if (block.type === 'kpi') {
    if (!m.valueColumn) return {}
    return { aggregate: m.aggregate, aggregateColumns: [m.valueColumn], groupBy: [] }
  }
  if (block.type === 'pie') {
    if (!m.value) return {}
    return { aggregate: m.aggregate, aggregateColumns: [m.value], groupBy: m.label ? [m.label] : [] }
  }
  if (block.type === 'bar' || block.type === 'line') {
    const yCols = m.yAxes?.length ? m.yAxes : (m.yAxis ? [m.yAxis] : [])
    if (!yCols.length) return {}
    const groupBy = [m.xAxis, m.series].filter((c): c is string => Boolean(c))
    return { aggregate: m.aggregate, aggregateColumns: yCols, groupBy }
  }
  return {}
}

// resolveColumns is module-level since it doesn't need store access
function resolveColumns(block: StudioBlock): string[] {
  const m = block.fieldMapping
  const cols = new Set<string>()

  if (m.xAxis) cols.add(m.xAxis)
  if (m.yAxes?.length) m.yAxes.forEach((c) => cols.add(c))
  else if (m.yAxis) cols.add(m.yAxis)
  if (m.series) cols.add(m.series)
  if (m.label) cols.add(m.label)
  if (m.value) cols.add(m.value)
  if (m.valueColumn) cols.add(m.valueColumn)
  if (m.comparisonColumn) cols.add(m.comparisonColumn)
  if (m.columns) m.columns.forEach((c) => cols.add(c))

  return cols.size > 0 ? Array.from(cols) : []
}
