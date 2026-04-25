import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export function useFavicon() {
  const route = useRoute()

  const updateFavicon = () => {
    let faviconPath = '/favicon.ico'

    if (route.path.startsWith('/studio')) {
      // Favicon Studio (SVG créé précédemment)
      faviconPath = '/src/assets/brand/statsio-studio.svg'
    } else if (route.path.startsWith('/tvstats')) {
      // Favicon TVSTATS
      faviconPath = '/src/assets/brand/tvstats/tvstats-logo.svg'
    } else {
      // Favicon Statsio par défaut
      faviconPath = '/src/assets/brand/statsio-logo.svg'
    }

    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
    if (link) {
      link.href = faviconPath
      link.type = faviconPath.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
    } else {
      const newLink = document.createElement('link')
      newLink.rel = 'icon'
      newLink.href = faviconPath
      newLink.type = faviconPath.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
      document.head.appendChild(newLink)
    }
  }

  onMounted(() => {
    updateFavicon()
  })

  watch(
    () => route.path,
    () => {
      updateFavicon()
    }
  )
}
