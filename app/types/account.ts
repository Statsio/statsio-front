import type { ContentType } from '@/types/content-creation'

/** Résumé de contenu studio partagé par les listes de l'espace compte (favoris, historique, recherche). */
export interface AccountContentSummary {
  id: string
  slug: string | null
  title: string
  type: ContentType
  thumbnail_url: string | null
  channel: {
    id: number
    name: string | null
    handle: string | null
    logo_url: string | null
    custom_color_primary: string | null
    custom_color_secondary: string | null
  } | null
  author: { name: string } | null
}

export interface AccountFavorite extends AccountContentSummary {
  favorited_at: string
}

export interface AccountHistoryItem extends AccountContentSummary {
  viewed_at: string
  progress: number | null
  view_count: number
}

export interface AccountHistoryGroup {
  key: 'today' | 'week' | 'earlier'
  label: string
  items: AccountHistoryItem[]
}

export interface AccountInProgressItem extends AccountContentSummary {
  progress: number | null
  viewed_at: string | null
}

export interface AccountSubscription {
  id: number
  name: string | null
  handle: string | null
  description: string | null
  logo_url: string | null
  custom_color_primary: string | null
  custom_color_secondary: string | null
  subscriber_count: number
  subscribed_at: string | null
}

export interface AccountSearchResults {
  favorites: AccountContentSummary[]
  history: AccountContentSummary[]
  contents: (AccountContentSummary & { status?: string; visibility?: string })[]
}
