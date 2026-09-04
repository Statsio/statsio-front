import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Favicon par sous-marque, rendu côté serveur (via useHead) pour qu'un accès
 * direct à /tvstats, /medistats ou /studio serve tout de suite la bonne icône,
 * sans flash de l'icône Statsio le temps que le JS s'hydrate.
 */
export function useFavicon() {
  const route = useRoute()

  const faviconHref = computed(() => {
    const path = route.path

    if (path.startsWith('/studio')) return '/brand/statsio-studio.svg'
    if (path.startsWith('/tvstats')) return '/brand/tvstats/tvstats-logo.svg'
    if (path.startsWith('/medistats')) return '/brand/medistats/medistats-logo.svg'

    return '/brand/statsio-logo.svg'
  })

  useHead({
    link: [
      // Même `key` que l'entrée de nuxt.config.ts → celle-ci l'emporte.
      { key: 'icon-svg', rel: 'icon', type: 'image/svg+xml', href: faviconHref },
    ],
  })
}
