import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export function useFavicon() {
  const route = useRoute()

  const updateFavicon = () => {
    let faviconPath = '/favicon.ico'

    if (route.path.startsWith('/studio')) {
      faviconPath = '/brand/statsio-studio.svg'
    } else if (route.path.startsWith('/tvstats')) {
      faviconPath = '/brand/tvstats/tvstats-logo.svg'
    } else if (route.path.startsWith('/medistats')) {
      faviconPath = '/brand/medistats/medistats-logo.svg'
    } else {
      faviconPath = '/brand/statsio-logo.svg'
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
