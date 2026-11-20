import type { CatalogFacet, CatalogItem } from '@/types/catalog'
import type { CatalogContentType } from '@/types/catalog'
import { publicContentPath } from '@/lib/content-display'
import { percentOf } from '@/lib/ds/pie'

/**
 * Agrégations pures de la page d'accueil Statsio (charte « Tranches ») :
 * thèmes du « camembert des sujets », chiffre du jour, fil « En direct »,
 * question du jour. Tout est dérivé du catalogue public réel.
 */

export type HomeTheme = { value: string; label: string; count: number }

/** Somme des facettes catégories de plusieurs types (articles + StatsData + sondages), triée. */
export function mergeThemeFacets(lists: (CatalogFacet[] | undefined)[]): HomeTheme[] {
  const byValue = new Map<string, HomeTheme>()
  for (const list of lists) {
    for (const facet of list ?? []) {
      if (!facet.value || facet.count <= 0) continue
      const prev = byValue.get(facet.value)
      if (prev) prev.count += facet.count
      else byValue.set(facet.value, { value: facet.value, label: facet.label || facet.value, count: facet.count })
    }
  }
  return [...byValue.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'))
}

/**
 * Les facettes renvoient parfois le slug comme libellé (« societe ») : on prend
 * le nom de la catégorie quand on le connaît.
 */
export function relabelThemes(themes: HomeTheme[], names: Record<string, string>): HomeTheme[] {
  return themes.map((t) => ({ ...t, label: names[t.value] ?? (t.label === t.value ? names[t.label] ?? t.label : t.label) }))
}

/** Pluriel français simple : « 1 chaîne », « 3 chaînes ». */
export function plural(n: number, one: string, many = `${one}s`): string {
  return n > 1 ? many : one
}

/** Camembert : 5 parts maximum (règle de la charte), le reste est cité à part. */
export function splitThemes(themes: HomeTheme[], max = 5): { top: HomeTheme[]; others: HomeTheme[] } {
  return { top: themes.slice(0, max), others: themes.slice(max) }
}

export type HomeDayFigure = {
  theme: HomeTheme
  /** nombre de contenus publiés (tous types) */
  total: number
  pct: number
}

/**
 * Chiffre du jour : la part du catalogue publié qui porte sur le thème le plus
 * présent. `null` sans thème ou sans contenu.
 */
export function buildDayFigure(themes: HomeTheme[], totalContents: number): HomeDayFigure | null {
  const theme = themes[0]
  if (!theme || totalContents <= 0) return null
  const count = Math.min(theme.count, totalContents)
  return { theme: { ...theme, count }, total: totalContents, pct: percentOf(count, totalContents) }
}

export type HomeFeedKind = 'data' | 'article' | 'statsdata' | 'sondage'
export type HomeFeedFilter = 'all' | 'data' | 'pub' | 'sondage'

export type HomeFeedEntry = {
  key: string
  kind: HomeFeedKind
  /** date ISO de l'événement */
  at: string
  label: string
  title: string
  href: string
  who: string
}

const TYPE_WORD: Record<CatalogContentType, string> = { article: 'Article', statsdata: 'StatsData', survey: 'Sondage' }

function eventDate(item: CatalogItem): string | null {
  return item.created_at ?? item.updated_at ?? null
}

/**
 * Fil « En direct » : publications récentes de chaque type + synchronisations de
 * sources (fraîcheur des StatsData), du plus récent au plus ancien.
 */
export function buildLiveFeed(
  src: { articles: CatalogItem[]; statsdata: CatalogItem[]; surveys: CatalogItem[] },
  basePath = '',
  limit = 7,
): HomeFeedEntry[] {
  const out: HomeFeedEntry[] = []

  const pushPub = (item: CatalogItem, type: CatalogContentType) => {
    const at = eventDate(item)
    if (!at) return
    const isSurvey = type === 'survey'
    out.push({
      key: `${type}:${item.id}`,
      kind: isSurvey ? 'sondage' : type,
      at,
      label: isSurvey ? (item.is_closed ? 'Consultation close' : 'Consultation ouverte') : 'Publication',
      title: item.title,
      href: publicContentPath(type, item.slug, basePath),
      who: [TYPE_WORD[type], item.publisher?.name].filter(Boolean).join(' · '),
    })
  }

  src.articles.forEach((i) => pushPub(i, 'article'))
  src.statsdata.forEach((i) => pushPub(i, 'statsdata'))
  src.surveys.forEach((i) => pushPub(i, 'survey'))

  for (const item of src.statsdata) {
    const at = item.freshness?.last_refreshed_at
    if (!at) continue
    out.push({
      key: `data:${item.id}`,
      kind: 'data',
      at,
      label: 'Mise à jour',
      title: item.title,
      href: publicContentPath('statsdata', item.slug, basePath),
      who: ['Source synchronisée', item.publisher?.name].filter(Boolean).join(' · '),
    })
  }

  return out
    .filter((e) => !Number.isNaN(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

export function filterFeed(entries: HomeFeedEntry[], filter: HomeFeedFilter): HomeFeedEntry[] {
  if (filter === 'all') return entries
  if (filter === 'data') return entries.filter((e) => e.kind === 'data')
  if (filter === 'pub') return entries.filter((e) => e.kind === 'article' || e.kind === 'statsdata')
  return entries.filter((e) => e.kind === 'sondage')
}

/**
 * Question du jour : un sondage ouvert à question unique avec au moins deux
 * options chiffrées ; à défaut, le premier sondage ouvert qui expose des options.
 */
export function pickDailyQuestion(surveys: CatalogItem[]): CatalogItem | null {
  const open = surveys.filter((s) => !s.is_closed && (s.primary_options?.length ?? 0) >= 2)
  return open.find((s) => s.survey_kind === 'single_question') ?? open[0] ?? null
}

/** Mélange les contenus d'un thème (StatsData, articles, sondages) en alternance. */
export function interleave<T>(lists: T[][], limit: number): T[] {
  const out: T[] = []
  for (let i = 0; out.length < limit; i++) {
    let added = false
    for (const list of lists) {
      const item = list[i]
      if (item !== undefined && out.length < limit) {
        out.push(item)
        added = true
      }
    }
    if (!added) break
  }
  return out
}
