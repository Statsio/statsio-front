export type HomePoll = {
  question: string
  options: { label: string; pct: number }[]
  voteCount: number
  windowLabel?: string
}

export type HomeContent = {
  heroBadge: string
  heroHeadline: string
  heroSubtitle: string
  heroCtaPrimary: string
  heroCtaSecondary: string
  heroChartLabel: string
  heroChartPoints: number[]
  heroChartMarkers: string[]
  poll: HomePoll
}
