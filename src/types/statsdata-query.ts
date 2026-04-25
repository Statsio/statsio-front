/** Champ mappé brut → clé/valeur normalisée (`from` défaut = `name`). */
export type StatsDataFieldMapping = {
  name: string
  from?: string
}

/** Mapping brut → lignes `{ keys, values }` (source StatsData). */
export type StatsDataNormalizationMapping = {
  rowPath?: string
  keyFields: StatsDataFieldMapping[]
  valueFields: StatsDataFieldMapping[]
  staticKeys?: Record<string, string | number | boolean | null>
}

/** Résumé du dernier refresh (liste / détail source ou document). */
export type StatsDataSourceLastSnapshot = {
  id?: string
  rowCount?: number
  schemaVersion?: number
  refreshedAt?: string
  status: 'ok' | 'failed'
  errorMessage?: string | null
}

export type StatsDataQuerySourceRef = {
  alias: string
  sourceId: string
}

export type StatsDataQueryJoin = {
  type: 'inner' | 'left'
  on: string[]
}

export type StatsDataQueryColumn = {
  label: string
  from: string
}

/** Corps `POST /statsdata/{documentId}/query` (inline dans les blocs). */
export type StatsDataQueryRequest = {
  sources: StatsDataQuerySourceRef[]
  join?: StatsDataQueryJoin
  columns: StatsDataQueryColumn[]
  limit?: number
  /** Pagination : nombre de lignes à sauter (0 par défaut). */
  offset?: number
  /** Recherche serveur (filtrage avant pagination). */
  search?: {
    q: string
  }
}

export type StatsDataAnyQueryRequest =
  | StatsDataQueryRequest
  | (import('@/types/statsdata-query-v2').StatsDataQueryRequestV2)

/** Réponse après normalisation `POST .../refresh`. */
export type StatsDataRefreshResult = {
  status: 'ok' | 'failed'
  rowCount?: number
  errorMessage?: string | null
  id?: string
  schemaVersion?: number
  refreshedAt?: string
}
