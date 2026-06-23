import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'

export function useAppTheme() {
  const route = useRoute()

  watchEffect(() => {
    if (route.path.startsWith('/tvstats')) {
      document.documentElement.setAttribute('data-theme', 'tvstats')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  })
}
