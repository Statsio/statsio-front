import axios, { type AxiosInstance } from 'axios'
import { clearStoredToken, getStoredToken, storeSession } from '@/lib/auth-storage'
import type { ApiAuthResponse, AuthSession, PersistMode } from '@/types/auth'

export const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:8080/api/auth'

/** Base API Laravel (`/api`), dérivée de l’URL auth si `VITE_API_BASE_URL` est absent. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? AUTH_API_BASE_URL.replace(/\/?auth\/?$/i, '')

const REFRESH_ENDPOINT = '/refresh'
const AUTHLESS_ENDPOINTS = new Set(['/login', '/register', '/google', REFRESH_ENDPOINT])

let refreshSessionPromise: Promise<AuthSession | null> | null = null
let didRedirectToLogin = false
const REDIRECT_KEY = 'statsio.auth.redirectAfterLogin'

const redirectToLogin = () => {
  if (typeof window === 'undefined') return
  if (didRedirectToLogin) return
  const path = window.location.pathname || '/'
  if (path.startsWith('/login')) return
  didRedirectToLogin = true
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, redirect)
  } catch {
    // ignore storage failures
  }
  try {
    window.localStorage.setItem(REDIRECT_KEY, redirect)
  } catch {
    // ignore storage failures
  }
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
    `${AUTH_API_BASE_URL}${REFRESH_ENDPOINT}`,
    { refresh_token: storedToken.refreshToken },
    {
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

function createAuthenticatedClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const storedToken = getStoredToken()

    if (storedToken) {
      config.headers.Authorization = `${storedToken.type} ${storedToken.token}`
    }

    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
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
export const http = createAuthenticatedClient(AUTH_API_BASE_URL)

/** Client pour le reste de l’API Laravel (`/api/*` hors auth). */
export const apiHttp = createAuthenticatedClient(API_BASE_URL)
