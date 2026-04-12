import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'

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
  verify?: boolean
}

/** Corps JSON pour enregistrer une source API (camelCase + snake_case). */
export function buildStatsDataApiSourceWriteBody(source: {
  name: string
  url: string
  apiKeyPreview: string
}): StatsDataUpdateSourcePayload {
  const url = source.url.trim()
  const keyTrim = source.apiKeyPreview.trim()
  return {
    name: source.name,
    apiUrl: url,
    api_url: url,
    apiKey: keyTrim.length > 0 ? keyTrim : null,
    api_key: keyTrim.length > 0 ? keyTrim : null,
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
