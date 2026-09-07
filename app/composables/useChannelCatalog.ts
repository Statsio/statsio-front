import { ref, watch, type Ref } from 'vue'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogContentType, CatalogItem, CatalogSort } from '@/types/catalog'

const PER_PAGE = 60

/**
 * Contenus publiés d'une chaîne (page publique Détail Chaîne v2), servis via le
 * catalogue public filtré par `channel_id` — donc au format `CatalogItem`, afin
 * de réutiliser exactement les cartes des listings v2 (ArticleCard / StatsDataCard
 * / SurveyCard). Chaque onglet a son propre tri (tendance / récent / vues).
 */
export function useChannelCatalog(channelId: Ref<number | undefined>) {
  const auth = useAuthStore()
  const domain = useContentDomain()

  const sortArticles = ref<CatalogSort>('trend')
  const sortStatsData = ref<CatalogSort>('trend')
  const sortSurveys = ref<CatalogSort>('trend')

  const articles = ref<CatalogItem[]>([])
  const statsData = ref<CatalogItem[]>([])
  const surveys = ref<CatalogItem[]>([])
  const counts = ref({ articles: 0, statsdata: 0, surveys: 0 })
  const loading = ref(true)
  const favOverrides = ref<Record<string, boolean>>({})

  async function loadType(type: CatalogContentType, sort: CatalogSort) {
    if (!channelId.value) return { data: [] as CatalogItem[], total: 0 }
    const res = await fetchPublicCatalog({
      type,
      channel_id: channelId.value,
      sort,
      per_page: PER_PAGE,
      sub_brand: domain.value,
    })
    return { data: res.data, total: res.meta.total }
  }

  async function loadAll() {
    if (!channelId.value) return
    loading.value = true
    try {
      const [a, s, p] = await Promise.all([
        loadType('article', sortArticles.value),
        loadType('statsdata', sortStatsData.value),
        loadType('survey', sortSurveys.value),
      ])
      articles.value = a.data
      statsData.value = s.data
      surveys.value = p.data
      counts.value = { articles: a.total, statsdata: s.total, surveys: p.total }
    } finally {
      loading.value = false
    }
  }

  watch(channelId, loadAll, { immediate: true })
  watch(sortArticles, async () => {
    articles.value = (await loadType('article', sortArticles.value)).data
  })
  watch(sortStatsData, async () => {
    statsData.value = (await loadType('statsdata', sortStatsData.value)).data
  })
  watch(sortSurveys, async () => {
    surveys.value = (await loadType('survey', sortSurveys.value)).data
  })

  async function toggleItemFavorite(item: CatalogItem) {
    if (!auth.isAuthenticated) {
      await navigateTo('/login')
      return
    }
    const next = await toggleFavorite(item.id)
    favOverrides.value = { ...favOverrides.value, [item.id]: next }
  }

  function isFavorited(item: CatalogItem) {
    return favOverrides.value[item.id] ?? item.is_favorited
  }

  return {
    sortArticles,
    sortStatsData,
    sortSurveys,
    articles,
    statsData,
    surveys,
    counts,
    loading,
    toggleItemFavorite,
    isFavorited,
  }
}
