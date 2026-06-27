import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const auth = useAuthStore()

  if (!auth.hasSession) {
    if (import.meta.client && to.fullPath && !to.fullPath.startsWith('/login')) {
      const key = 'statsio.auth.redirectAfterLogin'
      try { sessionStorage.setItem(key, to.fullPath) } catch { /* ignore */ }
      try { localStorage.setItem(key, to.fullPath) } catch { /* ignore */ }
    }
    return navigateTo('/login')
  }
})
