import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import type {
  StatsDataNormalizationMapping,
  StatsDataAnyQueryRequest,
  StatsDataRefreshResult,
} from '@/types/statsdata-query'
import type { StatsDataNormalizationMappingSuggestions } from '@/types/statsdata-mapping-suggestions'

/** Postman : « Probe StatsData API » — corps `{ url, apiKey }`. */
export type StatsDataSourceProbePayload = {
  url: string
  apiKey?: string | null
}

/** Postman : « Create StatsData Source (manual) ». */
export type StatsDataCreateManualSourcePayload = {
  type: 'manual'
  name: string
  manualData: { rows: unknown[] }
}

/** Création source API — OpenAPI `StatsDataSourceCreateJson` (+ variantes snake_case Laravel). */
export type StatsDataCreateApiSourcePayload = {
  type: 'api'
  name: string
  apiUrl: string
  api_url?: string
  apiKey?: string | null
  api_key?: string | null
  verify?: boolean
  responseRoot?: string | null
}

export type StatsDataCreateSourcePayload = StatsDataCreateManualSourcePayload | StatsDataCreateApiSourcePayload

/** PATCH source — OpenAPI `StatsDataSourcePatch`. */
export type StatsDataUpdateSourcePayload = {
  name?: string
  sortOrder?: number
  manualData?: { rows: unknown[] }
  apiUrl?: string
  api_url?: string
  apiKey?: string | null
  api_key?: string | null
  apiLimit?: number | null
  apiSearchTemplate?: string | null
  verify?: boolean
  normalizationMapping?: StatsDataNormalizationMapping | null
  /** Laravel / requêtes JSON souvent en snake_case */
  normalization_mapping?: StatsDataNormalizationMapping | Record<string, unknown> | null
}

function toSnakeNormalizationMapping(m: StatsDataNormalizationMapping): Record<string, unknown> {
  return {
    row_path: m.rowPath ?? null,
    key_fields: m.keyFields.map((f) => ({ name: f.name, from: f.from ?? null })),
    value_fields: m.valueFields.map((f) => ({ name: f.name, from: f.from ?? null })),
    ...(m.staticKeys && Object.keys(m.staticKeys).length ? { static_keys: m.staticKeys } : {}),
  }
}

/** Corps PATCH pour `normalizationMapping` (camelCase + snake_case alignés OpenAPI / Laravel). */
export function normalizationMappingPatchPayload(
  mapping: StatsDataNormalizationMapping | null | undefined,
): Partial<StatsDataUpdateSourcePayload> {
  if (mapping === undefined) return {}
  if (mapping === null) {
    return { normalizationMapping: null, normalization_mapping: null }
  }
  return {
    normalizationMapping: mapping,
    normalization_mapping: toSnakeNormalizationMapping(mapping),
  }
}

/** Corps JSON pour enregistrer une source API (camelCase + snake_case). */
export function buildStatsDataApiSourceWriteBody(source: {
  name: string
  url: string
  apiKeyPreview: string
  apiLimit?: number | null
  apiSearchTemplate?: string | null
}): StatsDataUpdateSourcePayload {
  const url = source.url.trim()
  const keyTrim = source.apiKeyPreview.trim()
  return {
    name: source.name,
    apiUrl: url,
    api_url: url,
    apiKey: keyTrim.length > 0 ? keyTrim : null,
    api_key: keyTrim.length > 0 ? keyTrim : null,
    apiLimit: typeof source.apiLimit === 'number' && Number.isFinite(source.apiLimit) ? source.apiLimit : null,
    apiSearchTemplate: source.apiSearchTemplate?.trim() ? source.apiSearchTemplate.trim() : null,
    verify: true,
  }
}

/** Liste des sources — Postman : `GET .../sources`. */
export async function listStatsDataSources(documentId: string): Promise<unknown> {
  const res = await apiHttp.get(STATSIO_API.statsData.sources(documentId))
  return unwrapStatsioResponseData(res)
}

/** Détail d’une source (URL / clé API, etc.) — `GET .../sources/{sourceId}`. */
export async function fetchStatsDataSource(documentId: string, sourceId: string): Promise<unknown> {
  const res = await apiHttp.get(STATSIO_API.statsData.source(documentId, sourceId))
  return unwrapStatsioResponseData(res)
}

/** OpenAPI : `POST /api/statsdata/{documentId}/sources/probe` (optionnel, lié au document). */
export async function probeStatsDataSourceApi(
  documentId: string,
  payload: StatsDataSourceProbePayload,
): Promise<unknown> {
  const res = await apiHttp.post(STATSIO_API.statsData.sourcesProbe(documentId), {
    url: payload.url,
    apiKey: payload.apiKey?.trim() || null,
  })
  return unwrapStatsioResponseData(res)
}

