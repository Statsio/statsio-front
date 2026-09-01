import type { CatalogItem } from '@/types/catalog'

/** Chaîne renvoyée dans le groupe « Chaînes » de la recherche globale. */
export type GlobalSearchChannel = {
  id: string
  name: string
  handle: string | null
  description: string | null
  verified: boolean
  followers_count: number
  categories: string[]
  logo_url: string | null
  is_following: boolean
}

export type GlobalSearchContentGroup = {
  type: 'article' | 'statsdata' | 'survey'
  label: string
  total: number
  items: CatalogItem[]
}

export type GlobalSearchChannelGroup = {
  type: 'channel'
  label: string
  total: number
  items: GlobalSearchChannel[]
}

export type GlobalSearchGroup = GlobalSearchContentGroup | GlobalSearchChannelGroup

export type GlobalSearchResponse = {
  query: string
  total: number
  groups: GlobalSearchGroup[]
}
