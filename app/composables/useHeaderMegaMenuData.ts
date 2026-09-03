import { fetchPublicCatalog } from '@/api/studio'
import { fetchChannelCatalog, channelCategoryLabels } from '@/api/channels'
import { fetchDossierCatalog } from '@/api/dossiers'
import type { DossierCatalogItem } from '@/types/dossier'
import { fetchTvAudiences } from '@/api/tv-audiences'
import { CHANNEL_CHART_COLORS } from '@/composables/useTvAudiences'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import { fetchChannelSchedules } from '@/api/tv-schedule'
import { fetchMaladiesPopulaires } from '@/api/maladies'
import { fetchMedicamentsSearch } from '@/api/medicaments'
import type { Medicament } from '@/types/medicaments'
import { POPULAR_MEDICAMENTS } from '@/composables/useMedicaments'
import { fetchSoinsList } from '@/api/soins'
import { getStatsDataVisual } from '@/utils/statsDataVisuals'
import { relativeUpdate } from '@/utils/statsDataFormat'
import { formatCompactNumber, formatShortDate, getNameInitials } from '@/lib/format'
import { CATALOG_FORMAT_STYLE, catalogThemeStyle } from '@/lib/catalog-theme'
import { getSurveyKindMeta } from '@/lib/poll-visuals'
import { resolveChannelColors } from '@/lib/channel-brand'
import { publicContentListPath, publicContentPath } from '@/lib/content-display'
import type {
  MegaMenuCategory,
  MegaMenuContent,
  MegaMenuArticleCard,
  MegaMenuDataCard,
  MegaMenuPollCard,
  MegaMenuChannelCard,
  PromoTickerItem,
} from '@/components/layout/brands/header-nav.types'

export type HeaderMenuData = {
  categories: MegaMenuCategory[]
  links: string[]
  menu: MegaMenuContent
}

function emptyMenu(variant: MegaMenuContent['variant']): HeaderMenuData {
  const menu = { variant, cards: [] } as unknown as MegaMenuContent
  return { categories: [], links: [], menu }
}

/** Décoratif uniquement — aucune série temporelle par item n'est exposée par ces endpoints, dérivé de façon stable depuis l'id/le nom pour qu'une carte garde toujours la même forme. */
function seededSparkline(seed: string, count = 12): number[] {
  let value = 0
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) % 9973
  const points: number[] = []
  for (let i = 0; i < count; i++) {
    value = (value * 1103515245 + 12345) % 2147483648
    points.push((value % 100) + 1)
  }
  return points
}

/** `palette` est toujours non vide en pratique — un fallback neutre couvre le cas contraire pour TypeScript. */
function paletteColor(palette: string[], index: number): string {
  return palette[index % palette.length] ?? '#94a3b8'
}

function withLinks(categories: MegaMenuCategory[], menu: MegaMenuContent): HeaderMenuData {
  return { categories, links: categories.map((c) => c.name), menu }
}

/** Colonne « catégories » à partir des facettes du catalogue public (valeur, libellé, compte). */
function facetCategories(
  facets: { value: string; label: string; count: number }[],
  palette: string[],
  hrefFor: (value: string) => string,
  max = 6,
): MegaMenuCategory[] {
  return facets.slice(0, max).map((facet, index) => ({
    name: facet.label,
    color: paletteColor(palette, index),
    count: facet.count,
    href: hrefFor(facet.value),
  }))
}

export async function loadArticleMenu(
  categories: string[] | undefined,
  palette: string[],
  basePath = '',
): Promise<HeaderMenuData> {
  try {
    const res = await fetchPublicCatalog({
      type: 'article',
      sort: 'trend',
      per_page: 6,
      ...(categories?.length ? { categories } : {}),
    })
    const cards: MegaMenuArticleCard[] = res.data.slice(0, 3).map((doc) => {
      const formatStyle = doc.format ? CATALOG_FORMAT_STYLE[doc.format] : undefined
      const tag = formatStyle?.label ?? doc.category ?? 'Article'
      const views = doc.views_count ? `${formatCompactNumber(doc.views_count)} vues` : null
      return {
        tag,
        tagColor: formatStyle?.fg ?? catalogThemeStyle(doc.category).fg,
        title: doc.title,
        readingLabel: doc.reading_minutes ? `${doc.reading_minutes} min` : '',
        publisher: doc.publisher.name,
        initials: doc.publisher.initials || getNameInitials(doc.publisher.name),
        logoUrl: doc.publisher.logo_url ?? null,
        isChannel: doc.publisher.is_channel,
        href: publicContentPath('article', doc.slug, basePath),
        meta: [formatShortDate(doc.updated_at ?? doc.created_at), views].filter(Boolean).join(' · '),
      }
    })
    return withLinks(
      facetCategories(
        res.facets.categories,
        palette,
        (v) => `${publicContentListPath('article', basePath)}?category=${encodeURIComponent(v)}`,
      ),
      { variant: 'doc', cards },
    )
  } catch {
    return emptyMenu('doc')
  }
}

