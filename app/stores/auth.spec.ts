import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/types/auth'

vi.mock('@/lib/auth-storage', () => ({
  clearStoredToken: vi.fn<(...args: unknown[]) => void>(),
  getStoredToken: vi.fn<(...args: unknown[]) => unknown>(),
  storeSession: vi.fn<(...args: unknown[]) => void>(),
  storeUser: vi.fn<(...args: unknown[]) => void>(),
}))

vi.mock('@/lib/http-errors', () => ({
  isUnauthorizedError: vi.fn<(error: unknown) => boolean>(),
}))

vi.mock('@/services/auth', () => ({
  loginRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  logoutRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  meRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  registerRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  resendVerificationRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  verifyEmailRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  googleAuthRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

import { clearStoredToken, getStoredToken, storeSession, storeUser } from '@/lib/auth-storage'
import { isUnauthorizedError } from '@/lib/http-errors'
import { loginRequest, logoutRequest, meRequest } from '@/services/auth'
import { useAuthStore } from './auth'

const user: AuthUser = {
  id: 1,
  email: 'marie@statsio.test',
  profile: { first_name: 'Marie', last_name: 'Curie', birthday: null },
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('applies the session, persists it, and toggles isAuthenticating', async () => {
      vi.mocked(loginRequest).mockResolvedValue({ token: 'tok', type: 'Bearer', user })
      const store = useAuthStore()

      const loginPromise = store.login({ email: user.email, password: 'secret' })
      expect(store.isAuthenticating).toBe(true)
      const result = await loginPromise

      expect(result).toEqual(user)
      expect(store.token).toBe('tok')
      expect(store.user).toEqual(user)
      expect(store.persistMode).toBe('local')
      expect(store.isAuthenticating).toBe(false)
      expect(storeSession).toHaveBeenCalledWith({ token: 'tok', type: 'Bearer', user }, 'local')
    })

    it('resets isAuthenticating even when the login request throws', async () => {
      vi.mocked(loginRequest).mockRejectedValue(new Error('invalid credentials'))
      const store = useAuthStore()

      await expect(store.login({ email: user.email, password: 'wrong' })).rejects.toThrow('invalid credentials')

      expect(store.isAuthenticating).toBe(false)
      expect(store.hasSession).toBe(false)
    })
  })

  describe('initialize', () => {
    it('does nothing when there is no token', async () => {
      const store = useAuthStore()

      await store.initialize()

      expect(meRequest).not.toHaveBeenCalled()
    })

    it('does nothing when already bootstrapping', async () => {
      const store = useAuthStore()
      store.token = 'tok'
      store.isBootstrapping = true

      await store.initialize()

      expect(meRequest).not.toHaveBeenCalled()
    })

    it('refreshes the user from /me and persists it when the token is valid', async () => {
      vi.mocked(meRequest).mockResolvedValue(user)
      const store = useAuthStore()
      store.token = 'tok'

      await store.initialize()

      expect(store.user).toEqual(user)
      expect(storeUser).toHaveBeenCalledWith(user, store.persistMode)
      expect(store.isBootstrapping).toBe(false)
    })

    it('clears the session when /me rejects with a 401', async () => {
      vi.mocked(meRequest).mockRejectedValue(new Error('unauthorized'))
      vi.mocked(isUnauthorizedError).mockReturnValue(true)
      const store = useAuthStore()
      store.token = 'tok'
      store.user = user

      await store.initialize()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(clearStoredToken).toHaveBeenCalled()
    })

    it('keeps the session when /me rejects with a non-401 error', async () => {
      vi.mocked(meRequest).mockRejectedValue(new Error('network error'))
      vi.mocked(isUnauthorizedError).mockReturnValue(false)
      const store = useAuthStore()
      store.token = 'tok'
      store.user = user

      await store.initialize()

      expect(store.token).toBe('tok')
      expect(clearStoredToken).not.toHaveBeenCalled()
    })

    it('ignores a malformed /me payload instead of storing it', async () => {
      vi.mocked(meRequest).mockResolvedValue({ id: 'not-a-number' } as unknown as AuthUser)
      const store = useAuthStore()
      store.token = 'tok'

      await store.initialize()

      expect(store.user).toBeNull()
      expect(storeUser).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('clears the session locally without calling the API when there is no token', async () => {
      const store = useAuthStore()

      await store.logout()

      expect(logoutRequest).not.toHaveBeenCalled()
      expect(clearStoredToken).toHaveBeenCalled()
    })

    it('calls the API and clears the session when a token is present', async () => {
      vi.mocked(logoutRequest).mockResolvedValue(undefined)
      const store = useAuthStore()
      store.token = 'tok'
      store.user = user

      await store.logout()

      expect(logoutRequest).toHaveBeenCalled()
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isLoggingOut).toBe(false)
    })

    it('still clears the session when the logout request fails with a 401', async () => {
      vi.mocked(logoutRequest).mockRejectedValue(new Error('unauthorized'))
      vi.mocked(isUnauthorizedError).mockReturnValue(true)
      const store = useAuthStore()
      store.token = 'tok'
      store.user = user

      await store.logout()

      expect(store.token).toBeNull()
      expect(clearStoredToken).toHaveBeenCalled()
    })

    it('propagates non-401 errors from the logout request but still clears the session', async () => {
      vi.mocked(logoutRequest).mockRejectedValue(new Error('server error'))
      vi.mocked(isUnauthorizedError).mockReturnValue(false)
      const store = useAuthStore()
      store.token = 'tok'
      store.user = user

      await expect(store.logout()).rejects.toThrow('server error')

      expect(store.token).toBeNull()
      expect(clearStoredToken).toHaveBeenCalled()
    })
  })

  describe('hydrateFromStorage', () => {
    it('does nothing when there is no stored token', () => {
      vi.mocked(getStoredToken).mockReturnValue(null)
      const store = useAuthStore()

      store.hydrateFromStorage()

      expect(store.hasSession).toBe(false)
    })

    it('rehydrates the store state from the stored token', () => {
      vi.mocked(getStoredToken).mockReturnValue({
        token: 'stored-tok',
        refreshToken: 'stored-refresh',
        type: 'Bearer',
        expiresIn: 3600,
        mode: 'session',
        user,
      })
      const store = useAuthStore()

      store.hydrateFromStorage()

      expect(store.token).toBe('stored-tok')
      expect(store.refreshToken).toBe('stored-refresh')
      expect(store.persistMode).toBe('session')
      expect(store.user).toEqual(user)
    })
  })

  describe('computed state', () => {
    it('exposes hasSession and isAuthenticated based on token and user', () => {
      const store = useAuthStore()
      expect(store.hasSession).toBe(false)
      expect(store.isAuthenticated).toBe(false)

      store.token = 'tok'
      expect(store.hasSession).toBe(true)
      expect(store.isAuthenticated).toBe(false)

      store.user = user
      expect(store.isAuthenticated).toBe(true)
    })

    it('exposes isAdmin from the user payload', () => {
      const store = useAuthStore()
      store.user = { ...user, is_admin: true }
      expect(store.isAdmin).toBe(true)

      store.user = { ...user, is_admin: false }
      expect(store.isAdmin).toBe(false)
    })

    it('builds displayName from first/last name, falling back to email then a default', () => {
      const store = useAuthStore()

      store.user = user
      expect(store.displayName).toBe('Marie Curie')

      store.user = { ...user, profile: { first_name: null, last_name: null, birthday: null } }
      expect(store.displayName).toBe(user.email)

      store.user = null
      expect(store.displayName).toBe('Mon compte')
    })
  })
})
