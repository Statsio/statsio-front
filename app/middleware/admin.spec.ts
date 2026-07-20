import { beforeEach, describe, expect, it, vi } from 'vitest'

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn<(...args: unknown[]) => void>() }))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useAuthStore } from '@/stores/auth'
import adminMiddleware from './admin'

describe('middleware/admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when there is no session', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: false, isAdmin: false } as ReturnType<typeof useAuthStore>)

    ;(adminMiddleware as unknown as () => void)()

    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('redirects to / when authenticated but not an admin', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: true, isAdmin: false } as ReturnType<typeof useAuthStore>)

    ;(adminMiddleware as unknown as () => void)()

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('lets an authenticated admin through', () => {
    vi.mocked(useAuthStore).mockReturnValue({ hasSession: true, isAdmin: true } as ReturnType<typeof useAuthStore>)

    const result = (adminMiddleware as unknown as () => void)()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
