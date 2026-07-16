import type { HomeContent } from '@/data/brands/home-content.types'

export const homeContent: HomeContent = {
  heroBadge: '184 programmes suivis · 42 chaînes',
  heroHeadline: "L'audiovisuel, chiffres à l'appui.",
  heroSubtitle:
    'Suivez les audiences en direct, comparez les cases de programmation et repérez les signaux qui comptent.',
  heroCtaPrimary: 'Explorer les audiences',
  heroCtaSecondary: 'Devenir créateur',
  heroChartLabel: 'Audience prime time · France',
  heroChartPoints: [48, 52, 50, 57, 54, 61, 59, 66, 63],
  heroChartMarkers: ['2022', '2023', '2024', '2025'],
  poll: {
    question: 'Le prime time du dimanche a-t-il changé de visage ?',
    options: [
      { label: 'Oui', pct: 58 },
      { label: 'Non', pct: 42 },
    ],
    voteCount: 3214,
    windowLabel: '2 jours restants',
  },
}
