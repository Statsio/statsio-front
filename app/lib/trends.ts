import type { CatalogContentType, CatalogItem } from '@/types/catalog'

/**
 * Logique pure de la page « Tendances » (`/tendances`) — un classement unifié des
 * articles, StatsData et sondages publiés, toutes chaînes confondues.
 *
 * Toutes les fonctions sont **déterministes** : `now` est injecté (jamais de
 * `Date.now()` implicite), donc sûres en SSR et testables.
 */

export type TrendPeriod = 'today' | 'week' | 'month'
export type TrendTypeFilter = 'all' | CatalogContentType

export const TREND_PERIODS: { value: TrendPeriod; label: string; halfLifeHours: number }[] = [
  { value: 'today', label: "Aujourd'hui", halfLifeHours: 18 },
  { value: 'week', label: '7 jours', halfLifeHours: 24 * 4 },
  { value: 'month', label: '30 jours', halfLifeHours: 24 * 16 },
]

export const TREND_TYPES: { value: TrendTypeFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'article', label: 'Articles' },
  { value: 'statsdata', label: 'StatsData' },
  { value: 'survey', label: 'Sondages' },
]

const TYPE_TAG: Record<CatalogContentType, { label: string; fg: string; bg: string; listPath: string }> = {
  article: { label: 'ARTICLE', fg: '#2563eb', bg: '#eaf1fe', listPath: '/articles' },
  statsdata: { label: 'STATSDATA', fg: '#7c3aed', bg: '#f2ecfd', listPath: '/statsdata' },
  survey: { label: 'SONDAGE', fg: '#be123c', bg: '#fdeef1', listPath: '/sondages' },
}

export type TrendEntry = {
  item: CatalogItem
  rank: number
  /** Score interne (audience pondérée par la fraîcheur) — jamais affiché tel quel. */
  score: number
}

export function itemType(item: CatalogItem): CatalogContentType {
  return item.type ?? 'statsdata'
}

export function trendTag(item: CatalogItem) {
  return TYPE_TAG[itemType(item)]
}

/**
 * L'API n'expose pas d'historique de vues par jour (cf. `ListPublicStudioCatalogAction`).
 * On approxime donc le « momentum » d'un contenu par son audience cumulée
 * pondérée par la fraîcheur de sa dernière mise à jour, avec une demi-vie plus
 * courte pour les fenêtres courtes : sur « Aujourd'hui » un contenu remanié il y
 * a une semaine pèse beaucoup moins que sur « 30 jours ».
 */
export function trendScore(item: CatalogItem, period: TrendPeriod, now: number): number {
  const views = Math.max(0, item.views_count ?? 0)
  const halfLifeMs = (TREND_PERIODS.find((p) => p.value === period)?.halfLifeHours ?? 96) * 3_600_000
  const updatedTs = item.updated_at ? new Date(item.updated_at).getTime() : Number.NaN
  const ageMs = Number.isNaN(updatedTs) ? halfLifeMs : Math.max(0, now - updatedTs)
  const recency = Math.pow(0.5, ageMs / halfLifeMs)
  // Plancher de 0.15 : un contenu ancien mais très lu reste dans la course.
  return (views + 1) * (0.15 + 0.85 * recency)
}

export function rankTrends(
  items: CatalogItem[],
  type: TrendTypeFilter,
  period: TrendPeriod,
  now: number,
): TrendEntry[] {
  const seen = new Set<string>()
  return items
    .filter((it) => {
      if (seen.has(it.id)) return false
      seen.add(it.id)
      return type === 'all' || itemType(it) === type
    })
    .map((item) => ({ item, score: trendScore(item, period, now) }))
    .sort((a, b) => b.score - a.score || (b.item.views_count ?? 0) - (a.item.views_count ?? 0))
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}

/** Option en tête d'un sondage, quand des résultats agrégés sont disponibles. */
export function trendPollLead(item: CatalogItem): { label: string; pct: number } | null {
  const first = item.primary_options?.[0]
  if (!first) return null
  return { label: first.label, pct: Math.round(first.pct) }
}

/**
 * Mini-série décorative, stable pour un id donné (aucune série temporelle par
 * contenu n'est exposée par l'API). Valeurs normalisées dans `]0, 1]`. Même
 * approche que les sparklines du méga-menu.
 */
export function seededSparkline(seed: string, count = 10): number[] {
  let value = 0
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) % 9973
  const points: number[] = []
  for (let i = 0; i < count; i++) {
    value = (value * 1103515245 + 12345) % 2147483648
    points.push(((value % 100) + 1) / 100)
  }
  return points
}
