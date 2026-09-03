import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { Dossier, PinnedDossier } from '@/types/dossier'

interface RawDossier {
  id: number
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  category_slugs?: string[]
}

function mapDossier(raw: RawDossier): Dossier {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? null,
    categorySlugs: raw.category_slugs ?? [],
  }
}

/** Catalogue des dossiers éditoriaux actifs (recherche / navigation du sélecteur). */
export async function fetchDossiers(): Promise<Dossier[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawDossier[] }>(
    STATSIO_API.dossiers.collection,
  )
  return (data.data ?? []).map(mapDossier)
}

/** Dossiers épinglés affichés en badges dans la barre de navigation du header (endpoint public). */
export async function fetchPinnedDossiers(): Promise<PinnedDossier[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: { id: number; slug: string; name: string }[] }>(
    STATSIO_API.dossiers.pinned,
  )
  return (data.data ?? []).map((raw) => ({ id: raw.id, slug: raw.slug, name: raw.name }))
}

/** Dossiers suggérés pour un contenu (correspondance titre + catégories). */
export async function fetchDossierSuggestions(documentId: string): Promise<Dossier[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawDossier[] }>(
    STATSIO_API.studioContent.dossierSuggestions(documentId),
  )
  return (data.data ?? []).map(mapDossier)
}

/** Dossiers dans lesquels le contenu est actuellement rangé. */
export async function fetchContentDossiers(documentId: string): Promise<Dossier[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawDossier[] }>(
    STATSIO_API.studioContent.dossiers(documentId),
  )
  return (data.data ?? []).map(mapDossier)
}

/** Remplace l'ensemble des dossiers du contenu par `dossierIds`. */
export async function syncContentDossiers(
  documentId: string,
  dossierIds: number[],
): Promise<Dossier[]> {
  const { data } = await apiHttp.put<{ success: boolean; data: RawDossier[] }>(
    STATSIO_API.studioContent.dossiers(documentId),
    { dossier_ids: dossierIds },
  )
  return (data.data ?? []).map(mapDossier)
}
