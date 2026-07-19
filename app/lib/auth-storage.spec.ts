import { beforeEach, describe, expect, it } from 'vitest'
import type { AuthSession, AuthUser } from '@/types/auth'
import { clearStoredToken, getStoredToken, storeSession, storeToken, storeUser } from './auth-storage'

const user: AuthUser = {
  id: 1,
  email: 'marie@statsio.test',
  profile: { first_name: 'Marie', last_name: 'Curie', birthday: null },
}

describe('auth-storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  describe('getStoredToken', () => {
    it('returns null when nothing is stored', () => {
      expect(getStoredToken()).toBeNull()
    })

    it('reads back a token stored in local mode', () => {
      storeToken('tok', 'Bearer', 'local', user, 'refresh', 3600)

      expect(getStoredToken()).toEqual({
        token: 'tok',
        refreshToken: 'refresh',
        type: 'Bearer',
        expiresIn: 3600,
        mode: 'local',
        user,
      })
    })

    it('reads back a token stored in session mode', () => {
      storeToken('tok', 'Bearer', 'session', user)

      expect(getStoredToken()).toMatchObject({ token: 'tok', mode: 'session', user })
    })

    it('prefers the local token over a session token when both are present', () => {
      storeToken('local-tok', 'Bearer', 'local')
      window.sessionStorage.setItem('statsio.auth.accessToken', 'session-tok')
      window.sessionStorage.setItem('statsio.auth.tokenType', 'Bearer')

      expect(getStoredToken()?.token).toBe('local-tok')
    })

    it('treats a corrupted stored user as absent and clears it', () => {
      storeToken('tok', 'Bearer', 'local')
      window.localStorage.setItem('statsio.auth.user', '{not-json')

      const stored = getStoredToken()

      expect(stored?.user).toBeNull()
      expect(window.localStorage.getItem('statsio.auth.user')).toBeNull()
    })

    it('ignores a non-numeric expiresIn value', () => {
      storeToken('tok', 'Bearer', 'local')
      window.localStorage.setItem('statsio.auth.expiresIn', 'not-a-number')

      expect(getStoredToken()?.expiresIn).toBeNull()
    })

    it('returns null when the type is missing even if a token is present', () => {
      window.localStorage.setItem('statsio.auth.accessToken', 'tok')

      expect(getStoredToken()).toBeNull()
    })
  })

  describe('storeToken', () => {
    it('clears any previous token before storing the new one', () => {
      storeToken('first', 'Bearer', 'local')
      storeToken('second', 'Bearer', 'session')

      expect(getStoredToken()).toMatchObject({ token: 'second', mode: 'session' })
      expect(window.localStorage.getItem('statsio.auth.accessToken')).toBeNull()
    })

    it('omits the refresh token and expiry when not provided', () => {
      storeToken('tok', 'Bearer', 'local')

      expect(window.localStorage.getItem('statsio.auth.refreshToken')).toBeNull()
      expect(window.localStorage.getItem('statsio.auth.expiresIn')).toBeNull()
    })
  })

  describe('storeSession', () => {
    it('persists every field of the session', () => {
      const session: AuthSession = { token: 'tok', type: 'Bearer', refreshToken: 'ref', expiresIn: 60, user }

      storeSession(session, 'local')

      expect(getStoredToken()).toEqual({ ...session, mode: 'local' })
    })
  })

  describe('storeUser', () => {
    it('overwrites only the user without touching the token', () => {
      storeToken('tok', 'Bearer', 'local', user)

      storeUser({ ...user, email: 'updated@statsio.test' }, 'local')

      expect(getStoredToken()?.user?.email).toBe('updated@statsio.test')
      expect(getStoredToken()?.token).toBe('tok')
    })
  })

  describe('clearStoredToken', () => {
    it('removes both the local and session copies', () => {
      storeToken('local-tok', 'Bearer', 'local')
      window.sessionStorage.setItem('statsio.auth.accessToken', 'session-tok')
      window.sessionStorage.setItem('statsio.auth.tokenType', 'Bearer')

      clearStoredToken()

      expect(getStoredToken()).toBeNull()
    })
  })
})
