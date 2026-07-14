import type { HomeContent } from '@/data/brands/home-content.types'

export const homeContent: HomeContent = {
  heroBadge: '96 indicateurs santé · 58 chaînes',
  heroHeadline: 'La santé publique, décryptée par la donnée.',
  heroSubtitle:
    'Explorez les indicateurs de santé publique, comparez les territoires et suivez les tendances qui comptent.',
  heroCtaPrimary: 'Explorer les indicateurs',
  heroCtaSecondary: 'Devenir créateur',
  heroChartLabel: "Délais d'attente aux urgences",
  heroChartPoints: [70, 66, 68, 60, 63, 55, 58, 50, 53],
  heroChartMarkers: ['2022', '2023', '2024', '2025'],
  poll: {
    question: 'Faut-il renforcer la médecine de ville ?',
    options: [
      { label: 'Oui', pct: 71 },
      { label: 'Non', pct: 29 },
    ],
    voteCount: 5902,
    windowLabel: '4 jours restants',
  },
}
