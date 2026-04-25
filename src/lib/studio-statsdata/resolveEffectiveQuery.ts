import type { StatsDataAnyQueryRequest, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { buildStatsDataQueryForChart, buildStatsDataQueryForTable } from '@/lib/statsdata-query-build'

export type StudioStatsDataBlockKind = 'table' | 'chart' | 'chart_line' | 'chart_pie' | 'chart_donut'

export function isStatsDataQueryV2(q: unknown): q is StatsDataQueryRequestV2 {
  const anyQ = q as any
  return (
    anyQ?.specVersion === 2 &&
    Array.isArray(anyQ.sources) &&
    Array.isArray(anyQ.select) &&
    anyQ.sources.length > 0 &&
    anyQ.select.length > 0
  )
}

export function isStatsDataQueryV1(q: unknown): q is StatsDataQueryRequest {
  const anyQ = q as any
  return Array.isArray(anyQ?.sources) && anyQ.sources.length > 0 && Array.isArray(anyQ?.columns) && anyQ.columns.length > 0
}

export function resolveEffectiveStatsDataQuery(opts: {
  kind: StudioStatsDataBlockKind
  binding: StudioBlockDataBinding
  headerFallback?: string[]
  query?: StatsDataAnyQueryRequest
}): StatsDataAnyQueryRequest {
  const q = opts.query as any
  if (isStatsDataQueryV2(q)) return q
  if (isStatsDataQueryV1(q)) return q

  if (opts.kind === 'table') {
    return buildStatsDataQueryForTable(opts.binding, undefined, opts.headerFallback ?? [])
  }
  return buildStatsDataQueryForChart(opts.binding, undefined, opts.kind)
}

