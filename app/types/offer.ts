/** Une fonctionnalité affichée dans la carte d'une offre, avec son statut inclus/exclu. */
export interface OfferFeature {
  label: string
  included: boolean
}

/** Une offre (Freemium / Premium…), gérée depuis le back-office Filament. */
export interface Offer {
  id: number
  key: string
  name: string
  tagline: string | null
  /** Prix en centimes — 0 = gratuit. */
  priceCents: number
  currency: string
  period: string
  ctaLabel: string
  ctaUrl: string | null
  badgeLabel: string | null
  isHighlighted: boolean
  isActive: boolean
  position: number
  features: OfferFeature[]
}

/** Une ligne du tableau comparatif Freemium / Premium de la page /offres. */
export interface OfferComparisonRow {
  id: number
  label: string
  hint: string | null
  freeValue: string
  premiumValue: string
  position: number
}
