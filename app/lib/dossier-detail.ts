import type { CatalogItem } from '@/types/catalog'
import type { DossierContentType } from '@/types/dossier'
import { compositionParts, compositionText, dossierTypeMeta } from '@/lib/dossiers-listing'

/**
 * Logique pure de la page détail d'un dossier (charte « Tranches ») :
 * recherche, tri, fil par mois, frise datée, chaînes contributrices.
 * La saison illustrée de la maquette et le « point d'entrée » rédactionnel
 * ne sont pas inventés : le second n'apparaît que si un contenu est mis en avant.
 */

export type DossierDetailSort = 'new' | 'old'
export type DossierDetailViewMode = 'feed' | 'grid'

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]
const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
]
const MONTH_TICK = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export function accentLastWord(name: string): { text: string; em?: boolean }[] {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [{ text: name }]
  const last = words.pop()!
  return [{ text: `${words.join(' ')} ` }, { text: last, em: true }]
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function dossierContentType(item: CatalogItem): DossierContentType {
  return item.type === 'article' || item.type === 'survey' ? item.type : 'statsdata'
}

/** Instant de rangement : création, sinon dernière mise à jour. */
export function dossierItemInstant(item: CatalogItem): number | null {
  const iso = item.created_at || item.updated_at
  if (!iso) return null
  const time = new Date(iso).getTime()
  return Number.isNaN(time) ? null : time
}

export function formatDossierDay(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDossierOpened(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function haystack(item: CatalogItem): string {
  const type = dossierTypeMeta(dossierContentType(item))
  return normalizeSearch(
    [item.title, item.description, item.publisher?.name, type.label].filter(Boolean).join(' '),
  )
}

export function filterDossierItems(
  items: CatalogItem[],
  type: DossierContentType | '',
  query: string,
): CatalogItem[] {
  const tokens = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if (type && dossierContentType(item) !== type) return false
    if (!tokens.length) return true
    const text = haystack(item)
    return tokens.every((token) => text.includes(token))
  })
}

export function orderDossierItems(items: CatalogItem[], sort: DossierDetailSort): CatalogItem[] {
  const ordered = [...items].sort(
    (a, b) => (dossierItemInstant(b) ?? 0) - (dossierItemInstant(a) ?? 0),
  )
  return sort === 'old' ? ordered.reverse() : ordered
}

export type DossierMonthGroup = {
  key: string
  label: string
  summary: string
  /** le mois contient la date d'ouverture du dossier */
  opened: boolean
  items: CatalogItem[]
}

export function groupDossierByMonth(
  items: CatalogItem[],
  openedAt?: string | null,
): DossierMonthGroup[] {
  const opened = openedAt ? new Date(openedAt) : null
  const openedKey =
    opened && !Number.isNaN(opened.getTime())
      ? `${opened.getFullYear()}-${opened.getMonth()}`
      : null
  const groups: DossierMonthGroup[] = []
  for (const item of items) {
    const time = dossierItemInstant(item)
    const date = time == null ? null : new Date(time)
    const key = date ? `${date.getFullYear()}-${date.getMonth()}` : 'none'
    let group = groups.find((entry) => entry.key === key)
    if (!group) {
      group = {
        key,
        label: date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : 'Sans date',
        summary: '',
        opened: key === openedKey,
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }
  for (const group of groups) {
    const counts = { statsdata: 0, article: 0, survey: 0 }
    for (const item of group.items) counts[dossierContentType(item)] += 1
    const detail = compositionText(counts)
    const n = group.items.length
    group.summary = `${n} ajout${n > 1 ? 's' : ''}${detail ? ` · ${detail}` : ''}`
  }
  return groups
}

/** Contenu mis en avant par la rédaction, s'il y en a un. */
export function dossierEntryPoint(items: CatalogItem[]): CatalogItem | null {
  return items.find((item) => item.is_featured) ?? null
}

export type DossierChannelRow = {
  key: string
  name: string
  initials: string
  logoUrl?: string | null
  verified: boolean
  handle?: string | null
  count: number
}

export function dossierChannels(items: CatalogItem[]): DossierChannelRow[] {
  const map = new Map<string, DossierChannelRow>()
  for (const item of items) {
    const publisher = item.publisher
    if (!publisher?.name) continue
    const key = publisher.handle || publisher.name
    const row = map.get(key)
    if (row) {
      row.count += 1
      continue
    }
    map.set(key, {
      key,
      name: publisher.name,
      initials: publisher.initials || publisher.name.slice(0, 2).toUpperCase(),
      logoUrl: publisher.logo_url,
      verified: publisher.verified,
      handle: publisher.handle,
      count: 1,
    })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
}

export type FriseTick = { left: number; label: string; year: boolean }
export type FriseMark = {
  id: string
  left: number
  lane: number
  type: DossierContentType
  title: string
  day: string
}
export type DossierFrise = {
  ticks: FriseTick[]
  marks: FriseMark[]
  nowLeft: number | null
  maxLane: number
  label: string
}

/** Frise de la date du plus ancien contenu au mois en cours (ou au plus récent). */
export function buildDossierFrise(items: CatalogItem[], now = new Date()): DossierFrise | null {
  const dated = items
    .map((item) => ({ item, time: dossierItemInstant(item) }))
    .filter((entry): entry is { item: CatalogItem; time: number } => entry.time != null)
    .sort((a, b) => a.time - b.time)
  if (!dated.length) return null

  const first = new Date(dated[0]!.time)
  const start = new Date(first.getFullYear(), first.getMonth(), 1)
  const lastTime = Math.max(now.getTime(), dated[dated.length - 1]!.time)
  const last = new Date(lastTime)
  const end = new Date(last.getFullYear(), last.getMonth() + 1, 1)
  const span = end.getTime() - start.getTime()
  if (span <= 0) return null
  const percent = (time: number) => ((time - start.getTime()) / span) * 100

  const ticks: FriseTick[] = []
  for (let cursor = new Date(start); cursor < end; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const year = cursor.getMonth() === 0 || cursor.getTime() === start.getTime()
    ticks.push({
      left: percent(cursor.getTime()),
      label: year ? String(cursor.getFullYear()) : MONTH_TICK[cursor.getMonth()]!,
      year,
    })
  }

  const lanes: number[] = []
  const marks: FriseMark[] = dated.map(({ item, time }) => {
    const left = percent(time)
    let lane = 0
    while (lanes[lane] != null && left - lanes[lane]! < 4.2) lane += 1
    lanes[lane] = left
    return {
      id: item.id,
      left,
      lane,
      type: dossierContentType(item),
      title: item.title,
      day: formatDossierDay(item.created_at || item.updated_at),
    }
  })

  const nowLeft = now.getTime() >= start.getTime() && now.getTime() <= end.getTime() ? percent(now.getTime()) : null
  const from = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`
  const to = `${MONTHS[last.getMonth()]} ${last.getFullYear()}`
  return {
    ticks,
    marks,
    nowLeft,
    maxLane: marks.reduce((max, mark) => Math.max(max, mark.lane), 0),
    label: `Contenus du dossier de ${from} à ${to}`,
  }
}

export function typeCountLabel(type: DossierContentType, count: number): string {
  const meta = dossierTypeMeta(type)
  return `${count} ${count > 1 ? meta.many : meta.one}`
}

export function compositionShare(counts: { statsdata: number; article: number; survey: number }) {
  const parts = compositionParts(counts)
  const total = parts.reduce((sum, part) => sum + part.count, 0)
  return parts.map((part) => ({
    ...part,
    percent: total ? Math.round((part.count / total) * 100) : 0,
  }))
}
