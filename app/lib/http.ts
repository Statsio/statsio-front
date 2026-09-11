import { AUTH_REDIRECT_KEY, clearStoredToken, getStoredToken, storeSession } from '@/lib/auth-storage'
import type { ApiAuthResponse, AuthSession, PersistMode } from '@/types/auth'

/**
 * Client HTTP basé sur `$fetch` (ofetch, natif Nitro) — jamais sur axios.
 *
 * Historique : axios ne fonctionne pas côté serveur sur le runtime Cloudflare Workers.
 * Son adaptateur HTTP Node (`http.js`) est bundlé quel que soit l'adaptateur choisi à
 * l'exécution (axios importe `follow-redirects` / `https-proxy-agent` de façon statique
 * et inconditionnelle dans `adapters.js`), ce qui fait fuiter des polyfills Node injectés
 * par le build (préréglage `unenv` de Nitro) jusque dans l'adaptateur `fetch` lui-même :
 * même avec `adapter: 'fetch'` explicite, chaque requête échoue avec
 * « The 'cache' field on 'RequestInitializerDict' is not implemented. » (confirmé en
 * reproduisant le runtime Workers en local via `wrangler dev` — un `fetch()` nu fonctionne
 * dans tous les cas testés, un appel axios échoue systématiquement, adaptateur ou non).
 * `$fetch` n'a pas ce problème : c'est le client déjà utilisé sans souci ailleurs dans le
 * projet (`server/routes/sitemap.xml.ts`) et il tourne à l'identique sur Workers/Node/navigateur.
 */

let _authApiBaseUrl = 'http://localhost:8080/api/auth'
let _apiBaseUrl = 'http://localhost:8080/api'

/** Appelée depuis le plugin 01.http.ts avec les valeurs de runtimeConfig. */
export function initHttpClients(authApiBaseUrl: string, apiBaseUrl: string) {
  _authApiBaseUrl = authApiBaseUrl
  _apiBaseUrl = apiBaseUrl
}

export const getAuthApiBaseUrl = () => _authApiBaseUrl
export const getApiBaseUrl = () => _apiBaseUrl
/** Origine Laravel sans le préfixe `/api`, pour d'éventuels appels absolus. */
export const getApiOrigin = () => _apiBaseUrl.replace(/\/api\/?$/i, '')

/** Réponse façon axios (`{ data }`) : tous les modules `app/api/*.ts` lisent `response.data`. */
export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export interface HttpRequestConfig {
  headers?: Record<string, string>
  /** Valeurs simples ou tableaux (ex. `columns: string[]`) — sérialisés par `$fetch` (ofetch). */
  params?: Record<string, unknown>
  /**
   * Sérialiseur de query-string custom (bypass `query`) — voir app/api/studio.ts.
   * Reçoit `params` (convention axios) : certains sérialiseurs l'utilisent
   * (`buildParamsSerializer`), d'autres l'ignorent au profit d'une closure déjà
   * pré-remplie (`distinctParamsSerializer`, `facetParamsSerializer`). Signature en
   * méthode (et non en propriété-flèche) pour que son paramètre reste bivariant :
   * un sérialiseur plus spécifique que `Record<string, unknown>` (ex. `BlockQueryParams`)
   * reste assignable ici, comme `paramsSerializer` côté axios.
   */
  paramsSerializer?(params?: HttpRequestConfig['params']): string
  signal?: AbortSignal
  /** @internal posé par l'intercepteur 401 pour n'autoriser qu'un seul retry. */
  _retry?: boolean
}

/** Erreur façon axios (`error.response.status` / `.data`) levée par les clients de ce module. */
export class HttpError extends Error {
  readonly config: HttpRequestConfig & { url: string; method: string }
  readonly response?: HttpResponse

  constructor(message: string, config: HttpRequestConfig & { url: string; method: string }, response?: HttpResponse) {
    super(message)
    this.name = 'HttpError'
    this.config = config
    this.response = response
  }
}

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError

function combineURLs(baseURL: string, url: string): string {
  return url ? `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}` : baseURL
}

/**
 * `params` est transmis tel quel à `$fetch` (option `query`, sérialisée par ofetch) pour
 * garder les types d'origine (nombres, booléens…). `paramsSerializer` bypasse `query` : il
 * fournit directement la query-string finale (voir `distinctParamsSerializer` dans
 * app/api/studio.ts), qu'on ajoute nous-mêmes à l'URL.
 */
function buildRequestUrl(baseURL: string, url: string, config?: HttpRequestConfig): string {
  const target = combineURLs(baseURL, url)
  if (!config?.paramsSerializer) return target
  const qs = config.paramsSerializer(config.params)
  if (!qs) return target
  return `${target}${target.includes('?') ? '&' : '?'}${qs}`
}

function isFormDataBody(data: unknown): data is FormData {
  return typeof FormData !== 'undefined' && data instanceof FormData
}

function buildHeaders(authHeader: Record<string, string>, extra: Record<string, string> | undefined, isFormData: boolean) {
  const merged: Record<string, string> = { Accept: 'application/json', ...authHeader, ...extra }
  if (isFormData) {
    // Laisser fetch poser lui-même `Content-Type: multipart/form-data; boundary=...` —
    // un header explicite sans boundary casse le parsing côté serveur.
    for (const key of Object.keys(merged)) {
      if (key.toLowerCase() === 'content-type') delete merged[key]
    }
  }
  return merged
}

interface OfetchLikeError {
  message?: string
  data?: unknown
  response?: Response & { _data?: unknown }
}

