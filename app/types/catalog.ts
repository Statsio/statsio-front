export type CatalogSort = 'trend' | 'recent' | 'views' | 'votes'
export type CatalogView = 'grid' | 'list'
export type CatalogContentType = 'article' | 'statsdata' | 'survey'
export type CatalogFormat = 'enquete' | 'decryptage' | 'dossier' | 'breve'
export type SurveyKind = import('@/types/content-creation').SurveyKind
export type SurveyStatusFilter = 'ouvert' | 'clos'

export type SurveyOptionRow = { label: string; pct: number }
export type SurveyQuestionPreview = {
  type: string
  label: string
  rows: { label: string; pct: number; count: number }[]
}

export type CardPreviewKind = 'line' | 'bar' | 'pie'

export type CardPreviewSeries = { name: string; values: number[] }

/**
 * Mini-graphe réel d'une carte Statsdata — reprend le premier bloc graphique du
 * document (ou celui choisi par le créateur). Chargé à la demande par la carte,
 * jamais dans le payload du catalogue. `empty` = pas de graphique exploitable.
 */
export type CardPreview = {
  block_id?: string
  kind?: CardPreviewKind
  /** Titre réel du bloc graphique du Studio (`config.title`), vide si non défini. */
  title?: string
  labels?: string[]
  series?: CardPreviewSeries[]
  unit?: string
  orientation?: 'vertical' | 'horizontal'
  empty?: boolean
}

export type CatalogPublisher = {
  name: string
  initials: string
  logo_url?: string | null
  is_channel: boolean
  verified: boolean
  handle?: string | null
}

export type CatalogItem = {
  id: string
  slug: string
  title: string
  description?: string | null
  type?: CatalogContentType
  thumbnail_url?: string | null
  categories: string[]
  category: string | null
  /** Sous-marque de publication du contenu (« domaine »). Défaut `statsio`. */
  sub_brand?: import('@/types/sub-brand').SubBrand
  format: CatalogFormat | null
  reading_minutes: number
  linked_datasets_count: number
  charts_count: number
  views_count: number
  updated_at?: string | null
  created_at?: string | null
  publisher: CatalogPublisher
  is_favorited: boolean
  /** Mise en avant éditoriale décidée par l'admin. `true` → badge « À LA UNE » ; le 1er (priorité la plus haute) devient la grande card featured. */
  is_featured?: boolean
  /**
   * Fraîcheur de la source principale du contenu (StatsData) — `null` si la source
   * est figée (« jamais ») ou sans planification : dans ce cas la carte n'affiche rien.
   */
  freshness?: import('@/lib/statsdata-freshness').DatasetFreshness | null
  /** Dossier éditorial principal (1er par position) auquel ce contenu est rattaché. `null` si aucun. */
  dossier?: { slug: string; name: string } | null
  // ── Sondages (type === 'survey') ──────────────────────────────────────────
  survey_kind?: SurveyKind
  requires_identity_verification?: boolean
  response_deadline?: string | null
  is_closed?: boolean
  responses_count?: number
  questions_count?: number
  estimated_minutes?: number
  question_types?: string[]
  primary_options?: SurveyOptionRow[]
  question_previews?: SurveyQuestionPreview[]
  petition_goal?: number | null
  petition_target?: string | null
  has_participated?: boolean
}

export type CatalogFacet = {
  value: string
  label: string
  count: number
}

export type CatalogStats = {
  published: number
  channels: number
  charts: number
  last_published_at: string | null
}

export type CatalogResponse = {
  data: CatalogItem[]
  meta: {
    total: number
    shown: number
    per_page: number
    has_more: boolean
  }
  facets: {
    categories: CatalogFacet[]
    formats: CatalogFacet[]
    survey_kinds?: CatalogFacet[]
  }
  stats: CatalogStats
  featured: CatalogItem | null
}

export type CatalogQuery = {
  type: CatalogContentType
  q?: string
  category?: string
  format?: string
  sort?: CatalogSort
  has_data?: boolean
  per_page?: number
  categories?: string[]
  /** Cadre le listing sur une sous-marque (pages TVStats / Medistats). */
  sub_brand?: import('@/types/sub-brand').SubBrand
  channel_id?: number
  survey_kind?: SurveyKind
  status?: SurveyStatusFilter
  not_participated?: boolean
  respondent_token?: string
}
