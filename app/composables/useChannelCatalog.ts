import { computed, ref, watch, type Ref } from 'vue'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogContentType, CatalogItem, CatalogSort } from '@/types/catalog'
import type { SubBrand } from '@/types/sub-brand'

const PER_PAGE = 60

/** Premier lot de contenus d'une chaîne (3 types, tri par défaut) — chargeable côté serveur. */
export interface ChannelContents {
  articles: CatalogItem[]
  statsData: CatalogItem[]
  surveys: CatalogItem[]
  counts: { articles: number; statsdata: number; surveys: number }
}

export async function fetchChannelContents(
  channelId: number,
  subBrand?: SubBrand,
  sorts: { articles?: CatalogSort; statsData?: CatalogSort; surveys?: CatalogSort } = {},
): Promise<ChannelContents> {
  const load = (type: CatalogContentType, sort: CatalogSort) =>
    fetchPublicCatalog({ type, channel_id: channelId, sort, per_page: PER_PAGE, sub_brand: subBrand })
  const [a, s, p] = await Promise.all([
    load('article', sorts.articles ?? 'trend'),
    load('statsdata', sorts.statsData ?? 'trend'),
    load('survey', sorts.surveys ?? 'trend'),
  ])
  return {
    articles: a.data,
    statsData: s.data,
    surveys: p.data,
    counts: { articles: a.meta.total, statsdata: s.meta.total, surveys: p.meta.total },
  }
}

/**
 * Contenus publiés d'une chaîne (page publique Détail Chaîne v2), servis via le
 * catalogue public filtré par `channel_id` — donc au format `CatalogItem`, afin
 * de réutiliser exactement les cartes des listings v2 (ArticleCard / StatsDataCard
 * / SurveyCard). Chaque onglet a son propre tri (tendance / récent / vues).
 */
export function useChannelCatalog(
  channelId: Ref<number | undefined>,
  /** Contenus déjà chargés (SSR) : évite le chargement initial côté client. */
  initial?: Ref<ChannelContents | null | undefined>,
) {
  const auth = useAuthStore()
  const domain = useContentDomain()

  const sortArticles = ref<CatalogSort>('trend')
  const sortStatsData = ref<CatalogSort>('trend')
  const sortSurveys = ref<CatalogSort>('trend')

  // Valeurs rechargées côté client (tri, changement de chaîne) ; à défaut, le lot
  // initial chargé côté serveur. En `computed` : en SSR les `watch` ne se
  // déclenchent pas, le rendu doit lire directement les données serveur.
  const local = ref<Partial<ChannelContents>>({})
  const fetching = ref(false)
  const articles = computed(() => local.value.articles ?? initial?.value?.articles ?? [])
  const statsData = computed(() => local.value.statsData ?? initial?.value?.statsData ?? [])
  const surveys = computed(() => local.value.surveys ?? initial?.value?.surveys ?? [])
  const counts = computed(
    () => local.value.counts ?? initial?.value?.counts ?? { articles: 0, statsdata: 0, surveys: 0 },
  )
  const loading = computed(
    () => fetching.value || (channelId.value != null && !initial?.value && !local.value.counts),
  )
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
    fetching.value = true
    try {
      local.value = await fetchChannelContents(channelId.value, domain.value, {
        articles: sortArticles.value,
        statsData: sortStatsData.value,
        surveys: sortSurveys.value,
      })
    } finally {
      fetching.value = false
    }
  }

  // Sans lot initial (échec SSR, ou usage hors SSR) : chargement côté client.
  watch(channelId, (id) => {
    if (id != null && !initial?.value) void loadAll()
  }, { immediate: true })
  watch(sortArticles, async () => {
    local.value = { ...local.value, articles: (await loadType('article', sortArticles.value)).data }
  })
  watch(sortStatsData, async () => {
    local.value = { ...local.value, statsData: (await loadType('statsdata', sortStatsData.value)).data }
  })
  watch(sortSurveys, async () => {
    local.value = { ...local.value, surveys: (await loadType('survey', sortSurveys.value)).data }
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