function toHttpError(err: unknown, config: HttpRequestConfig & { url: string; method: string }): HttpError {
  const fetchErr = err as OfetchLikeError
  if (fetchErr && typeof fetchErr === 'object' && fetchErr.response) {
    const response: HttpResponse = {
      data: fetchErr.data ?? fetchErr.response._data,
      status: fetchErr.response.status,
      statusText: fetchErr.response.statusText,
      headers: fetchErr.response.headers,
    }
    return new HttpError(fetchErr.message ?? `Request failed with status code ${response.status}`, config, response)
  }
  const message = err instanceof Error ? err.message : 'Network Error'
  return new HttpError(message, config)
}

async function rawRequest<T>(opts: {
  method: string
  baseURL: string
  url: string
  data?: unknown
  config?: HttpRequestConfig
  authHeader: () => Record<string, string>
}): Promise<HttpResponse<T>> {
  const { method, baseURL, url, data, config, authHeader } = opts
  const requestUrl = buildRequestUrl(baseURL, url, config)
  const isFormData = isFormDataBody(data)
  const headers = buildHeaders(authHeader(), config?.headers, isFormData)

  try {
    const res = await $fetch.raw<T>(requestUrl, {
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      body: data as BodyInit | Record<string, unknown> | undefined,
      query: config?.paramsSerializer ? undefined : config?.params,
      headers,
      signal: config?.signal,
    })
    return { data: res._data as T, status: res.status, statusText: res.statusText, headers: res.headers }
  } catch (err) {
    throw toHttpError(err, { url, method, ...config })
  }
}

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

  const data = await $fetch<ApiAuthResponse>(`${_authApiBaseUrl}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    body: { refresh_token: storedToken.refreshToken },
    headers: { Accept: 'application/json' },
  })

  const session = toAuthSession(data.data)
  const persistMode: PersistMode = storedToken.mode

  storeSession(session, persistMode)

  return session
}

const authHeaderFromStorage = (): Record<string, string> => {
  const storedToken = getStoredToken()
  return storedToken ? { Authorization: `${storedToken.type} ${storedToken.token}` } : {}
}

export interface HttpClient {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>
}

/**
 * Client authentifié : injecte le Bearer token, rafraîchit la session une fois sur 401
 * (un seul refresh en vol partagé entre requêtes concurrentes) puis rejoue la requête,
 * sinon nettoie la session et redirige vers /login.
 */
function createAuthenticatedClient(getBaseURL: () => string): HttpClient {
  const requestOnce = <T>(method: string, url: string, data: unknown, config: HttpRequestConfig | undefined) =>
    rawRequest<T>({ method, baseURL: getBaseURL(), url, data, config, authHeader: authHeaderFromStorage })

  async function request<T>(method: string, url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      return await requestOnce<T>(method, url, data, config)
    } catch (error) {
      if (!isHttpError(error) || error.response?.status !== 401) {
        throw error
      }

      const isRefreshRequest = url.endsWith(REFRESH_ENDPOINT)
      const isAuthlessEndpoint = Array.from(AUTHLESS_ENDPOINTS).some((endpoint) => url.endsWith(endpoint))

      if (config?._retry || isRefreshRequest || isAuthlessEndpoint) {
        if (isRefreshRequest) {
          clearStoredToken()
          redirectToLogin()
        }
        throw error
      }

      try {
        refreshSessionPromise ??= refreshAccessToken().finally(() => {
          refreshSessionPromise = null
        })

        const refreshedSession = await refreshSessionPromise

        if (!refreshedSession) {
          clearStoredToken()
          redirectToLogin()
          throw error
        }

        return await requestOnce<T>(method, url, data, { ...config, _retry: true })
      } catch (refreshError) {
        clearStoredToken()
        redirectToLogin()
        throw refreshError
      }
    }
  }

  return {
    get: (url, config) => request('GET', url, undefined, config),
    post: (url, data, config) => request('POST', url, data, config),
    put: (url, data, config) => request('PUT', url, data, config),
    patch: (url, data, config) => request('PATCH', url, data, config),
    delete: (url, config) => request('DELETE', url, undefined, config),
  }
}

/** Client dédié aux routes sous `/api/auth/*` (login, refresh, etc.). */
export const http = createAuthenticatedClient(getAuthApiBaseUrl)

/** Client pour le reste de l'API Laravel (`/api/*` hors auth). */
export const apiHttp = createAuthenticatedClient(getApiBaseUrl)

/**
 * Client pour les endpoints publics (pas de refresh ni de redirect sur 401 — ils restent
 * consultables anonymement). Le token est tout de même transmis quand il existe, pour que
 * l'API puisse renvoyer des champs dépendants du viewer (ex. `can_edit`) aux visiteurs connectés.
 */
export const publicHttp: HttpClient = {
  get: (url, config) => rawRequest({ method: 'GET', baseURL: getApiBaseUrl(), url, config, authHeader: authHeaderFromStorage }),
  post: (url, data, config) => rawRequest({ method: 'POST', baseURL: getApiBaseUrl(), url, data, config, authHeader: authHeaderFromStorage }),
  put: (url, data, config) => rawRequest({ method: 'PUT', baseURL: getApiBaseUrl(), url, data, config, authHeader: authHeaderFromStorage }),
  patch: (url, data, config) => rawRequest({ method: 'PATCH', baseURL: getApiBaseUrl(), url, data, config, authHeader: authHeaderFromStorage }),
  delete: (url, config) => rawRequest({ method: 'DELETE', baseURL: getApiBaseUrl(), url, config, authHeader: authHeaderFromStorage }),
}
