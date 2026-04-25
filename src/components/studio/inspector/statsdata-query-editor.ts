import type { StudioBlockPayload, StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding, StudioDataSource } from '@/types/studio-data-source'
import { sourceToTabular } from '@/types/studio-data-source'
import {
  buildStatsDataQueryForChart,
  buildStatsDataQueryForTable,
  STATS_DATA_DEFAULT_SOURCE_ALIAS,
} from '@/lib/statsdata-query-build'
import type { StatsDataQueryColumn, StatsDataQueryRequest } from '@/types/statsdata-query'

export const TABLE_ALIAS_POOL = ['s', 't', 'u', 'v', 'w', 'x'] as const

export function headersForBinding(binding: StudioBlockDataBinding, sources: StudioDataSource[]): string[] {
  const src = sources.find((s) => s.id === binding.sourceId)
  if (!src) return []
  return sourceToTabular(src).headers
}

export function bindingSourceHeaders(
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>,
  sources: StudioDataSource[],
): string[] {
  const src = sources.find((s) => s.id === block.dataBinding.sourceId)
  if (!src) return []
  return sourceToTabular(src).headers
}

export function withTableExtras(
  b: Extract<StudioBlockPayload, { type: 'table' }>,
  body: Omit<Extract<StudioBlockPayload, { type: 'table' }>, 'search' | 'filters'>,
): Extract<StudioBlockPayload, { type: 'table' }> {
  return {
    ...body,
    ...(b.search !== undefined
      ? { search: { enabled: b.search.enabled, columnLabels: [...b.search.columnLabels], ...(b.search.mode ? { mode: b.search.mode } : {}) } }
      : {}),
    ...(b.filters !== undefined
      ? { filters: { enabled: b.filters.enabled, columnLabels: [...b.filters.columnLabels] } }
      : {}),
  }
}

export function ensureUniqueAliases(entries: { alias: string; sourceId: string }[]): { alias: string; sourceId: string }[] {
  const used = new Set<string>()
  const out: { alias: string; sourceId: string }[] = []
  for (const e of entries) {
    let a = e.alias || ''
    if (!a || used.has(a)) a = TABLE_ALIAS_POOL.find((x) => !used.has(x)) ?? `a${out.length + 1}`
    used.add(a)
    out.push({ alias: a, sourceId: e.sourceId })
  }
  return out
}

export function parseFrom(from: string): { alias: string; field: string } {
  const parts = String(from ?? '').split('.', 2)
  return { alias: (parts[0] ?? '').trim(), field: (parts[1] ?? '').trim() }
}

export function normalizedFieldOptionsForSource(src: StudioDataSource | undefined): string[] {
  if (!src?.normalizationMapping) return []
  const keys = src.normalizationMapping.keyFields?.map((f) => f.name).filter(Boolean) ?? []
  const vals = src.normalizationMapping.valueFields?.map((f) => f.name).filter(Boolean) ?? []
  const stat = src.normalizationMapping.staticKeys ? Object.keys(src.normalizationMapping.staticKeys) : []
  return [...new Set([...keys, ...vals, ...stat])].sort((a, b) => a.localeCompare(b))
}

export function baseQueryForBlock(
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>,
  sources: StudioDataSource[],
): StatsDataQueryRequest {
  const b = block
  if ((b.query?.sources?.length ?? 0) > 0 || (b.query?.columns?.length ?? 0) > 0) {
    return {
      sources: (b.query?.sources ?? []).map((s) => ({ ...s })),
      columns: (b.query?.columns ?? []).map((c) => ({ ...c })),
      ...(b.query?.limit != null ? { limit: b.query.limit } : {}),
      ...(b.query?.join ? { join: { type: b.query.join.type, on: [...b.query.join.on] } } : {}),
      ...(b.query?.offset != null ? { offset: b.query.offset } : {}),
      ...(b.query?.search?.q ? { search: { q: b.query.search.q } } : {}),
    }
  }
  if (b.type === 'table') {
    return buildStatsDataQueryForTable(b.dataBinding, STATS_DATA_DEFAULT_SOURCE_ALIAS, headersForBinding(b.dataBinding, sources))
  }
  return buildStatsDataQueryForChart(b.dataBinding, STATS_DATA_DEFAULT_SOURCE_ALIAS)
}

export function baseQueryColumnsForBlock(
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>,
  sources: StudioDataSource[],
): StatsDataQueryColumn[] {
  const b = block
  if (b.query?.columns?.length) return b.query.columns.map((c) => ({ ...c }))
  if (b.type === 'table') {
    return buildStatsDataQueryForTable(
      b.dataBinding,
      STATS_DATA_DEFAULT_SOURCE_ALIAS,
      headersForBinding(b.dataBinding, sources),
    ).columns
  }
  return buildStatsDataQueryForChart(b.dataBinding, STATS_DATA_DEFAULT_SOURCE_ALIAS).columns
}

export function nextSearchConfig(
  current: StudioTableSearchConfig | undefined,
  patch: Partial<StudioTableSearchConfig>,
): StudioTableSearchConfig {
  const prev = current ?? { enabled: false, columnLabels: [] }
  return {
    enabled: patch.enabled ?? prev.enabled,
    columnLabels: patch.columnLabels ? [...patch.columnLabels] : [...prev.columnLabels],
    ...(patch.mode !== undefined ? { mode: patch.mode } : prev.mode ? { mode: prev.mode } : {}),
    ...(patch.display !== undefined ? { display: patch.display } : prev.display ? { display: prev.display } : {}),
  }
}

export function nextFiltersConfig(
  current: StudioTableFilterConfig | undefined,
  patch: Partial<StudioTableFilterConfig>,
): StudioTableFilterConfig {
  const prev = current ?? { enabled: false, columnLabels: [] }
  return {
    enabled: patch.enabled ?? prev.enabled,
    columnLabels: patch.columnLabels ? [...patch.columnLabels] : [...prev.columnLabels],
  }
}

