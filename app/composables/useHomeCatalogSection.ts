import { computed, ref } from 'vue'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import { useContentDomain } from '@/composables/useContentDomain'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicContentListPath } from '@/lib/content-display'
import type { CatalogContentType, CatalogItem } from '@/types/catalog'

/**
 * Alimente un carrousel de la page d'accueil : liste courte du catalogue public
 * et gestion optimiste des favoris.
 */
export function useHomeCatalogSection(options: {
  type: CatalogContentType
  key: string
  limit?: number
}) {
  const auth = useAuthStore()
  const favOverrides = ref<Record<string, boolean>>({})
  // Domaine de l'accueil courant (statsio / tvstats / medistats) → cadre le carrousel.
  const domain = useContentDomain()
  const basePath = useContentBasePath()

  const { data, pending } = useAsyncData(
    `${options.key}-${domain.value}`,
    () =>
      fetchPublicCatalog({
        type: options.type,
        sort: 'trend',
        per_page: options.limit ?? 6,
        sub_brand: domain.value,
      }),
    { default: () => null },
  )

  const items = computed<CatalogItem[]>(() => data.value?.data ?? [])

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

  const listPath = computed(() =>
    publicContentListPath(options.type === 'survey' ? 'survey' : options.type, basePath.value),
  )

  return { items, pending, isFavorited, toggleItemFavorite, listPath }
}
