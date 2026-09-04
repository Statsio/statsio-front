import { computed, ref } from 'vue'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogItem } from '@/types/catalog'

/**
 * Alimente la page d'accueil « éditoriale » (façon magazine) : un seul chargement
 * groupé du catalogue public (articles / statsdata / sondages) découpé ensuite en
 * blocs distincts (la une, rivière d'articles, plus consultés, chiffres en direct,
 * consultations ouvertes). Gère aussi les favoris de façon optimiste, partagés
 * entre tous les blocs.
 */
export function useHomeFeed() {
  const auth = useAuthStore()
  const domain = useContentDomain()
  const favOverrides = ref<Record<string, boolean>>({})

  const { data, pending } = useAsyncData(
    `home-feed-${domain.value}`,
    async () => {
      const [articles, statsdata, surveys] = await Promise.all([
        fetchPublicCatalog({ type: 'article', sort: 'trend', per_page: 14, sub_brand: domain.value }),
        fetchPublicCatalog({ type: 'statsdata', sort: 'trend', per_page: 6, sub_brand: domain.value }),
        fetchPublicCatalog({ type: 'survey', sort: 'trend', per_page: 6, sub_brand: domain.value }),
      ])
      return { articles, statsdata, surveys }
    },
    { default: () => null },
  )

  const allArticles = computed<CatalogItem[]>(() => data.value?.articles.data ?? [])

  /** Grand contenu « à la une » : la mise en avant admin, sinon le 1er tendance. */
  const lead = computed<CatalogItem | null>(
    () => data.value?.articles.featured ?? allArticles.value[0] ?? null,
  )

  /** Colonne de contenus secondaires à droite de la une. */
  const secondary = computed<CatalogItem[]>(() =>
    allArticles.value.filter((it) => it.id !== lead.value?.id).slice(0, 4),
  )

  /** Rivière « derniers décryptages » — ce qui reste après la une + la colonne. */
  const river = computed<CatalogItem[]>(() => {
    const used = new Set([lead.value?.id, ...secondary.value.map((it) => it.id)])
    return allArticles.value.filter((it) => !used.has(it.id)).slice(0, 6)
  })

  /** Encart « les plus consultés » — tri par vues, indépendant de la une. */
  const mostRead = computed<CatalogItem[]>(() =>
    [...allArticles.value].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 5),
  )

  const statsdata = computed<CatalogItem[]>(() => (data.value?.statsdata.data ?? []).slice(0, 3))
  const surveys = computed<CatalogItem[]>(() => (data.value?.surveys.data ?? []).slice(0, 3))

  function isFavorited(item: CatalogItem) {
    return favOverrides.value[item.id] ?? item.is_favorited
  }

  async function toggleItemFavorite(item: CatalogItem) {
    if (!auth.isAuthenticated) {
      await navigateTo('/login')
      return
    }
    try {
      const next = await toggleFavorite(item.id)
      favOverrides.value = { ...favOverrides.value, [item.id]: next }
    } catch {
      // silencieux : l'état reste inchangé
    }
  }

  const isEmpty = computed(
    () => !pending.value && !lead.value && !statsdata.value.length && !surveys.value.length,
  )

  return {
    pending,
    isEmpty,
    lead,
    secondary,
    river,
    mostRead,
    statsdata,
    surveys,
    isFavorited,
    toggleItemFavorite,
  }
}
