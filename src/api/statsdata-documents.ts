import { apiHttp } from '@/lib/http'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { StatsDataDocumentDto, StatsDataDocumentWritePayload } from '@/types/statsdata-document-api'
import type { StudioBlock } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Accepte `dataSources` ou `data_sources` renvoyés par le back. */
export function normalizeStatsDataDocumentDto(raw: unknown): StatsDataDocumentDto {
  if (!isRecord(raw)) {
    throw new Error('Réponse document StatsData invalide')
  }

  const id = String(raw.id ?? '')
  const title = String(raw.title ?? '')
  const subtitle = raw.subtitle == null ? '' : String(raw.subtitle)
  const visibility = raw.visibility
  if (visibility !== 'private' && visibility !== 'team' && visibility !== 'public') {
    throw new Error('Visibilité document invalide')
  }

  const blocks = Array.isArray(raw.blocks) ? (raw.blocks as StudioBlock[]) : []
  const dataSourcesRaw = raw.dataSources ?? raw.data_sources
  const dataSources = Array.isArray(dataSourcesRaw) ? (dataSourcesRaw as StudioDataSource[]) : []

  return {
    id,
    title,
    subtitle,
    visibility,
    blocks,
    dataSources,
    slug: String(raw.slug ?? ''),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  }
}

/**
 * Chargement pour l’édition (GET show — pas encore dans Postman, même base que PATCH/DELETE).
 * Enveloppe `{ success?, data }` comme le reste de la collection `docs/postman/Statsio.postman_collection.json`.
 */
export async function fetchStatsDataDocument(id: string): Promise<StatsDataDocumentDto> {
  const res = await apiHttp.get(STATSIO_API.statsData.one(id))
  return normalizeStatsDataDocumentDto(unwrapStatsioResponseData<unknown>(res))
}

export async function createStatsDataDocument(
  payload: StatsDataDocumentWritePayload,
): Promise<StatsDataDocumentDto> {
  const res = await apiHttp.post(STATSIO_API.statsData.collection, payload)
  return normalizeStatsDataDocumentDto(unwrapStatsioResponseData<unknown>(res))
}

export async function updateStatsDataDocument(
  id: string,
  payload: Partial<StatsDataDocumentWritePayload>,
): Promise<StatsDataDocumentDto> {
  const res = await apiHttp.patch(STATSIO_API.statsData.one(id), payload)
  return normalizeStatsDataDocumentDto(unwrapStatsioResponseData<unknown>(res))
}

export async function deleteStatsDataDocument(id: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.statsData.one(id))
}
