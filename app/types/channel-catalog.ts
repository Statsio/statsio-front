export type ChannelKind = 'redaction' | 'institution' | 'independant'
export type ChannelPace = 'jour' | 'semaine' | 'mois'
export type ChannelCatalogSort = 'trend' | 'recent' | 'followers'
export type ChannelCatalogView = 'grid' | 'list'

export type ChannelCatalogFacet = {
  value: string
  label: string
  count: number
}

export type ChannelCatalogItem = {
  id: number
  name: string
  handle: string
  description: string | null
  kind: ChannelKind
  verified: boolean
  categories: string[]
  tags: string[]
  followers_count: number
  publications_count: number
  statsdata_count: number
  articles_count: number
  surveys_count: number
  /** jours de parution sur les 30 derniers : 0 = il y a 29 jours, 29 = aujourd'hui */
  activity_days: number[]
  view_count: number
  last_published_at: string | null
  /** ouverture de la chaîne */
  created_at: string | null
  pace: ChannelPace
  is_following: boolean
  logo_url: string | null
  banner_url: string | null
  custom_color_primary: string | null
  custom_color_secondary: string | null
}

export type ChannelCatalogFeaturedPost = {
  title: string
  slug: string
  type: string
  updated_at: string | null
}

/** Chaîne mise en avant (« chaîne du mois ») : un élément du catalogue enrichi. */
export type ChannelCatalogFeatured = ChannelCatalogItem & {
  initials: string
  stats: { label: string; value: number }[]
  posts: ChannelCatalogFeaturedPost[]
}

export type ChannelCatalogStats = {
  active: number
  verified: number
  publications_month: number
  last_channel_at: string | null
}

export type ChannelCatalogResponse = {
  data: ChannelCatalogItem[]
  meta: {
    total: number
    shown: number
    per_page: number
    has_more: boolean
  }
  facets: {
    kinds: ChannelCatalogFacet[]
    themes: ChannelCatalogFacet[]
    paces: ChannelCatalogFacet[]
  }
  stats: ChannelCatalogStats
  featured: ChannelCatalogFeatured | null
}

export type ChannelCatalogQuery = {
  q?: string
  kind?: string
  category?: string
  pace?: string
  sort?: ChannelCatalogSort
  /** Domaine actif (`statsio` / `tvstats` / `medistats`) — cadre le catalogue. */
  sub_brand?: import('@/types/sub-brand').SubBrand
  verified?: boolean
  followed?: boolean
  per_page?: number
}
