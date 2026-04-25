import { apiHttp } from '@/lib/http'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type {
  StatsDataDocumentDto,
  StatsDataDocumentListItemDto,
  StatsDataDocumentWritePayload,
} from '@/types/statsdata-document-api'
import type { StudioBlock } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeVisibility(raw: unknown): StatsDataDocumentDto['visibility'] {
  if (raw !== 'private' && raw !== 'team' && raw !== 'public') {
    throw new Error('Visibilité document invalide')
  }
  return raw
}

/** Accepte `dataSources` ou `data_sources` renvoyés par le back. */
export function normalizeStatsDataDocumentDto(raw: unknown): StatsDataDocumentDto {
  if (!isRecord(raw)) {
    throw new Error('Réponse document StatsData invalide')
  }

  const r = raw as Record<string, unknown>

  const id = String(raw.id ?? '')
  const title = String(raw.title ?? '')
  const subtitle = raw.subtitle == null ? '' : String(raw.subtitle)
  const visibility = normalizeVisibility(raw.visibility)

  const blocks = Array.isArray(raw.blocks) ? (raw.blocks as StudioBlock[]) : []
  const dataSourcesRaw = raw.dataSources ?? raw.data_sources
  const dataSources = Array.isArray(dataSourcesRaw) ? (dataSourcesRaw as StudioDataSource[]) : []

  const createdByRaw = raw.created_by
  const created_by =
    isRecord(createdByRaw)
      ? {
          id: String(createdByRaw.id ?? ''),
          email: createdByRaw.email == null ? null : String(createdByRaw.email),
          first_name: createdByRaw.first_name == null ? null : String(createdByRaw.first_name),
          last_name: createdByRaw.last_name == null ? null : String(createdByRaw.last_name),
        }
      : null

  const categories = Array.isArray(r.categories)
    ? (r.categories as unknown[]).map((x) => String(x)).filter((x) => x.trim().length > 0)
    : []
  const tags = Array.isArray(r.tags)
    ? (r.tags as unknown[]).map((x) => String(x)).filter((x) => x.trim().length > 0)
    : []

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
    created_by,
    description: r.description == null ? null : String(r.description),
    categories,
    tags,
    cover_media_id:
      typeof r.cover_media_id === 'number' ? (r.cover_media_id as number) : null,
    cover_url: r.cover_url == null ? null : String(r.cover_url),
  }
}

export function normalizeStatsDataDocumentListItemDto(raw: unknown): StatsDataDocumentListItemDto {
  if (!isRecord(raw)) {
    throw new Error('Réponse liste StatsData invalide')
  }

  const createdByRaw = raw.created_by
  const created_by =
    isRecord(createdByRaw)
      ? {
          id: String(createdByRaw.id ?? ''),
          email: createdByRaw.email == null ? null : String(createdByRaw.email),
          first_name: createdByRaw.first_name == null ? null : String(createdByRaw.first_name),
          last_name: createdByRaw.last_name == null ? null : String(createdByRaw.last_name),
        }
      : null

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    subtitle: raw.subtitle == null ? null : String(raw.subtitle),
    visibility: normalizeVisibility(raw.visibility),
    slug: String(raw.slug ?? ''),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
    created_by,
  }
}

export async function fetchStatsDataDocuments(): Promise<StatsDataDocumentListItemDto[]> {
  const res = await apiHttp.get(STATSIO_API.statsData.collection)
  const payload = unwrapStatsioResponseData<unknown>(res)
  if (!Array.isArray(payload)) {
    throw new Error('Réponse liste StatsData invalide')
  }
  return payload.map(normalizeStatsDataDocumentListItemDto)
}

export type StatsDataPublicListItemDto = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  visibility: StatsDataDocumentDto['visibility']
  created_at: string
  updated_at: string
  author: string | null
}

function normalizeStatsDataPublicListItemDto(raw: unknown): StatsDataPublicListItemDto {
  if (!isRecord(raw)) {
    throw new Error('Réponse liste StatsData publique invalide')
  }

  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    title: String(raw.title ?? ''),
    subtitle: raw.subtitle == null ? null : String(raw.subtitle),
    visibility: normalizeVisibility(raw.visibility),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
    author: raw.author == null ? null : String(raw.author),
  }
}

export async function fetchPublicStatsDataDocuments(): Promise<StatsDataPublicListItemDto[]> {
  const res = await apiHttp.get(STATSIO_API.statsData.publicCollection)
  const payload = unwrapStatsioResponseData<unknown>(res)
  if (!Array.isArray(payload)) {
    throw new Error('Réponse liste StatsData publique invalide')
  }
  return payload.map(normalizeStatsDataPublicListItemDto)
}

export async function fetchPublicStatsDataDocumentBySlug(slug: string): Promise<StatsDataDocumentDto> {
  const res = await apiHttp.get(STATSIO_API.statsData.publicOne(slug))
  return normalizeStatsDataDocumentDto(unwrapStatsioResponseData<unknown>(res))
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

export type StatsDataShareRole = 'viewer' | 'editor'
export type StatsDataShareDto = {
  user_id: number
  email: string
  role: StatsDataShareRole
}

function normalizeShareDto(raw: unknown): StatsDataShareDto {
  if (!isRecord(raw)) throw new Error('Réponse partage invalide')
  const r = raw as Record<string, unknown>
  const role = String(r.role ?? '')
  if (role !== 'viewer' && role !== 'editor') throw new Error('Rôle partage invalide')
  return {
    user_id: Number(r.user_id ?? 0),
    email: String(r.email ?? ''),
    role,
  }
}

export async function fetchStatsDataDocumentShares(documentId: string): Promise<StatsDataShareDto[]> {
  const res = await apiHttp.get(STATSIO_API.statsData.shares(documentId))
  const payload = unwrapStatsioResponseData<unknown>(res)
  if (!Array.isArray(payload)) return []
  return payload.map(normalizeShareDto)
}

export async function upsertStatsDataDocumentShare(
  documentId: string,
  body: { email: string; role: StatsDataShareRole },
): Promise<void> {
  await apiHttp.put(STATSIO_API.statsData.shares(documentId), body)
}

export async function deleteStatsDataDocumentShare(documentId: string, userId: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.statsData.share(documentId, String(userId)))
}

export async function uploadStatsDataCoverImage(
  documentId: string,
  file: File,
): Promise<{ media_id: number; url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('directory', `statsdata/${documentId}/covers`)
  const res = await apiHttp.post(STATSIO_API.media.upload, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const payload = unwrapStatsioResponseData<unknown>(res)
  if (!isRecord(payload)) {
    throw new Error('Upload image invalide')
  }
  const id = Number(payload.id ?? 0)
  const url = String(payload.url ?? '')
  if (!id || !url) {
    throw new Error('Upload image invalide')
  }
  return { media_id: id, url }
}
