import axios from 'axios'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  try {
    await authStore.initialize()
  } catch (error) {
    const isNetworkError = axios.isAxiosError(error) && !error.response
    const { setBootstrapError } = await import('@/lib/app-bootstrap')
    setBootstrapError({
      title: 'Connexion au serveur impossible',
      message: isNetworkError
        ? 'Statsio a rencontré une erreur de connexion. Vérifiez votre connexion internet et réessayez.'
        : "Statsio n'a pas pu terminer son initialisation. Réessayez dans un instant.",
      details: 'Code erreur: ERR_NETWORK_API',
    })
  }
})
