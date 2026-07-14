import type { HomeContent } from '@/data/brands/home-content.types'

export const homeContent: HomeContent = {
  heroBadge: '2 481 datasets · 312 chaînes actives',
  heroHeadline: 'Comprendre le monde par les chiffres.',
  heroSubtitle:
    'Des créateurs transforment des données brutes en dashboards et articles interactifs. Explorez, comparez, comprenez.',
  heroCtaPrimary: 'Explorer StatsData',
  heroCtaSecondary: 'Devenir créateur',
  heroChartLabel: 'Participation électorale · France',
  heroChartPoints: [62, 58, 55, 63, 58, 68, 66, 74, 70],
  heroChartMarkers: ['2012', '2017', '2022', '2027'],
  poll: {
    question: 'Le télétravail doit-il rester la norme après 2026 ?',
    options: [
      { label: 'Oui', pct: 64 },
      { label: 'Non', pct: 36 },
    ],
    voteCount: 8412,
    windowLabel: '3 jours restants',
  },
}
