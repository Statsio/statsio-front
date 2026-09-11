import { vi } from 'vitest'

/**
 * Remplaçant minimal d'`axios-mock-adapter`, pour les tests qui mockaient les instances
 * axios de `app/lib/http.ts` (`apiHttp`, `publicHttp`, `http`). Le client HTTP du projet
 * appelle désormais `$fetch`/`$fetch.raw` (ofetch) — ce module mocke ce point d'entrée
 * global unique et reproduit l'API `.onGet(url).reply(...)` / `.history` utilisée par les
 * specs existantes, pour garder les mêmes patterns de test.
 *
 * Différences volontaires avec axios-mock-adapter (implications côté specs) :
 * - `config.data` : chaîne JSON si le body envoyé est un objet simple, sinon (FormData)
 *   l'objet tel quel — comme axios le stockait dans `history`.
 * - `config.params` : l'objet `params` d'origine passé par l'appelant (http.ts le
 *   transmet tel quel à `$fetch` via l'option `query`, types préservés) — absent (`{}`)
 *   quand la requête utilise `paramsSerializer` à la place (inspecter alors directement
 *   la query string de `config.url`).
 */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ReplyResult = [status: number, data?: unknown] | [status: number]
type ReplyFn = (config: MockRequestConfig) => ReplyResult | Promise<ReplyResult>

export interface MockRequestConfig {
  url: string
  method: Method
  headers: Record<string, string>
  /** Chaîne JSON si le body envoyé était un objet simple (à parser côté test), sinon FormData. */
  data: string | FormData | undefined
  params: Record<string, unknown>
}

interface Handler {
  once: boolean
  reply: ReplyFn
}

function matches(pattern: string, requestUrl: string): boolean {
  const path = requestUrl.split('?')[0] ?? requestUrl
  if (/^https?:\/\//.test(pattern)) {
    return path === pattern || requestUrl === pattern
  }
  return path.endsWith(pattern)
}

export class FetchMock {
  private routes: Array<{ method: Method; pattern: string; handlers: Handler[] }> = []
  readonly history: Record<Lowercase<Method>, MockRequestConfig[]> = {
    get: [],
    post: [],
    put: [],
    patch: [],
    delete: [],
  }

  private on(method: Method, pattern: string) {
    let route = this.routes.find((r) => r.method === method && r.pattern === pattern)
    if (!route) {
      route = { method, pattern, handlers: [] }
      this.routes.push(route)
    }
    const api = {
      reply: (status: number | ReplyFn, data?: unknown) => {
        route!.handlers.push({ once: false, reply: typeof status === 'function' ? status : () => [status, data] })
        return this
      },
      replyOnce: (status: number | ReplyFn, data?: unknown) => {
        route!.handlers.push({ once: true, reply: typeof status === 'function' ? status : () => [status, data] })
        return this
      },
    }
    return api
  }

  onGet = (pattern: string) => this.on('GET', pattern)
  onPost = (pattern: string) => this.on('POST', pattern)
  onPut = (pattern: string) => this.on('PUT', pattern)
  onPatch = (pattern: string) => this.on('PATCH', pattern)
  onDelete = (pattern: string) => this.on('DELETE', pattern)

  /** @internal appelé par le dispatcher global — undefined si aucune route ne correspond. */
  async dispatch(config: MockRequestConfig): Promise<ReplyResult | undefined> {
    const route = this.routes.find((r) => r.method === config.method && matches(r.pattern, config.url))
    if (!route || route.handlers.length === 0) return undefined

    const historyKey = config.method.toLowerCase() as Lowercase<Method>
    this.history[historyKey].push(config)

    const nextOnceIndex = route.handlers.findIndex((h) => h.once)
    const handler = nextOnceIndex !== -1 ? route.handlers.splice(nextOnceIndex, 1)[0]! : route.handlers[route.handlers.length - 1]!
    return handler.reply(config)
  }

  reset() {
    this.routes = []
    for (const key of Object.keys(this.history) as Lowercase<Method>[]) this.history[key] = []
  }

  restore() {
    unregister(this)
  }
}

const activeMocks: FetchMock[] = []
let installed = false

function register(mock: FetchMock) {
  activeMocks.push(mock)
}

function unregister(mock: FetchMock) {
  const i = activeMocks.indexOf(mock)
  if (i !== -1) activeMocks.splice(i, 1)
}

function toPlainBody(body: unknown): string | FormData | undefined {
  if (body === undefined || body === null) return undefined
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

interface FetchOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /** Objet d'origine (types préservés) : http.ts le passe tel quel, ofetch le sérialise. */
  query?: Record<string, unknown>
}

async function handleRequest(url: string, options: FetchOptions = {}) {
  const config: MockRequestConfig = {
    url,
    method: (options.method?.toUpperCase() as Method) ?? 'GET',
    headers: options.headers ?? {},
    data: toPlainBody(options.body),
    params: options.query ?? {},
  }

  for (const mock of activeMocks) {
    const result = await mock.dispatch(config)
    if (result) {
      const [status, data] = result
      if (status >= 200 && status < 300) return { status, data }
      throw makeFetchError(status, data)
    }
  }

  throw new Error(`[mock-fetch] Aucune route mockée pour ${config.method} ${url}`)
}

function makeFetchError(status: number, data: unknown) {
  const response = {
    status,
    statusText: '',
    headers: new Headers(),
    _data: data,
  } as Response & { _data: unknown }
  return Object.assign(new Error(`Request failed with status code ${status}`), { data, response })
}

/** Installe le dispatcher sur `globalThis.$fetch` (idempotent). À appeler une fois par fichier de test. */
export function installFetchMock() {
  if (installed) return
  installed = true

  const fetchFn = async (url: string, options?: Parameters<typeof handleRequest>[1]) => {
    const { data } = await handleRequest(url, options)
    return data
  }
  fetchFn.raw = async (url: string, options?: Parameters<typeof handleRequest>[1]) => {
    const { status, data } = await handleRequest(url, options)
    return { _data: data, status, statusText: '', headers: new Headers() }
  }

  vi.stubGlobal('$fetch', fetchFn)
}

/** Crée un mock indépendant (routes + historique propres), à la façon de `new AxiosMockAdapter(...)`. */
export function createFetchMock(): FetchMock {
  installFetchMock()
  const mock = new FetchMock()
  register(mock)
  return mock
}