export async function loadStatsDataMenu(
  categories: string[] | undefined,
  palette: string[],
  basePath = '',
): Promise<HeaderMenuData> {
  try {
    const res = await fetchPublicCatalog({
      type: 'statsdata',
      sort: 'trend',
      per_page: 6,
      ...(categories?.length ? { categories } : {}),
    })
    const cards: MegaMenuDataCard[] = res.data.slice(0, 3).map((doc) => {
      const theme = catalogThemeStyle(doc.category)
      const datasetLabel = doc.linked_datasets_count
        ? `${doc.linked_datasets_count} jeu${doc.linked_datasets_count > 1 ? 'x' : ''} de données`
        : null
      const chartsLabel = doc.charts_count ? `${doc.charts_count} graphique${doc.charts_count > 1 ? 's' : ''}` : null
      return {
        icon: getStatsDataVisual(doc.categories).emoji,
        theme: (doc.category ?? 'Data').toUpperCase(),
        themeColor: theme.fg,
        freq: (relativeUpdate(doc.updated_at ?? undefined) ?? formatShortDate(doc.updated_at)).toUpperCase(),
        title: doc.title,
        kpi: doc.views_count ? formatCompactNumber(doc.views_count) : `${doc.charts_count}`,
        kpiDelta: doc.views_count ? 'vues' : 'graph.',
        meta: [datasetLabel, chartsLabel].filter(Boolean).join(' · ') || 'Jeu de données',
        sparkline: seededSparkline(doc.id),
        href: publicContentPath('statsdata', doc.slug, basePath),
      }
    })
    return withLinks(
      facetCategories(
        res.facets.categories,
        palette,
        (v) => `${publicContentListPath('statsdata', basePath)}?category=${encodeURIComponent(v)}`,
      ),
      { variant: 'bar', cards },
    )
  } catch {
    return emptyMenu('bar')
  }
}

export async function loadSurveyMenu(
  categories: string[] | undefined,
  palette: string[],
  basePath = '',
): Promise<HeaderMenuData> {
  try {
    const res = await fetchPublicCatalog({
      type: 'survey',
      sort: 'trend',
      status: 'ouvert',
      per_page: 6,
      ...(categories?.length ? { categories } : {}),
    })
    const cards: MegaMenuPollCard[] = res.data.slice(0, 3).map((doc) => {
      const kindMeta = getSurveyKindMeta(doc.survey_kind)
      const options = doc.primary_options ?? []
      const petitionPct =
        doc.petition_goal && doc.responses_count
          ? Math.min(100, Math.round((doc.responses_count / doc.petition_goal) * 100))
          : null
      const percent = options[0]?.pct ?? petitionPct ?? 0
      let lead = ''
      if (doc.survey_kind === 'petition' && doc.petition_goal) {
        lead = `${formatCompactNumber(doc.responses_count ?? 0)} / ${formatCompactNumber(doc.petition_goal)}`
      } else if (options[0]) {
        lead = options[0].label
      } else if (doc.questions_count) {
        lead = `${doc.questions_count} question${doc.questions_count > 1 ? 's' : ''}`
      } else {
        lead = 'Sondage ouvert'
      }
      const card: MegaMenuPollCard = {
        question: doc.title,
        voteCount: doc.responses_count
          ? `${formatCompactNumber(doc.responses_count)} réponses`
          : lead,
        kind: kindMeta.label.toUpperCase(),
        kindColor: kindMeta.fg,
        statusOpen: !doc.is_closed,
        lead,
        percent,
        href: publicContentPath('survey', doc.slug, basePath),
      }
      if (options[0] && options[1]) {
        card.splitA = { label: options[0].label, percent: Math.round(options[0].pct) }
        card.splitB = { label: options[1].label, percent: Math.round(options[1].pct) }
      }
      return card
    })
    return withLinks(
      facetCategories(
        res.facets.categories,
        palette,
        (v) => `${publicContentListPath('survey', basePath)}?category=${encodeURIComponent(v)}`,
      ),
      { variant: 'pie', cards },
    )
  } catch {
    return emptyMenu('pie')
  }
}

