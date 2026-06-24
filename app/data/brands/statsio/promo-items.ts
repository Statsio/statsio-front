import type { PromoItem } from '@/data/brands/promo-items.types'

export const promoItems: PromoItem[] = [
  {
    type: 'Audience',
    title: 'Prime time : les courbes qui ont vraiment déplacé l’attention cette semaine',
    meta: 'Comparatif TVSTATS par chaînes, créneaux et formats les plus performants',
    cta: 'Voir les audiences',
    variant: 'live',
  },
  {
    type: 'Décryptage',
    title: 'JT, talk, divertissement : les formats qui gagnent du terrain sur la cible active',
    meta: 'Lecture enrichie avec pics d’audience, récurrence et dynamique d’antenne',
    cta: 'Lire l’analyse',
    variant: 'special',
  },
  {
    type: 'Signal',
    title: 'Access et late : où la programmation reprend de la traction',
    meta: 'Évolution consolidée sur les 7 derniers jours',
    cta: 'Explorer',
  },
]
