import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type {
  Dossier,
  DossierCatalogResponse,
  DossierCatalogSort,
  DossierDetailResponse,
  PinnedDossier,
} from '@/types/dossier'

const EMPTY_CATALOG: DossierCatalogResponse = {
  data: [],
  featured: null,
  meta: { total: 0, shown: 0, per_page: 12, has_more: false },
  facets: { categories: [] },
  stats: { dossiers: 0, contents: 0, categories: 0, last_updated_at: null },
}

interface RawDossier {
  id: number
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  icon?: string | null
  category_slugs?: string[]
}

function mapDossier(raw: RawDossier): Dossier {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? null,
    icon: raw.icon ?? null,
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
  const { data } = await apiHttp.get<{ success: boolean; data: { id: number; slug: string; name: string; icon?: string | null }[] }>(
    STATSIO_API.dossiers.pinned,
  )
  return (data.data ?? []).map((raw) => ({ id: raw.id, slug: raw.slug, name: raw.name, icon: raw.icon ?? null }))
}

/** Catalogue public paginé de la page /dossiers (recherche, facette catégorie, tri, dossier à la une). */
export async function fetchDossierCatalog(
  query: { q?: string; category?: string; sort?: DossierCatalogSort; per_page?: number } = {},
): Promise<DossierCatalogResponse> {
  const { data } = await apiHttp.get<{ success: boolean; data: Partial<DossierCatalogResponse> }>(
    STATSIO_API.dossiers.catalog,
    {
      params: {
        ...(query.q ? { q: query.q } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.sort ? { sort: query.sort } : {}),
        ...(query.per_page ? { per_page: query.per_page } : {}),
      },
    },
  )

  return {
    data: data.data?.data ?? EMPTY_CATALOG.data,
    featured: data.data?.featured ?? null,
    meta: data.data?.meta ?? { ...EMPTY_CATALOG.meta, per_page: query.per_page ?? 12 },
    facets: data.data?.facets ?? EMPTY_CATALOG.facets,
    stats: data.data?.stats ?? EMPTY_CATALOG.stats,
  }
}

/** Page publique d'un dossier : métadonnées, fil des contenus publiés, compteurs par type, dossiers voisins. */
export async function fetchDossierDetail(slug: string): Promise<DossierDetailResponse> {
  const { data } = await apiHttp.get<{ success: boolean; data: DossierDetailResponse }>(
    STATSIO_API.dossiers.publicBySlug(slug),
  )
  return data.data
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