export async function loadChannelsMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const res = await fetchChannelCatalog({ sort: 'trend', per_page: 3 })
    const categories: MegaMenuCategory[] = res.facets.themes.slice(0, 6).map((facet, index) => ({
      name: facet.label,
      color: paletteColor(palette, index),
      count: facet.count,
      href: `/chaines?category=${encodeURIComponent(facet.value)}`,
    }))
    const cards: MegaMenuChannelCard[] = res.data.map((channel) => {
      const colors = resolveChannelColors(
        String(channel.id),
        channel.custom_color_primary,
        channel.custom_color_secondary,
      )
      const categoryLabel = channel.categories[0]
        ? channelCategoryLabels[channel.categories[0] as keyof typeof channelCategoryLabels]
        : ''
      return {
        name: channel.name,
        initials: getNameInitials(channel.name),
        verified: channel.verified,
        followers: formatCompactNumber(channel.followers_count),
        meta: categoryLabel
          ? `${formatCompactNumber(channel.followers_count)} abonnés · ${categoryLabel}`
          : `${formatCompactNumber(channel.followers_count)} abonnés`,
        logoUrl: channel.logo_url ?? null,
        avatarPrimary: colors.primary,
        avatarSecondary: colors.secondary,
        href: `/channels/${encodeURIComponent(channel.handle)}`,
      }
    })
    return withLinks(categories, { variant: 'plane', cards })
  } catch {
    return emptyMenu('plane')
  }
}

export async function loadDossiersMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const res = await fetchDossierCatalog({ sort: 'maj', per_page: 3 })
    const categories: MegaMenuCategory[] = res.facets.categories
      .filter((facet) => facet.value)
      .slice(0, 6)
      .map((facet, index) => ({
        name: facet.label,
        color: paletteColor(palette, index),
        count: facet.count,
        href: `/dossiers?cat=${encodeURIComponent(facet.value)}`,
      }))
    const pool = [res.featured, ...res.data].filter((d): d is DossierCatalogItem => !!d)
    const seen = new Set<string>()
    const cards: MegaMenuChannelCard[] = []
    for (const dossier of pool) {
      if (seen.has(dossier.slug)) continue
      seen.add(dossier.slug)
      const style = catalogThemeStyle(dossier.category?.slug)
      cards.push({
        name: dossier.name,
        initials: dossier.icon || '📁',
        meta: `${dossier.content_count} contenu${dossier.content_count > 1 ? 's' : ''}`,
        logoUrl: dossier.image_url ?? null,
        avatarPrimary: style.dot,
        avatarSecondary: style.fg,
        href: `/dossiers/${dossier.slug}`,
      })
      if (cards.length >= 3) break
    }
    return withLinks(categories, { variant: 'plane', cards })
  } catch {
    return emptyMenu('plane')
  }
}

export async function loadAudiencesMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const data = await fetchTvAudiences()
    const latestYear = data.years[data.years.length - 1]
    const channelMap = new Map(TNT_CHANNELS.map((c) => [c.id, c]))
    const latestEntries = data.channelYearData
      .filter((d) => d.year === latestYear)
      .sort((a, b) => b.pda - a.pda)
      .slice(0, 3)
    const cards: MegaMenuDataCard[] = latestEntries.map((entry) => {
      const channel = channelMap.get(entry.channelId)
      const sparkline = data.years.map(
        (year) => data.channelYearData.find((d) => d.channelId === entry.channelId && d.year === year)?.pda ?? 0,
      )
      return {
        icon: '📺',
        title: channel?.displayName ?? entry.channelId,
        meta: `${entry.pda.toFixed(1)}% de PDA${entry.millions ? ` · ${entry.millions}M` : ''} (${latestYear})`,
        sparkline,
      }
    })
    const categories: MegaMenuCategory[] = latestEntries.map((entry, index) => {
      const channel = channelMap.get(entry.channelId)
      return {
        name: channel?.displayName ?? entry.channelId,
        color: CHANNEL_CHART_COLORS[entry.channelId] ?? paletteColor(palette, index),
      }
    })
    return withLinks(categories, { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}

export async function loadProgrammeTvMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const schedules = await fetchChannelSchedules(dateStr)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const picks: { channel: string; title: string; startTime: string; endTime: string }[] = []
    for (const schedule of schedules) {
      const current =
        schedule.programmes.find((p) => p.startMinutes <= nowMinutes && nowMinutes < p.startMinutes + p.durationMinutes) ??
        schedule.programmes.find((p) => p.startMinutes >= nowMinutes)
      if (current) {
        picks.push({ channel: schedule.channel.displayName, title: current.title, startTime: current.startTime, endTime: current.endTime })
      }
      if (picks.length >= 3) break
    }

    const cards: MegaMenuArticleCard[] = picks.map((pick) => ({
      tag: pick.channel,
      title: pick.title,
      meta: `${pick.startTime} – ${pick.endTime}`,
    }))

    const genres = new Set<string>()
    for (const schedule of schedules) {
      for (const programme of schedule.programmes) {
        for (const genre of programme.genres) genres.add(genre)
      }
    }
    const categories: MegaMenuCategory[] = Array.from(genres)
      .slice(0, 6)
      .map((name, index) => ({ name, color: paletteColor(palette, index) }))

    return withLinks(categories, { variant: 'doc', cards })
  } catch {
    return emptyMenu('doc')
  }
}

