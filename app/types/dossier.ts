/**
 * Dossier éditorial : conteneur nommé (titre, description, image) regroupant
 * plusieurs contenus autour d'un sujet suivi. Catalogue global géré en back-office.
 */
export interface Dossier {
  id: number
  slug: string
  name: string
  description?: string | null
  imageUrl?: string | null
  icon?: string | null // Peut être un emoji ou un type prédéfini
  /** Slugs des catégories de contenu rattachées (présent sur `/dossiers` et les suggestions). */
  categorySlugs?: string[]
}

/**
 * Dossier épinglé en back-office, affiché en badge dans la barre de navigation
 * du header (payload allégé : identité seulement).
 */
export interface PinnedDossier {
  id: number
  slug: string
  name: string
  icon?: string | null // Peut être un emoji ou un type prédéfini
}

// ── Catalogue public /dossiers ───────────────────────────────────────────────

export type DossierCatalogSort = 'maj' | 'count' | 'az'

export interface DossierCategoryRef {
  slug: string
  label: string
}

/** Carte de dossier sur la page listing publique. */
export interface DossierCatalogItem {
  id: number
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  icon?: string | null
  category: DossierCategoryRef | null
  content_count: number
  updated_at?: string | null
}

export interface DossierCatalogResponse {
  data: DossierCatalogItem[]
  featured: DossierCatalogItem | null
  meta: { total: number; shown: number; per_page: number; has_more: boolean }
  facets: { categories: import('@/types/catalog').CatalogFacet[] }
  stats: { dossiers: number; contents: number; categories: number; last_updated_at: string | null }
}

// ── Page publique d'un dossier ──────────────────────────────────────────────

export interface DossierDetailMeta {
  id: number
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  icon?: string | null
  category: DossierCategoryRef | null
  opened_at?: string | null
  updated_at?: string | null
  content_count: number
  contributors_count: number
}

export interface DossierRelated {
  slug: string
  name: string
  image_url?: string | null
  icon?: string | null
  content_count: number
}

export interface DossierDetailResponse {
  dossier: DossierDetailMeta
  items: import('@/types/catalog').CatalogItem[]
  counts: { all: number; article: number; statsdata: number; survey: number }
  related: DossierRelated[]
}
