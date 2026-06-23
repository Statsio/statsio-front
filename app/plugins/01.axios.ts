import axios from 'axios'
import { initHttpClients, getApiOrigin } from '@/lib/http'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authApiBaseUrl = config.public.authApiBaseUrl as string
  const apiBaseUrl = config.public.apiBaseUrl as string

  initHttpClients(authApiBaseUrl, apiBaseUrl)

  axios.defaults.baseURL = getApiOrigin()
})