export async function loadMaladiesMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const list = await fetchMaladiesPopulaires()
    const cards: MegaMenuDataCard[] = list.slice(0, 3).map((maladie) => ({
      icon: '🦠',
      title: maladie.name,
      meta: [maladie.value != null ? String(maladie.value) : null, maladie.year ? `(${maladie.year})` : null].filter(Boolean).join(' '),
      sparkline: maladie.trend.length ? maladie.trend.map((t) => t.value) : seededSparkline(maladie.id),
    }))
    const categoryNames = Array.from(new Set(list.map((m) => m.category).filter((c): c is string => !!c))).slice(0, 6)
    const categories = categoryNames.map((name, index) => ({ name, color: paletteColor(palette, index) }))
    return withLinks(categories, { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}

export async function loadMedicamentsMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const names = POPULAR_MEDICAMENTS.slice(0, 5)
    const results = await Promise.all(names.map((name) => fetchMedicamentsSearch(name).catch((): Medicament[] => [])))
    const matched = results.map((r) => r[0]).filter((m): m is Medicament => !!m)

    const cards: MegaMenuDataCard[] = matched.slice(0, 3).map((medicament) => ({
      icon: '💊',
      title: medicament.elementPharmaceutique,
      meta: medicament.formePharmaceutique || medicament.titulaire || '',
      sparkline: seededSparkline(String(medicament.cis)),
    }))

    const forms = Array.from(new Set(matched.map((m) => m.formePharmaceutique).filter(Boolean))).slice(0, 6)
    const categoryNames = forms.length ? forms : names.slice(0, 6)
    const categories = categoryNames.map((name, index) => ({ name, color: paletteColor(palette, index) }))

    return withLinks(categories, { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}

export async function loadSoinsMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const res = await fetchSoinsList()
    const top = res.countries
      .filter((c) => c.value != null)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 3)
    const cards: MegaMenuDataCard[] = top.map((country) => ({
      icon: '🏥',
      title: country.name,
      meta: `${country.value}${res.indicator.unit ? ' ' + res.indicator.unit : ''}${country.year ? ` (${country.year})` : ''}`,
      sparkline: seededSparkline(country.iso3),
    }))
    const categories = res.options
      .slice(0, 6)
      .map((option, index) => ({ name: option.label, color: paletteColor(palette, index) }))
    return withLinks(categories, { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}

/**
 * Bandeau « Tendances » du header : le contenu le plus en vue de chaque type
 * (article / statsdata / sondage), reconstruit à chaque chargement depuis le
 * catalogue public trié par tendance.
 */
export async function loadPromoTicker(categories: string[] | undefined, basePath = ''): Promise<PromoTickerItem[]> {
  const catFilter = categories?.length ? { categories } : {}
  const [articles, datasets, surveys] = await Promise.all([
    fetchPublicCatalog({ type: 'article', sort: 'trend', per_page: 1, ...catFilter }).then((r) => r.data).catch(() => []),
    fetchPublicCatalog({ type: 'statsdata', sort: 'trend', per_page: 1, ...catFilter }).then((r) => r.data).catch(() => []),
    fetchPublicCatalog({ type: 'survey', sort: 'trend', status: 'ouvert', per_page: 1, ...catFilter })
      .then((r) => r.data)
      .catch(() => []),
  ])

  const items: PromoTickerItem[] = []

  const article = articles[0]
  if (article) {
    items.push({
      kind: 'article',
      tag: 'ARTICLE',
      tagColor: '#be123c',
      title: article.title,
      href: publicContentPath('article', article.slug, basePath),
    })
  }

  const dataset = datasets[0]
  if (dataset) {
    items.push({
      kind: 'statsdata',
      tag: 'STATSDATA',
      tagColor: '#2563eb',
      title: dataset.title,
      href: publicContentPath('statsdata', dataset.slug, basePath),
      kpi: dataset.views_count ? formatCompactNumber(dataset.views_count) : `${dataset.charts_count}`,
      kpiLabel: dataset.views_count ? 'vues' : 'graphiques',
      sparkline: seededSparkline(dataset.id, 8),
    })
  }

  const survey = surveys[0]
  if (survey) {
    items.push({
      kind: 'survey',
      tag: 'SONDAGE',
      tagColor: '#7c3aed',
      title: survey.title,
      href: publicContentPath('survey', survey.slug, basePath),
      percent: Math.round(survey.primary_options?.[0]?.pct ?? 0),
    })
  }

  return items
}
