import { computed, ref } from 'vue'
import { fetchPublicCatalog } from '@/api/studio'
import { fetchChannelCatalog, toggleChannelSubscription } from '@/api/channels'
import { fetchPlatformStats } from '@/api/platform-stats'
import { fetchContentCategories } from '@/api/content-categories'
import { useAuthStore } from '@/stores/auth'
import {
  buildDayFigure,
  buildLiveFeed,
  interleave,
  mergeThemeFacets,
  pickDailyQuestion,
  relabelThemes,
  splitThemes,
  type HomeTheme,
} from '@/lib/home-tranches'
import type { CatalogItem, CatalogResponse } from '@/types/catalog'
import type { ChannelCatalogItem, ChannelCatalogResponse } from '@/types/channel-catalog'
import type { PlatformStats } from '@/types/platform-stats'

/**
 * Données de la page d'accueil Statsio (charte « Tranches »).
 * Un seul `useAsyncData` groupé (SSR) : contenus récents des 3 types (+ leurs
 * facettes de catégories), sondages ouverts, chaînes tendance et compteurs de la
 * plateforme. Statsio agrège toutes les sous-marques (aucun filtre `sub_brand`).
 * Les contenus d'un thème du camembert sont chargés à la demande et mis en cache.
 */
const EMPTY_CATALOG: CatalogResponse = {
  data: [],
  meta: { total: 0, shown: 0, per_page: 0, has_more: false },
  facets: { categories: [], formats: [] },
  stats: { published: 0, channels: 0, charts: 0, last_published_at: null },
  featured: null,
}

const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback)

export function useStatsioHome() {
  const auth = useAuthStore()

  const { data, pending } = useAsyncData(
    'statsio-home-tranches',
    async () => {
      const [articles, statsdata, surveys, channels, platform, categories] = await Promise.all([
        safe(fetchPublicCatalog({ type: 'article', sort: 'recent', per_page: 6 }), EMPTY_CATALOG),
        safe(fetchPublicCatalog({ type: 'statsdata', sort: 'recent', per_page: 6 }), EMPTY_CATALOG),
        safe(fetchPublicCatalog({ type: 'survey', sort: 'trend', status: 'ouvert', per_page: 6 }), EMPTY_CATALOG),
        safe<ChannelCatalogResponse | null>(fetchChannelCatalog({ sort: 'trend', per_page: 3 }), null),
        safe<PlatformStats | null>(fetchPlatformStats(), null),
        safe(fetchContentCategories(), []),
      ])
      const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]))
      return { articles, statsdata, surveys, channels, platform, categoryNames }
    },
    { default: () => null },
  )

  /* ── compteurs du hero ── */
  const totalContents = computed(() => {
    const d = data.value
    if (!d) return 0
    return d.platform?.publishedTotal || d.articles.meta.total + d.statsdata.meta.total + d.surveys.meta.total
  })
  const channelsCount = computed(() => data.value?.platform?.channels ?? data.value?.channels?.meta.total ?? 0)
  const lastPublishedAt = computed(
    () =>
      data.value?.platform?.lastPublishedAt ??
      data.value?.articles.stats.last_published_at ??
      data.value?.statsdata.stats.last_published_at ??
      null,
  )

  /* ── thèmes (camembert des sujets) ── */
  const themes = computed<HomeTheme[]>(() =>
    relabelThemes(
      mergeThemeFacets([
        data.value?.articles.facets.categories,
        data.value?.statsdata.facets.categories,
        data.value?.surveys.facets.categories,
      ]),
      data.value?.categoryNames ?? {},
    ),
  )
  const splitTheme = computed(() => splitThemes(themes.value))
  const dayFigure = computed(() => buildDayFigure(themes.value, totalContents.value))

  /* ── fil « En direct » + question du jour ── */
  const feed = computed(() =>
    buildLiveFeed({
      articles: data.value?.articles.data ?? [],
      statsdata: data.value?.statsdata.data ?? [],
      surveys: data.value?.surveys.data ?? [],
    }),
  )
  const dailyQuestion = computed<CatalogItem | null>(() => pickDailyQuestion(data.value?.surveys.data ?? []))

  /* ── contenus d'un thème, à la demande ── */
  const themeItems = ref<Record<string, CatalogItem[]>>({})
  const themeLoading = ref<string | null>(null)

  async function loadTheme(value: string) {
    if (themeItems.value[value]) return
    themeLoading.value = value
    try {
      const [sd, ar, su] = await Promise.all(
        (['statsdata', 'article', 'survey'] as const).map((type) =>
          safe(fetchPublicCatalog({ type, category: value, sort: 'trend', per_page: 3 }), EMPTY_CATALOG),
        ),
      )
      themeItems.value = { ...themeItems.value, [value]: interleave([sd!.data, ar!.data, su!.data], 5) }
    } finally {
      if (themeLoading.value === value) themeLoading.value = null
    }
  }

  /* ── chaînes + abonnement optimiste (comportement existant) ── */
  const channels = computed<ChannelCatalogItem[]>(() => data.value?.channels?.data ?? [])
  const featuredChannel = computed(() => data.value?.channels?.featured ?? null)
  const followOverrides = ref<Record<number, { following: boolean; count: number }>>({})
  const followBusy = ref<number | null>(null)

  const isFollowing = (c: ChannelCatalogItem) => followOverrides.value[c.id]?.following ?? c.is_following
  const followersOf = (c: ChannelCatalogItem) => followOverrides.value[c.id]?.count ?? c.followers_count

  async function toggleFollow(c: ChannelCatalogItem) {
    if (!auth.isAuthenticated) {
      await navigateTo('/login')
      return
    }
    followBusy.value = c.id
    try {
      const res = await toggleChannelSubscription(c.id)
      followOverrides.value = { ...followOverrides.value, [c.id]: { following: res.isFollowing, count: res.followersCount } }
    } catch {
      // état inchangé
    } finally {
      followBusy.value = null
    }
  }

  return {
    pending,
    totalContents,
    channelsCount,
    lastPublishedAt,
    themes,
    topThemes: computed(() => splitTheme.value.top),
    otherThemes: computed(() => splitTheme.value.others),
    dayFigure,
    feed,
    dailyQuestion,
    themeItems,
    themeLoading,
    loadTheme,
    channels,
    featuredChannel,
    isFollowing,
    followersOf,
    followBusy,
    toggleFollow,
  }
}
