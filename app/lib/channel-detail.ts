import type { CatalogItem } from '@/types/catalog'
import type { ChannelPace } from '@/types/channel-catalog'
import { ACTIVITY_WINDOW } from '@/lib/channels-listing'

/** Derniers mots du nom en accent, comme le titre de la maquette. */
export function emphasizeChannelName(name: string): { lead: string; accent: string } {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return { lead: name.trim(), accent: '' }
  const accentCount = words.length >= 4 ? 2 : 1
  return {
    lead: words.slice(0, -accentCount).join(' '),
    accent: words.slice(-accentCount).join(' '),
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  CA: 'Canada',
  LU: 'Luxembourg',
  DE: 'Allemagne',
  ES: 'Espagne',
  IT: 'Italie',
  GB: 'Royaume-Uni',
  US: 'États-Unis',
}

export function countryLabel(code: string | null | undefined): string | null {
  if (!code?.trim()) return null
  const key = code.trim().toUpperCase()
  return COUNTRY_NAMES[key] ?? code.trim()
}

/** Publications des 30 derniers jours → index 0 = il y a 29 jours, 29 = aujourd'hui. */
export function activityDaysFromDates(
  dates: (string | null | undefined)[],
  now: Date = new Date(),
): number[] {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const since = today.getTime() - (ACTIVITY_WINDOW - 1) * 86_400_000
  const set = new Set<number>()
  for (const iso of dates) {
    if (!iso) continue
    const day = new Date(iso)
    if (Number.isNaN(day.getTime())) continue
    day.setHours(0, 0, 0, 0)
    const offset = Math.round((day.getTime() - since) / 86_400_000)
    if (offset >= 0 && offset < ACTIVITY_WINDOW) set.add(offset)
  }
  return [...set].sort((a, b) => a - b)
}

/** Même seuils que le catalogue chaînes : 12+ / jour, 3+ / semaine, sinon mois. */
export function paceFromRecentCount(count: number): ChannelPace {
  if (count >= 12) return 'jour'
  if (count >= 3) return 'semaine'
  return 'mois'
}

export function matchesChannelQuery(item: Pick<CatalogItem, 'title' | 'description'>, query: string): boolean {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return true
  const hay = normalize(`${item.title} ${item.description ?? ''}`)
  return tokens.every((token) => hay.includes(token))
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export type ChannelDossierGroup = {
  slug: string
  name: string
  count: number
  byType: { statsdata: number; article: number; survey: number }
}

export function groupChannelDossiers(items: CatalogItem[]): ChannelDossierGroup[] {
  const groups = new Map<string, ChannelDossierGroup>()
  for (const item of items) {
    if (!item.dossier) continue
    const current = groups.get(item.dossier.slug) ?? {
      slug: item.dossier.slug,
      name: item.dossier.name,
      count: 0,
      byType: { statsdata: 0, article: 0, survey: 0 },
    }
    current.count += 1
    const type = item.type === 'statsdata' || item.type === 'survey' ? item.type : 'article'
    current.byType[type] += 1
    groups.set(item.dossier.slug, current)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
}
