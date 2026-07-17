import { beforeEach, describe, expect, it, vi } from 'vitest'

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn() }))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/auth'
import guestMiddleware from './guest'

describe('middleware/guest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects an authenticated visitor away to /user', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: true } as ReturnType<typeof useAuthStore>)

    guestMiddleware()

    expect(navigateTo).toHaveBeenCalledWith('/user')
  })

  it('lets an anonymous visitor through', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: false } as ReturnType<typeof useAuthStore>)

    const result = guestMiddleware()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
