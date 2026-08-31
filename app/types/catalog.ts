export type CatalogSort = 'trend' | 'recent' | 'views'
export type CatalogView = 'grid' | 'list'
export type CatalogContentType = 'article' | 'statsdata' | 'survey'
export type CatalogFormat = 'enquete' | 'decryptage' | 'dossier' | 'breve'

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
  format: CatalogFormat | null
  tags: string[]
  reading_minutes: number
  linked_datasets_count: number
  charts_count: number
  views_count: number
  updated_at?: string | null
  created_at?: string | null
  publisher: CatalogPublisher
  is_favorited: boolean
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
  channel_id?: number
}
