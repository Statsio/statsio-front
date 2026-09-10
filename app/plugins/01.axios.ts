import axios from 'axios'
import { initHttpClients, getApiOrigin } from '@/lib/http'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBaseUrl = (import.meta.server ? config.apiBaseUrlServer : config.public.apiBaseUrl) as string
  const authApiBaseUrl = `${apiBaseUrl}/auth`

  initHttpClients(authApiBaseUrl, apiBaseUrl)

  axios.defaults.baseURL = getApiOrigin()

  // SSR sur Cloudflare Workers : l'adaptateur HTTP Node d'axios est cassé (cf. lib/http.ts).
  // Filet de sécurité pour tout appel axios direct qui n'utiliserait pas nos instances.
  if (import.meta.server) {
    axios.defaults.adapter = 'fetch'
  }
})
