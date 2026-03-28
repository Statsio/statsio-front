import type { PersistMode } from '@/types/auth'

const AUTH_TOKEN_KEY = 'statsio.auth.token'
const AUTH_TOKEN_TYPE_KEY = 'statsio.auth.tokenType'

const isBrowser = typeof window !== 'undefined'

interface StoredToken {
  token: string
  type: string
  mode: PersistMode
}

const getStorage = (mode: PersistMode) => {
  if (!isBrowser) {
    return null
  }

  return mode === 'local' ? window.localStorage : window.sessionStorage
}

const readTokenFrom = (mode: PersistMode): StoredToken | null => {
  const storage = getStorage(mode)

  if (!storage) {
    return null
  }

  const token = storage.getItem(AUTH_TOKEN_KEY)
  const type = storage.getItem(AUTH_TOKEN_TYPE_KEY)

  if (!token || !type) {
    return null
  }

  return { token, type, mode }
}

export const getStoredToken = (): StoredToken | null => readTokenFrom('local') ?? readTokenFrom('session')

export const storeToken = (token: string, type: string, mode: PersistMode) => {
  clearStoredToken()

  const storage = getStorage(mode)

  storage?.setItem(AUTH_TOKEN_KEY, token)
  storage?.setItem(AUTH_TOKEN_TYPE_KEY, type)
}

export const clearStoredToken = () => {
  getStorage('local')?.removeItem(AUTH_TOKEN_KEY)
  getStorage('local')?.removeItem(AUTH_TOKEN_TYPE_KEY)
  getStorage('session')?.removeItem(AUTH_TOKEN_KEY)
  getStorage('session')?.removeItem(AUTH_TOKEN_TYPE_KEY)
}
