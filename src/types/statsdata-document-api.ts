import type { StudioBlock, StudioDocumentSettings } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

/** Document StatsData tel que renvoyé par l’API (enveloppe `data`). */
export type StatsDataDocumentDto = {
  id: string
  title: string
  subtitle: string | null
  visibility: StudioDocumentSettings['visibility']
  blocks: StudioBlock[]
  dataSources?: StudioDataSource[]
  slug: string
  created_at: string
  updated_at: string
  created_by?: StatsDataDocumentCreatedByDto | null
  description?: string | null
  categories?: string[]
  tags?: string[]
  cover_media_id?: number | null
  cover_url?: string | null
}

export type StatsDataDocumentCreatedByDto = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

/** Variante "liste" (sans blocks/sources) pour les pages d’inventaire. */
export type StatsDataDocumentListItemDto = {
  id: string
  title: string
  subtitle: string | null
  visibility: StudioDocumentSettings['visibility']
  slug: string
  created_at: string
  updated_at: string
  created_by?: StatsDataDocumentCreatedByDto | null
}

export type StatsDataDocumentWritePayload = {
  title: string
  subtitle: string
  visibility: StudioDocumentSettings['visibility']
  blocks: StudioBlock[]
  /** Omis quand les sources sont gérées via `/statsdata/{id}/sources`. */
  dataSources?: StudioDataSource[]
  description?: string
  categories?: string[]
  tags?: string[]
  cover_media_id?: number | null
}
