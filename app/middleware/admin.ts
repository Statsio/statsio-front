import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  // localStorage n'existe pas côté serveur — l'hydratation se fait dans le plugin client
  if (import.meta.server) return

  const auth = useAuthStore()

  if (!auth.hasSession) return navigateTo('/login')
  if (!auth.isAdmin) return navigateTo('/')
})
