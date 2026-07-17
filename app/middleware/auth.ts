import type { RouteLocationNormalized } from 'vue-router'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  // localStorage n'existe pas côté serveur — l'hydratation se fait dans le plugin client
  if (import.meta.server) return

  const auth = useAuthStore()

  if (!auth.hasSession) {
    if (to.fullPath && !to.fullPath.startsWith('/login')) {
      try { sessionStorage.setItem(AUTH_REDIRECT_KEY, to.fullPath) } catch { /* ignore */ }
      try { localStorage.setItem(AUTH_REDIRECT_KEY, to.fullPath) } catch { /* ignore */ }
    }
    return navigateTo('/login')
  }
})
