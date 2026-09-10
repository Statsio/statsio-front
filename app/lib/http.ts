import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { AUTH_REDIRECT_KEY, clearStoredToken, getStoredToken, storeSession } from '@/lib/auth-storage'
import type { ApiAuthResponse, AuthSession, PersistMode } from '@/types/auth'

/**
 * Sur le runtime Cloudflare Workers (SSR), l'adaptateur HTTP Node d'axios est inutilisable :
 * le shim `node:http` de workerd passe un champ `cache` que le runtime rejette
 * (« The 'cache' field on 'RequestInitializerDict' is not implemented. ») et sa chaîne de
 * dépendances (`follow-redirects`, `https-proxy-agent`) casse au chargement. On force donc
 * l'adaptateur `fetch` d'axios côté serveur — il a un support explicite des Workers (axios
 * ≥ 1.7) et réutilise tout le pipeline axios (intercepteurs, paramsSerializer, FormData…).
 * Côté client, on garde l'adaptateur par défaut (XHR).
 */
const SERVER_FETCH_ADAPTER = import.meta.server ? ('fetch' as const) : undefined

let _authApiBaseUrl = 'http://localhost:8080/api/auth'
let _apiBaseUrl = 'http://localhost:8080/api'

/** Appelée depuis le plugin 01.axios.ts avec les valeurs de runtimeConfig. */
export function initHttpClients(authApiBaseUrl: string, apiBaseUrl: string) {
  _authApiBaseUrl = authApiBaseUrl
  _apiBaseUrl = apiBaseUrl
}

export const getAuthApiBaseUrl = () => _authApiBaseUrl
export const getApiBaseUrl = () => _apiBaseUrl
/** Origine Laravel sans le préfixe `/api`, pour axios.defaults.baseURL. */
export const getApiOrigin = () => _apiBaseUrl.replace(/\/api\/?$/i, '')

const REFRESH_ENDPOINT = '/refresh'
const AUTHLESS_ENDPOINTS = new Set(['/login', '/register', '/google', REFRESH_ENDPOINT])

let refreshSessionPromise: Promise<AuthSession | null> | null = null
let didRedirectToLogin = false

const redirectToLogin = () => {
  if (!import.meta.client) return
  if (didRedirectToLogin) return
  const path = window.location.pathname || '/'
  if (path.startsWith('/login')) return
  didRedirectToLogin = true
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
  try { window.sessionStorage.setItem(AUTH_REDIRECT_KEY, redirect) } catch { /* ignore */ }
  try { window.localStorage.setItem(AUTH_REDIRECT_KEY, redirect) } catch { /* ignore */ }
  window.location.assign('/login')
}

const toAuthSession = (payload: ApiAuthResponse['data']): AuthSession => ({
  token: payload.access_token ?? payload.token ?? '',
  refreshToken: payload.refresh_token,
  type: payload.type,
  expiresIn: payload.expires_in,
  user: payload.user,
})

const refreshAccessToken = async (): Promise<AuthSession | null> => {
  const storedToken = getStoredToken()

  if (!storedToken?.refreshToken) {
    clearStoredToken()
    return null
  }

  const { data } = await axios.post<ApiAuthResponse>(
    `${_authApiBaseUrl}${REFRESH_ENDPOINT}`,
    { refresh_token: storedToken.refreshToken },
    {
      adapter: SERVER_FETCH_ADAPTER,
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const session = toAuthSession(data.data)
  const persistMode: PersistMode = storedToken.mode

  storeSession(session, persistMode)

  return session
}

function createAuthenticatedClient(getBaseURL: () => string): AxiosInstance {
  const client = axios.create({
    adapter: SERVER_FETCH_ADAPTER,
    headers: { Accept: 'application/json' },
  })

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.baseURL = getBaseURL()
    const storedToken = getStoredToken()
    if (storedToken) {
      config.headers.Authorization = `${storedToken.type} ${storedToken.token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401 || !error.config) {
        return Promise.reject(error)
      }

      const originalRequest = error.config as typeof error.config & { _retry?: boolean }
      const requestUrl = originalRequest.url ?? ''
      const isRefreshRequest = requestUrl.endsWith(REFRESH_ENDPOINT)
      const isAuthlessEndpoint = Array.from(AUTHLESS_ENDPOINTS).some((endpoint) => requestUrl.endsWith(endpoint))

      if (originalRequest._retry || isRefreshRequest || isAuthlessEndpoint) {
        if (isRefreshRequest) {
          clearStoredToken()
          redirectToLogin()
        }

        return Promise.reject(error)
      }

      try {
        refreshSessionPromise ??= refreshAccessToken().finally(() => {
          refreshSessionPromise = null
        })

        const refreshedSession = await refreshSessionPromise

        if (!refreshedSession) {
          clearStoredToken()
          redirectToLogin()
          return Promise.reject(error)
        }

        originalRequest._retry = true
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `${refreshedSession.type} ${refreshedSession.token}`

        return client(originalRequest)
      } catch (refreshError) {
        clearStoredToken()
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    },
  )

  return client
}

/** Client dédié aux routes sous `/api/auth/*` (login, refresh, etc.). */
export const http = createAuthenticatedClient(getAuthApiBaseUrl)

/** Client pour le reste de l'API Laravel (`/api/*` hors auth). */
export const apiHttp = createAuthenticatedClient(getApiBaseUrl)

/**
 * Client pour les endpoints publics (pas de redirect ni refresh sur 401 — ils restent
 * consultables anonymement). Le token est tout de même transmis quand il existe, pour que
 * l'API puisse renvoyer des champs dépendants du viewer (ex. `can_edit`) aux visiteurs connectés.
 */
export const publicHttp = axios.create({
  adapter: SERVER_FETCH_ADAPTER,
  headers: { Accept: 'application/json' },
})
publicHttp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiBaseUrl()
  const storedToken = getStoredToken()
  if (storedToken) {
    config.headers.Authorization = `${storedToken.type} ${storedToken.token}`
  }
  return config
})
