import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_REDIRECT_KEY } from './auth-storage'

vi.mock('./auth-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth-storage')>()
  return {
    ...actual,
    getStoredToken: vi.fn<typeof actual.getStoredToken>(),
    clearStoredToken: vi.fn<typeof actual.clearStoredToken>(),
    storeSession: vi.fn<typeof actual.storeSession>(),
  }
})

const AUTH_API_BASE = 'http://test-auth.local/api/auth'
const API_BASE = 'http://test-api.local/api'
const REFRESH_URL = `${AUTH_API_BASE}/refresh`

interface StoredTokenFixture {
  token: string
  refreshToken: string | null
  type: string
  expiresIn: number | null
  mode: 'local' | 'session'
  user: null
}

const stubLocation = (pathname = '/dashboard') => {
  Object.defineProperty(window, 'location', {
    value: { pathname, search: '', hash: '', assign: vi.fn<(url: string | URL) => void>() },
    writable: true,
    configurable: true,
  })
}

describe('app/lib/http', () => {
  let authStorage: typeof import('./auth-storage')
  let httpModule: typeof import('./http')
  let httpMock: AxiosMockAdapter
  let apiHttpMock: AxiosMockAdapter
  let publicHttpMock: AxiosMockAdapter
  let axiosMock: AxiosMockAdapter

  beforeEach(async () => {
    vi.resetModules()
    stubLocation()
    window.sessionStorage.clear()
    window.localStorage.clear()

    authStorage = await import('./auth-storage')
    httpModule = await import('./http')
    httpModule.initHttpClients(AUTH_API_BASE, API_BASE)

    httpMock = new AxiosMockAdapter(httpModule.http)
    apiHttpMock = new AxiosMockAdapter(httpModule.apiHttp)
    publicHttpMock = new AxiosMockAdapter(httpModule.publicHttp)
    axiosMock = new AxiosMockAdapter(axios)
  })

  afterEach(() => {
    httpMock.restore()
    apiHttpMock.restore()
    publicHttpMock.restore()
    axiosMock.restore()
    vi.clearAllMocks()
  })

  const withStoredToken = (overrides: Partial<StoredTokenFixture> = {}) => {
    vi.mocked(authStorage.getStoredToken).mockReturnValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      type: 'Bearer',
      expiresIn: 3600,
      mode: 'local',
      user: null,
      ...overrides,
    })
  }

  const mockSuccessfulRefresh = () => {
    axiosMock.onPost(REFRESH_URL).reply(200, {
      success: true,
      message: 'ok',
      data: { access_token: 'new-token', type: 'Bearer', user: {} },
    })
  }

  describe('request interceptor', () => {
    it('injects the Authorization header when a session is stored', async () => {
      withStoredToken()
      apiHttpMock.onGet('/ping').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer access-token')
        return [200, { ok: true }]
      })

      await httpModule.apiHttp.get('/ping')
    })

    it('does not set an Authorization header when no session is stored', async () => {
      vi.mocked(authStorage.getStoredToken).mockReturnValue(null)
      apiHttpMock.onGet('/ping').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined()
        return [200, { ok: true }]
      })

      await httpModule.apiHttp.get('/ping')
    })
  })

  describe('401 handling on authenticated clients', () => {
    it('refreshes the session once and retries the original request', async () => {
      withStoredToken()
      let attempts = 0
      apiHttpMock.onGet('/secret').reply(() => {
        attempts += 1
        return attempts === 1 ? [401] : [200, { secret: true }]
      })
      mockSuccessfulRefresh()

      const response = await httpModule.apiHttp.get('/secret')

      expect(response.status).toBe(200)
      expect(attempts).toBe(2)
      expect(authStorage.storeSession).toHaveBeenCalledOnce()
    })

    it('dedupes concurrent refreshes triggered by two failing requests into a single call', async () => {
      withStoredToken()
      apiHttpMock.onGet('/a').replyOnce(401).onGet('/a').reply(200, {})
      apiHttpMock.onGet('/b').replyOnce(401).onGet('/b').reply(200, {})
      mockSuccessfulRefresh()

      await Promise.all([httpModule.apiHttp.get('/a'), httpModule.apiHttp.get('/b')])

      const refreshCalls = axiosMock.history.post?.filter((r) => r.url === REFRESH_URL) ?? []
      expect(refreshCalls).toHaveLength(1)
    })

    it('does not retry a second time when the retried request still returns 401', async () => {
      withStoredToken()
      apiHttpMock.onGet('/secret').reply(401)
      mockSuccessfulRefresh()

      await expect(httpModule.apiHttp.get('/secret')).rejects.toBeTruthy()

      const refreshCalls = axiosMock.history.post?.filter((r) => r.url === REFRESH_URL) ?? []
      expect(refreshCalls).toHaveLength(1)
    })

    it('clears the session and redirects to /login when the refresh call itself fails', async () => {
      withStoredToken()
      apiHttpMock.onGet('/secret').reply(401)
      axiosMock.onPost(REFRESH_URL).reply(500)

      await expect(httpModule.apiHttp.get('/secret')).rejects.toBeTruthy()

      expect(authStorage.clearStoredToken).toHaveBeenCalled()
      expect(window.location.assign).toHaveBeenCalledWith('/login')
    })

    it('clears the session and redirects when there is no refresh token available', async () => {
      withStoredToken({ refreshToken: null })
      apiHttpMock.onGet('/secret').reply(401)

      await expect(httpModule.apiHttp.get('/secret')).rejects.toBeTruthy()

      expect(authStorage.clearStoredToken).toHaveBeenCalled()
      expect(window.location.assign).toHaveBeenCalledWith('/login')
      const refreshCalls = axiosMock.history.post?.filter((r) => r.url === REFRESH_URL) ?? []
      expect(refreshCalls).toHaveLength(0)
    })

    it('rejects without clearing the session or redirecting for authless endpoints', async () => {
      withStoredToken()
      httpMock.onPost('/login').reply(401)

      await expect(httpModule.http.post('/login', {})).rejects.toBeTruthy()

      expect(authStorage.clearStoredToken).not.toHaveBeenCalled()
      expect(window.location.assign).not.toHaveBeenCalled()
    })

    it('clears the session and redirects when a request to /refresh itself returns 401', async () => {
      withStoredToken()
      httpMock.onPost('/refresh').reply(401)

      await expect(httpModule.http.post('/refresh', {})).rejects.toBeTruthy()

      expect(authStorage.clearStoredToken).toHaveBeenCalled()
      expect(window.location.assign).toHaveBeenCalledWith('/login')
    })
  })

  describe('redirectToLogin loop prevention', () => {
    it('redirects only once even when several requests fail concurrently', async () => {
      withStoredToken({ refreshToken: null })
      apiHttpMock.onGet('/a').reply(401)
      apiHttpMock.onGet('/b').reply(401)

      await Promise.allSettled([httpModule.apiHttp.get('/a'), httpModule.apiHttp.get('/b')])

      expect(window.location.assign).toHaveBeenCalledTimes(1)
    })

    it('does not redirect when already on the /login page', async () => {
      stubLocation('/login')
      withStoredToken({ refreshToken: null })
      apiHttpMock.onGet('/secret').reply(401)

      await expect(httpModule.apiHttp.get('/secret')).rejects.toBeTruthy()

      expect(window.location.assign).not.toHaveBeenCalled()
    })

    it('persists the current path to session and local storage before redirecting', async () => {
      stubLocation('/studio/42')
      window.location.search = '?tab=blocks'
      withStoredToken({ refreshToken: null })
      apiHttpMock.onGet('/secret').reply(401)

      await expect(httpModule.apiHttp.get('/secret')).rejects.toBeTruthy()

      expect(window.sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/studio/42?tab=blocks')
      expect(window.localStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/studio/42?tab=blocks')
    })
  })

  describe('publicHttp', () => {
    it('attaches the Authorization header when a session exists', async () => {
      withStoredToken()
      publicHttpMock.onGet('/public/stuff').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer access-token')
        return [200, {}]
      })

      await httpModule.publicHttp.get('/public/stuff')
    })

    it('does not attempt a refresh or redirect on 401', async () => {
      withStoredToken()
      publicHttpMock.onGet('/public/stuff').reply(401)

      await expect(httpModule.publicHttp.get('/public/stuff')).rejects.toBeTruthy()

      expect(authStorage.clearStoredToken).not.toHaveBeenCalled()
      expect(window.location.assign).not.toHaveBeenCalled()
    })
  })
})
