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

/** Bibliothèque d'images de l'utilisateur courant (plus récentes d'abord). */
export async function fetchMyMedia(): Promise<MediaItem[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawMedia[] }>(STATSIO_API.media.collection)
  return (data.data ?? []).map(mapMedia)
}

/** Upload d'une image ; la lie automatiquement à l'utilisateur courant. */
export async function uploadMedia(file: File, directory = 'studio/images'): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('directory', directory)
  const { data } = await apiHttp.post<{ success: boolean; data: RawMedia }>(
    STATSIO_API.media.upload,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return mapMedia(data.data)
}

/** Supprime définitivement un média de la bibliothèque (propriétaire uniquement). */
export async function deleteMedia(id: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.media.one(id))
}
