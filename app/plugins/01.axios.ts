import axios from 'axios'
import { initHttpClients, getApiOrigin } from '@/lib/http'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl as string
  const authApiBaseUrl = `${apiBaseUrl}/auth`

  initHttpClients(authApiBaseUrl, apiBaseUrl)

  axios.defaults.baseURL = getApiOrigin()
})
