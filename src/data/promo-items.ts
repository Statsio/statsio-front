export type PromoItem = {
  type: string
  title: string
  meta: string
  cta: string
  variant?: 'default' | 'special' | 'live'
}

export const sharedPromoItems: PromoItem[] = [
  {
    type: 'Direct',
    title: 'Suivez en direct les résultats des municipales 2026',
    meta: 'Cartes, signaux locaux et bascules clés centralisés dans Statsio',
    cta: 'Suivre le direct',
    variant: 'live',
  },
  {
    type: 'Analyse',
    title: 'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
    meta: 'Dossier enrichi avec segments, comparaisons locales et nouveaux signaux',
    cta: 'Lire l’analyse',
    variant: 'special',
  },
  {
    type: 'Signal',
    title: 'Inflation : où la pression retombe vraiment',
    meta: 'Lecture en hausse sur les 72 dernières heures',
    cta: 'Explorer',
  },
]
