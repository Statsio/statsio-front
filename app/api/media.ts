import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

/** Un média de la bibliothèque de l'utilisateur. */
export interface MediaItem {
  id: number
  url: string
  type: string
  createdAt?: string | null
}

interface RawMedia {
  id: number
  url: string
  type: string
  created_at?: string | null
}

function mapMedia(raw: RawMedia): MediaItem {
  return { id: raw.id, url: raw.url, type: raw.type, createdAt: raw.created_at ?? null }
}

/** Bibliothèque d'images : utilisateur courant, ou propriétaire du contenu si contexte partagé. */
export async function fetchMyMedia(studioContentSlug?: string): Promise<MediaItem[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawMedia[] }>(STATSIO_API.media.collection, {
    params: studioContentSlug ? { studio_content_slug: studioContentSlug } : undefined,
  })
  return (data.data ?? []).map(mapMedia)
}

/** Upload d'une image ; au nom du propriétaire du contenu si `studioContentSlug` est fourni. */
export async function uploadMedia(
  file: File,
  directory = 'studio/images',
  studioContentSlug?: string,
): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('directory', directory)
  if (studioContentSlug) form.append('studio_content_slug', studioContentSlug)
  const { data } = await apiHttp.post<{ success: boolean; data: RawMedia }>(
    STATSIO_API.media.upload,
    form,
  )
  return mapMedia(data.data)
}

/** Supprime définitivement un média de la bibliothèque (propriétaire uniquement). */
export async function deleteMedia(id: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.media.one(id))
}
