export default defineNuxtRouteMiddleware(() => {
  // localStorage n'existe pas côté serveur — l'hydratation se fait dans le plugin client
  if (import.meta.server) return

  const auth = useAuthStore()

  if (auth.hasSession) {
    return navigateTo('/profile')
  }
})
