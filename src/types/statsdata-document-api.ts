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
}

export type StatsDataDocumentWritePayload = {
  title: string
  subtitle: string
  visibility: StudioDocumentSettings['visibility']
  blocks: StudioBlock[]
  /** Omis quand les sources sont gérées via `/statsdata/{id}/sources`. */
  dataSources?: StudioDataSource[]
}
