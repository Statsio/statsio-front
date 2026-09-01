import type { CatalogItem } from '@/types/catalog'

/** Les deux formats de carte proposés pour chaque type de contenu. */
export type ContentCardFormat = 'card' | 'row'

/**
 * `public` = contexte lecteur (étoile favori, aucun lien d'édition).
 * `manage` = contexte créateur (badge de statut + liens Studio/Propriétés, aucune étoile).
 */
export type ContentCardMode = 'public' | 'manage'

/** Variante chromatique — `dark` réservé au format `row feature` (sondage à la une de la page chaîne). */
export type ContentCardTone = 'light' | 'dark'

/**
 * Affordances d'édition d'un contenu. Objet volontairement séparé de `CatalogItem` :
 * une carte en `mode="public"` ne le reçoit jamais, `studioPath` ne peut donc pas fuiter.
 */
export interface ContentManageMeta {
  statusLabel: string
  statusBg: string
  statusColor: string
  live: boolean
  ownerKind: 'perso' | 'chaine'
  ownerLabel: string
  /** Pré-formaté : `formatShortDate(updated_at ?? created_at)`. */
  date: string
  viewsCount: number
  studioPath: string
  propertiesPath: string | null
  publicPath: string | null
}

/** Un `CatalogItem` accompagné des métadonnées annexes propres à la source qui l'a produit. */
export interface ContentCardEntry {
  item: CatalogItem
  manage?: ContentManageMeta
  favoritedAt?: string
  viewedAt?: string | null
  progress?: number | null
}
