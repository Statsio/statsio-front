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

/** Types de contenu rangés dans un dossier (valeurs de l'API). */
export type DossierContentType = 'statsdata' | 'article' | 'survey'

/** Composition d'un dossier : nombre de contenus publiés par type. */
export type DossierContentCounts = Record<DossierContentType, number>

/** Contenu récemment rangé dans un dossier (mosaïque + sommaire des cartes). */
export interface DossierRecentContent {
  id: string
  slug: string
  type: DossierContentType
  title: string
  thumbnail_url?: string | null
  updated_at?: string | null
}

/** Carte de dossier sur la page listing publique. */
export interface DossierCatalogItem {
  id: number
  slug: string
  name: string
  description?: string | null
  image_url?: string | null
  icon?: string | null
  is_pinned?: boolean
  /** sous-marque du dossier (`all` = toutes marques) */
  sub_brand?: import('@/types/sub-brand').CategorySubBrand
  category: DossierCategoryRef | null
  content_count: number
  counts?: DossierContentCounts
  /** derniers contenus rangés, du plus récent au plus ancien (5 au plus) */
  recent?: DossierRecentContent[]
  updated_at?: string | null
}

export interface DossierCatalogResponse {
  data: DossierCatalogItem[]
  featured: DossierCatalogItem | null
  meta: { total: number; shown: number; per_page: number; has_more: boolean }
  facets: {
    categories: import('@/types/catalog').CatalogFacet[]
    /** nombre de dossiers contenant au moins un contenu de chaque type */
    types?: { value: DossierContentType; count: number }[]
  }
  stats: {
    dossiers: number
    contents: number
    categories: number
    by_type?: DossierContentCounts
    updated_this_week?: number
    last_updated_at: string | null
  }
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
