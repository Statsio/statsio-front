import type { RouteLocationNormalized } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn<(...args: unknown[]) => void>() }))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useAuthStore } from '@/stores/auth'
import authMiddleware from './auth'

const toWithPath = (fullPath: string) => ({ fullPath }) as RouteLocationNormalized

describe('middleware/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  it('redirects to /login and remembers the destination when there is no session', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: false } as ReturnType<typeof useAuthStore>)

    authMiddleware(toWithPath('/studio/42'), toWithPath('/studio/42'))

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(window.sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/studio/42')
    expect(window.localStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/studio/42')
  })

  it('does not persist the redirect destination when already headed to /login', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: false } as ReturnType<typeof useAuthStore>)

    authMiddleware(toWithPath('/login'), toWithPath('/login'))

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(window.sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('lets the navigation through when a session exists', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: true } as ReturnType<typeof useAuthStore>)

    const result = authMiddleware(toWithPath('/studio/42'), toWithPath('/studio/42'))

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
