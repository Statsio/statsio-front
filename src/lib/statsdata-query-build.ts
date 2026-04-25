import type { StatsDataQueryColumn, StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'

/** Alias unique par défaut pour une seule source dans `POST .../query`. */
export const STATS_DATA_DEFAULT_SOURCE_ALIAS = 's'

/** Construit une requête query à partir du binding tableau (colonnes = labels de sortie). */
export function buildStatsDataQueryForTable(
  binding: StudioBlockDataBinding,
  alias = STATS_DATA_DEFAULT_SOURCE_ALIAS,
  /** Si `visibleColumnKeys` est vide : toutes les colonnes connues de la source (en-têtes). */
  headerFallback: string[] = [],
): StatsDataQueryRequest {
  const sourceId = binding.sourceId
  if (!sourceId) return { sources: [], columns: [] }
  const keys = binding.visibleColumnKeys.length > 0 ? binding.visibleColumnKeys : headerFallback
  const columns: StatsDataQueryColumn[] = keys.map((k) => ({ label: k, from: `${alias}.${k}` }))
  return {
    sources: [{ alias, sourceId }],
    columns,
  }
}

/** Construit une requête query pour un graphique (deux colonnes : catégorie + valeur). */
export function buildStatsDataQueryForChart(
  binding: StudioBlockDataBinding,
  alias = STATS_DATA_DEFAULT_SOURCE_ALIAS,
  _kind: 'chart' | 'chart_line' | 'chart_pie' | 'chart_donut' = 'chart',
): StatsDataQueryRequest {
  const sourceId = binding.sourceId
  if (!sourceId) return { sources: [], columns: [] }
  const columns: StatsDataQueryColumn[] = []
  const cat = binding.chartCategoryKey.trim()
  const val = binding.chartValueKey.trim()
  if (cat) columns.push({ label: cat, from: `${alias}.${cat}` })
  if (val) columns.push({ label: val, from: `${alias}.${val}` })
  return {
    sources: [{ alias, sourceId }],
    columns,
  }
}
