import { fetchPublicArticles, fetchPublicStatsDataCatalog, fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'
import { getPublicChannels, getChannelCategories, channelCategoryLabels } from '@/api/channels'
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
import { formatRowCount, relativeUpdate } from '@/utils/statsDataFormat'
import { formatCompactNumber, getNameInitials } from '@/lib/format'
import { isFormBlock } from '@/types/studio'
import { resolveChannelColors } from '@/lib/channel-brand'
import type {
  MegaMenuCategory,
  MegaMenuContent,
  MegaMenuArticleCard,
  MegaMenuDataCard,
  MegaMenuPollCard,
  MegaMenuChannelCard,
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
function seededSparkline(seed: string, count = 6): number[] {
  let value = 0
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) % 9973
  const points: number[] = []
  for (let i = 0; i < count; i++) {
    value = (value * 1103515245 + 12345) % 2147483648
    points.push((value % 100) + 1)
  }
  return points
}

function deriveCategories(docs: { categories?: string[] }[], palette: string[], max = 5): MegaMenuCategory[] {
  const seen = new Set<string>()
  for (const doc of docs) {
    for (const cat of doc.categories ?? []) {
      if (cat) seen.add(cat)
    }
    if (seen.size >= max) break
  }
  return Array.from(seen)
    .slice(0, max)
    .map((name, index) => ({ name, color: paletteColor(palette, index) }))
}

/** `palette` est toujours non vide en pratique — un fallback neutre couvre le cas contraire pour TypeScript. */
function paletteColor(palette: string[], index: number): string {
  return palette[index % palette.length] ?? '#94a3b8'
}

function withLinks(categories: MegaMenuCategory[], menu: MegaMenuContent): HeaderMenuData {
  return { categories, links: categories.map((c) => c.name), menu }
}

export async function loadArticleMenu(categories: string[] | undefined, palette: string[]): Promise<HeaderMenuData> {
  try {
    const docs = await fetchPublicArticles(categories)
    const cards: MegaMenuArticleCard[] = docs.slice(0, 3).map((doc) => ({
      tag: doc.categories?.[0] ?? 'Article',
      title: doc.title,
      meta: doc.author?.name ? `Par ${doc.author.name}` : (relativeUpdate(doc.updated_at) ?? ''),
    }))
    return withLinks(deriveCategories(docs, palette), { variant: 'doc', cards })
  } catch {
    return emptyMenu('doc')
  }
}

export async function loadStatsDataMenu(categories: string[] | undefined, palette: string[]): Promise<HeaderMenuData> {
  try {
    const docs = await fetchPublicStatsDataCatalog(categories)
    const cards: MegaMenuDataCard[] = docs.slice(0, 3).map((doc) => ({
      icon: getStatsDataVisual(doc.categories, doc.emoji).emoji,
      title: doc.title,
      meta: formatRowCount(doc.datasets?.[0]?.row_count) ?? relativeUpdate(doc.updated_at) ?? '',
      sparkline: seededSparkline(doc.id),
    }))
    return withLinks(deriveCategories(docs, palette), { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}

export async function loadSurveyMenu(categories: string[] | undefined, palette: string[]): Promise<HeaderMenuData> {
  try {
    const docs = await fetchPublicSurveys(categories)
    const cards: MegaMenuPollCard[] = docs.slice(0, 2).map((doc: StatsDataDocument) => {
      const questionCount = (doc.blocks ?? []).filter((block) => isFormBlock(block.type)).length
      return {
        question: doc.title,
        voteCount: questionCount > 0 ? `${questionCount} question${questionCount > 1 ? 's' : ''}` : 'Sondage ouvert',
      }
    })
    return withLinks(deriveCategories(docs, palette), { variant: 'pie', cards })
  } catch {
    return emptyMenu('pie')
  }
}

export async function loadChannelsMenu(palette: string[]): Promise<HeaderMenuData> {
  try {
    const [{ channels }, categoryList] = await Promise.all([
      getPublicChannels({ sort: 'popular', perPage: 3 }),
      getChannelCategories().catch(() => []),
    ])
    const categories: MegaMenuCategory[] = categoryList
      .slice(0, 5)
      .map((c, index) => ({ name: c.label, color: paletteColor(palette, index) }))
    const cards: MegaMenuChannelCard[] = channels.map((channel) => {
      const profile = channel.profile
      const categoryLabel = profile.categories[0] ? channelCategoryLabels[profile.categories[0]] : ''
      const colors = resolveChannelColors(String(channel.id), profile.custom_color_primary, profile.custom_color_secondary)
      return {
        name: profile.name,
        initials: getNameInitials(profile.name),
        meta: categoryLabel
          ? `${formatCompactNumber(profile.subscriber_count)} abonnés · ${categoryLabel}`
          : `${formatCompactNumber(profile.subscriber_count)} abonnés`,
        logoUrl: profile.logo_url ?? null,
        avatarPrimary: colors.primary,
        avatarSecondary: colors.secondary,
      }
    })
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
      .slice(0, 5)
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
    const categoryNames = Array.from(new Set(list.map((m) => m.category).filter((c): c is string => !!c))).slice(0, 5)
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

    const forms = Array.from(new Set(matched.map((m) => m.formePharmaceutique).filter(Boolean))).slice(0, 5)
    const categoryNames = forms.length ? forms : names.slice(0, 5)
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
      .slice(0, 5)
      .map((option, index) => ({ name: option.label, color: paletteColor(palette, index) }))
    return withLinks(categories, { variant: 'bar', cards })
  } catch {
    return emptyMenu('bar')
  }
}
