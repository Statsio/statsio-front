import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPublicCatalog } from '@/api/studio'
import { formatCatalogCount } from '@/lib/catalog-format'
import {
  rankTrends,
  TREND_PERIODS,
  TREND_TYPES,
  type TrendPeriod,
  type TrendTypeFilter,
} from '@/lib/trends'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogItem } from '@/types/catalog'

function parseType(raw: unknown): TrendTypeFilter {
  return TREND_TYPES.some((t) => t.value === raw) ? (raw as TrendTypeFilter) : 'all'
}

function parsePeriod(raw: unknown): TrendPeriod {
  return TREND_PERIODS.some((p) => p.value === raw) ? (raw as TrendPeriod) : 'today'
}

/**
 * Alimente la page « Tendances » : un seul chargement groupé du catalogue public
 * (articles / StatsData / sondages, triés par audience), fusionné puis reclassé
 * côté client selon le type et la fenêtre choisis. Le filtre de type et la
 * période sont synchronisés avec l'URL, comme les autres listings.
 */
export function useTrends() {
  const route = useRoute()
  const router = useRouter()
  const domain = useContentDomain()

  const type = ref<TrendTypeFilter>(parseType(route.query.type))
  const period = ref<TrendPeriod>(parsePeriod(route.query.p))

  // Figé au premier rendu : le classement doit être identique côté serveur et client.
  const now = ref(Date.now())

  const { data, pending } = useAsyncData(
    `trends-feed-${domain.value}`,
    async () => {
      const [articles, statsdata, surveys] = await Promise.all([
        fetchPublicCatalog({ type: 'article', sort: 'trend', per_page: 24, sub_brand: domain.value }),
        fetchPublicCatalog({ type: 'statsdata', sort: 'trend', per_page: 24, sub_brand: domain.value }),
        fetchPublicCatalog({ type: 'survey', sort: 'trend', per_page: 24, sub_brand: domain.value }),
      ])
      return { articles, statsdata, surveys }
    },
    { default: () => null, watch: [domain] },
  )

  const allItems = computed<CatalogItem[]>(() => {
    const d = data.value
    if (!d) return []
    return [...d.articles.data, ...d.statsdata.data, ...d.surveys.data]
  })

  const ranked = computed(() => rankTrends(allItems.value, type.value, period.value, now.value))
  const top3 = computed(() => ranked.value.slice(0, 3))
  const rest = computed(() => ranked.value.slice(3))

  const counts = computed(() => {
    const d = data.value
    const base = { all: 0, article: 0, statsdata: 0, survey: 0 }
    if (!d) return base
    base.article = d.articles.data.length
    base.statsdata = d.statsdata.data.length
    base.survey = d.surveys.data.length
    base.all = base.article + base.statsdata + base.survey
    return base
  })

  const heroStats = computed(() => {
    const d = data.value
    return [
      { label: 'Contenus en lice', value: formatCatalogCount(counts.value.all) },
      { label: 'Articles publiés', value: formatCatalogCount(d?.articles.stats.published ?? 0) },
      { label: 'StatsData publiés', value: formatCatalogCount(d?.statsdata.stats.published ?? 0) },
      { label: 'Sondages publiés', value: formatCatalogCount(d?.surveys.stats.published ?? 0) },
    ]
  })

  const countLine = computed(() => `${ranked.value.length} contenus classés`)

  const isEmpty = computed(() => !pending.value && ranked.value.length === 0)

  if (import.meta.client) {
    watch([type, period], () => {
      const next: Record<string, string> = {}
      if (type.value !== 'all') next.type = type.value
      if (period.value !== 'today') next.p = period.value
      void router.replace({ query: next })
    }, { flush: 'post' })
  }

  function selectType(value: TrendTypeFilter) {
    type.value = value
  }

  function selectPeriod(value: TrendPeriod) {
    period.value = value
  }

  return {
    type,
    period,
    pending,
    ranked,
    top3,
    rest,
    counts,
    heroStats,
    countLine,
    isEmpty,
    selectType,
    selectPeriod,
  }
}
