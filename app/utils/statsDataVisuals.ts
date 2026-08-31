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

const CATEGORY_PALETTES: { match: RegExp; colors: string[] }[] = [
  { match: /sant|urgence|medic/i, colors: ['#e11d48', '#fb7185', '#fecdd3', '#fff1f2'] },
  { match: /eau|energie|climat|environnement/i, colors: ['#3b82f6', '#60a5fa', '#bfdbfe', '#eff6ff'] },
  { match: /tv|audience|media/i, colors: ['#8b5cf6', '#a78bfa', '#ddd6fe', '#f5f3ff'] },
  { match: /education|ecole|bac|scolaire/i, colors: ['#2563eb', '#60a5fa', '#bfdbfe', '#eff6ff'] },
  { match: /budget|finance|economie/i, colors: ['#f59e0b', '#fbbf24', '#fde68a', '#fffbeb'] },
]
const DEFAULT_PALETTE = ['#8b5cf6', '#a78bfa', '#ddd6fe', '#f5f3ff']

export function getStatsDataVisual(categories?: string[], emoji?: string | null): StatsDataVisual {
  const label = categories?.[0] ?? ''
  const visual = CATEGORY_VISUALS.find((v) => v.match.test(label)) ?? DEFAULT_VISUAL
  return emoji ? { ...visual, emoji } : visual
}

export function getStatsDataPalette(categories?: string[]): string[] {
  const label = categories?.[0] ?? ''
  const palette = CATEGORY_PALETTES.find((p) => p.match.test(label))
  return palette ? palette.colors : DEFAULT_PALETTE
}

/**
 * Decorative rhythm only — no per-dataset time series is exposed by the API yet, seeded
 * from the given id so a given document always renders the same shape.
 * Accepts an optional overrideSeed to produce a different sequence from the same key.
 */
export function seededSparklinePoints(seedKey: string, count = 9, overrideSeed?: number): number[] {
  let seed = overrideSeed ?? 0
  if (overrideSeed === undefined) {
    for (const char of seedKey) seed = (seed * 31 + char.charCodeAt(0)) % 9973
  }
  const points: number[] = []
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    points.push(seed % 100)
  }
  return points
}