/** OpenAPI : `POST /api/source-api/probe-connection` — endpoint dédié (Bearer sur l’URL cible). */
export async function probeSourceApiConnection(payload: StatsDataSourceProbePayload): Promise<unknown> {
  const res = await apiHttp.post(STATSIO_API.sourceApi.probeConnection, {
    url: payload.url,
    apiKey: payload.apiKey?.trim() || null,
  })
  return unwrapStatsioResponseData(res)
}

/** Postman : `POST .../sources` (manual ou api). */
export async function createStatsDataSource(
  documentId: string,
  payload: StatsDataCreateSourcePayload,
): Promise<unknown> {
  const res = await apiHttp.post(STATSIO_API.statsData.sources(documentId), payload)
  return unwrapStatsioResponseData(res)
}

/** Postman : `PATCH .../sources/{sourceId}`. */
export async function updateStatsDataSource(
  documentId: string,
  sourceId: string,
  payload: StatsDataUpdateSourcePayload,
): Promise<unknown> {
  const res = await apiHttp.patch(STATSIO_API.statsData.source(documentId, sourceId), payload)
  return unwrapStatsioResponseData(res)
}

/** Postman : `DELETE .../sources/{sourceId}`. */
export async function deleteStatsDataSource(documentId: string, sourceId: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.statsData.source(documentId, sourceId))
}

/** Import fichier — `multipart/form-data` (champs attendus : `type=file`, `name`, `file`). */
export async function uploadStatsDataSourceFile(
  documentId: string,
  name: string,
  file: File,
): Promise<unknown> {
  const fd = new FormData()
  fd.append('type', 'file')
  fd.append('name', name)
  fd.append('file', file)
  const res = await apiHttp.post(STATSIO_API.statsData.sources(documentId), fd)
  return unwrapStatsioResponseData(res)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeRefreshPayload(data: unknown): StatsDataRefreshResult {
  if (!isRecord(data)) {
    return { status: 'failed', errorMessage: 'Réponse refresh invalide' }
  }
  const status = data.status === 'failed' ? 'failed' : 'ok'
  return {
    status,
    rowCount: typeof data.rowCount === 'number' ? data.rowCount : undefined,
    schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : undefined,
    refreshedAt: typeof data.refreshedAt === 'string' ? data.refreshedAt : undefined,
    id: typeof data.id === 'string' ? data.id : undefined,
    errorMessage: data.errorMessage == null ? null : String(data.errorMessage),
  }
}

/** Ingestion + normalisation → nouveau snapshot (`POST .../sources/{id}/refresh`). */
export async function refreshStatsDataSourceDataset(
  documentId: string,
  sourceId: string,
): Promise<StatsDataRefreshResult> {
  const res = await apiHttp.post(STATSIO_API.statsData.sourceRefresh(documentId, sourceId), {})
  const data = unwrapStatsioResponseData<unknown>(res)
  return normalizeRefreshPayload(data)
}

/** Suggestions de mapping (auto + champs détectés) — `GET .../sources/{id}/mapping-suggestions`. */
export async function suggestStatsDataSourceNormalizationMapping(
  documentId: string,
  sourceId: string,
): Promise<StatsDataNormalizationMappingSuggestions> {
  const res = await apiHttp.get(STATSIO_API.statsData.sourceMappingSuggestions(documentId, sourceId))
  const data = unwrapStatsioResponseData<unknown>(res)
  return data as StatsDataNormalizationMappingSuggestions
}

/** Projection sur les snapshots (`POST .../query`). */
export async function executeStatsDataQuery(
  documentId: string,
  body: StatsDataAnyQueryRequest,
): Promise<Record<string, unknown>[]> {
  const res = await apiHttp.post(STATSIO_API.statsData.query(documentId), body)
  const data = unwrapStatsioResponseData<unknown>(res)
  if (isRecord(data) && Array.isArray(data.rows)) {
    return data.rows as Record<string, unknown>[]
  }
  if (isRecord(data) && isRecord(data.data) && Array.isArray(data.data.rows)) {
    return data.data.rows as Record<string, unknown>[]
  }
  return []
}

export async function searchStatsDataSourceExternal(
  documentId: string,
  sourceId: string,
  body: { q: string; f?: string | null; limit?: number; offset?: number; columns?: { label: string; from: string }[] },
): Promise<{ rows: Record<string, unknown>[]; hasMore: boolean }> {
  const res = await apiHttp.post(STATSIO_API.statsData.sourceSearchExternal(documentId, sourceId), body)
  const data = unwrapStatsioResponseData<unknown>(res)
  if (isRecord(data) && Array.isArray(data.rows)) {
    return { rows: data.rows as Record<string, unknown>[], hasMore: data.hasMore === true }
  }
  return { rows: [], hasMore: false }
}
