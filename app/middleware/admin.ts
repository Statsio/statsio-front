export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()

  if (!auth.hasSession) return navigateTo('/login')
  if (!auth.isAdmin) return navigateTo('/')
})
