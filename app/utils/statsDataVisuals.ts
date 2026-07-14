export interface StatsDataVisual {
  emoji: string
  bg: string
  color: string
}

const CATEGORY_VISUALS: { match: RegExp; emoji: string; bg: string; color: string }[] = [
  { match: /sant|urgence|medic/i, emoji: '🏥', bg: 'bg-rose-50', color: '#e11d48' },
  { match: /eau|energie|climat|environnement/i, emoji: '💧', bg: 'bg-blue-50', color: '#3b82f6' },
  { match: /tv|audience|media/i, emoji: '🎬', bg: 'bg-[var(--color-primary)]/10', color: 'var(--color-primary)' },
  { match: /education|ecole|bac|scolaire/i, emoji: '🎓', bg: 'bg-blue-50', color: '#3b82f6' },
  { match: /budget|finance|economie/i, emoji: '💰', bg: 'bg-amber-50', color: '#f59e0b' },
]
const DEFAULT_VISUAL: StatsDataVisual = { emoji: '📊', bg: 'bg-[var(--color-primary)]/10', color: 'var(--color-primary)' }

export function getStatsDataVisual(categories?: string[], emoji?: string | null): StatsDataVisual {
  const label = categories?.[0] ?? ''
  const visual = CATEGORY_VISUALS.find((v) => v.match.test(label)) ?? DEFAULT_VISUAL
  return emoji ? { ...visual, emoji } : visual
}
