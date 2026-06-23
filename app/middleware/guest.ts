export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()

  if (auth.hasSession) {
    return navigateTo('/profile')
  }
})
