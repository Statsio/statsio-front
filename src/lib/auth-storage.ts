import type { AuthSession, AuthUser, PersistMode } from '@/types/auth'

const AUTH_ACCESS_TOKEN_KEY = 'statsio.auth.accessToken'
const AUTH_REFRESH_TOKEN_KEY = 'statsio.auth.refreshToken'
const AUTH_TOKEN_TYPE_KEY = 'statsio.auth.tokenType'
const AUTH_USER_KEY = 'statsio.auth.user'
const AUTH_EXPIRES_IN_KEY = 'statsio.auth.expiresIn'

const isBrowser = typeof window !== 'undefined'

interface StoredToken {
  token: string
  refreshToken: string | null
  type: string
  expiresIn: number | null
  mode: PersistMode
}

interface StoredAuthState extends StoredToken {
  user: AuthUser | null
}

const getStorage = (mode: PersistMode) => {
  if (!isBrowser) {
    return null
  }

  return mode === 'local' ? window.localStorage : window.sessionStorage
}

const readUserFrom = (storage: Storage): AuthUser | null => {
  const rawUser = storage.getItem(AUTH_USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    storage.removeItem(AUTH_USER_KEY)
    return null
  }
}

const readExpiresInFrom = (storage: Storage): number | null => {
  const rawExpiresIn = storage.getItem(AUTH_EXPIRES_IN_KEY)

  if (!rawExpiresIn) {
    return null
  }

  const expiresIn = Number.parseInt(rawExpiresIn, 10)

  return Number.isFinite(expiresIn) ? expiresIn : null
}

const readTokenFrom = (mode: PersistMode): StoredAuthState | null => {
  const storage = getStorage(mode)

  if (!storage) {
    return null
  }

  const token = storage.getItem(AUTH_ACCESS_TOKEN_KEY)
  const refreshToken = storage.getItem(AUTH_REFRESH_TOKEN_KEY)
  const type = storage.getItem(AUTH_TOKEN_TYPE_KEY)

  if (!token || !type) {
    return null
  }

  return {
    token,
    refreshToken,
    type,
    expiresIn: readExpiresInFrom(storage),
    mode,
    user: readUserFrom(storage),
  }
}

export const getStoredToken = (): StoredAuthState | null => readTokenFrom('local') ?? readTokenFrom('session')

export const storeToken = (
  token: string,
  type: string,
  mode: PersistMode,
  user?: AuthUser | null,
  refreshToken?: string | null,
  expiresIn?: number | null,
) => {
  clearStoredToken()

  const storage = getStorage(mode)

  storage?.setItem(AUTH_ACCESS_TOKEN_KEY, token)
  storage?.setItem(AUTH_TOKEN_TYPE_KEY, type)

  if (refreshToken) {
    storage?.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken)
  }

  if (typeof expiresIn === 'number') {
    storage?.setItem(AUTH_EXPIRES_IN_KEY, String(expiresIn))
  }

  if (user) {
    storage?.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

export const storeSession = (session: AuthSession, mode: PersistMode) => {
  storeToken(session.token, session.type, mode, session.user, session.refreshToken, session.expiresIn)
}

export const storeUser = (user: AuthUser, mode: PersistMode) => {
  const storage = getStorage(mode)

  storage?.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const clearStoredToken = () => {
  getStorage('local')?.removeItem(AUTH_ACCESS_TOKEN_KEY)
  getStorage('local')?.removeItem(AUTH_REFRESH_TOKEN_KEY)
  getStorage('local')?.removeItem(AUTH_TOKEN_TYPE_KEY)
  getStorage('local')?.removeItem(AUTH_USER_KEY)
  getStorage('local')?.removeItem(AUTH_EXPIRES_IN_KEY)
  getStorage('session')?.removeItem(AUTH_ACCESS_TOKEN_KEY)
  getStorage('session')?.removeItem(AUTH_REFRESH_TOKEN_KEY)
  getStorage('session')?.removeItem(AUTH_TOKEN_TYPE_KEY)
  getStorage('session')?.removeItem(AUTH_USER_KEY)
  getStorage('session')?.removeItem(AUTH_EXPIRES_IN_KEY)
}
