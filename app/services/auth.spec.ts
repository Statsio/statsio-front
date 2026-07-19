import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/types/auth'

vi.mock('@/lib/http', () => ({
  http: { post: vi.fn(), get: vi.fn() },
}))

import { http } from '@/lib/http'
import {
  forgotPasswordRequest,
  googleAuthRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshTokenRequest,
  registerRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from './auth'

const user: AuthUser = {
  id: 1,
  email: 'marie@statsio.test',
  profile: { first_name: 'Marie', last_name: 'Curie', birthday: null },
}

describe('services/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginRequest', () => {
    it('posts credentials and normalizes the session', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { access_token: 'tok', type: 'Bearer', expires_in: 3600, user } },
      })

      const session = await loginRequest({ email: user.email, password: 'secret' })

      expect(http.post).toHaveBeenCalledWith('/login', { email: user.email, password: 'secret' })
      expect(session).toEqual({ token: 'tok', type: 'Bearer', refreshToken: undefined, expiresIn: 3600, user })
    })

    it('falls back to the legacy "token" field when access_token is absent', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { token: 'legacy-tok', type: 'Bearer', user } },
      })

      const session = await loginRequest({ email: user.email, password: 'secret' })

      expect(session.token).toBe('legacy-tok')
    })
  })

  describe('registerRequest', () => {
    it('posts the registration payload and returns the pending data', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { email: user.email } },
      })

      const result = await registerRequest({
        first_name: 'Marie',
        last_name: 'Curie',
        birthday: '1867-11-07',
        email: user.email,
        password: 'secret',
      })

      expect(http.post).toHaveBeenCalledWith('/register', expect.objectContaining({ email: user.email }))
      expect(result).toEqual({ email: user.email })
    })
  })

  describe('verifyEmailRequest', () => {
    it('posts the code and normalizes the returned session', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { access_token: 'tok', type: 'Bearer', user } },
      })

      const session = await verifyEmailRequest({ email: user.email, code: '123456' })

      expect(http.post).toHaveBeenCalledWith('/verify-email', { email: user.email, code: '123456' })
      expect(session.token).toBe('tok')
    })
  })

  describe('fire-and-forget requests', () => {
    it('resendVerificationRequest posts to /verify-email/resend', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} })
      await resendVerificationRequest({ email: user.email })
      expect(http.post).toHaveBeenCalledWith('/verify-email/resend', { email: user.email })
    })

    it('forgotPasswordRequest posts to /forgot-password', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} })
      await forgotPasswordRequest({ email: user.email })
      expect(http.post).toHaveBeenCalledWith('/forgot-password', { email: user.email })
    })

    it('resetPasswordRequest posts to /reset-password', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} })
      const payload = { token: 't', email: user.email, password: 'new', password_confirmation: 'new' }
      await resetPasswordRequest(payload)
      expect(http.post).toHaveBeenCalledWith('/reset-password', payload)
    })

    it('logoutRequest posts to /logout with no body', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} })
      await logoutRequest()
      expect(http.post).toHaveBeenCalledWith('/logout')
    })
  })

  describe('googleAuthRequest', () => {
    it('posts the id token and normalizes the session', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { access_token: 'tok', type: 'Bearer', user } },
      })

      const session = await googleAuthRequest({ id_token: 'g-token' })

      expect(http.post).toHaveBeenCalledWith('/google', { id_token: 'g-token' })
      expect(session.user).toEqual(user)
    })
  })

  describe('refreshTokenRequest', () => {
    it('posts the refresh token and normalizes the session', async () => {
      vi.mocked(http.post).mockResolvedValue({
        data: { success: true, message: 'ok', data: { access_token: 'new-tok', type: 'Bearer', user } },
      })

      const session = await refreshTokenRequest('old-refresh-token')

      expect(http.post).toHaveBeenCalledWith('/refresh', { refresh_token: 'old-refresh-token' })
      expect(session.token).toBe('new-tok')
    })
  })

  describe('meRequest', () => {
    it('unwraps a raw user payload', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: user })

      expect(await meRequest()).toEqual(user)
    })

    it('unwraps an enveloppe with a nested user field', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: { success: true, message: 'ok', data: { user } } })

      expect(await meRequest()).toEqual(user)
    })
  })
})
