import { initHttpClients } from '@/lib/http'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBaseUrl = (import.meta.server ? config.apiBaseUrlServer : config.public.apiBaseUrl) as string
  const authApiBaseUrl = `${apiBaseUrl}/auth`

  initHttpClients(authApiBaseUrl, apiBaseUrl)
})
