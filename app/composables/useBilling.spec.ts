import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/billing', () => ({
  startCheckoutSession: vi.fn<() => Promise<string>>(),
  startPortalSession: vi.fn<() => Promise<string>>(),
}))

import { useBilling } from './useBilling'
import { useAppNotifications } from './useAppNotifications'
import { startCheckoutSession, startPortalSession } from '@/api/billing'

const stubLocation = () => {
  Object.defineProperty(window, 'location', {
    value: { assign: vi.fn<(url: string | URL) => void>() },
    writable: true,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  stubLocation()
  vi.mocked(startCheckoutSession).mockReset()
  vi.mocked(startPortalSession).mockReset()
})

describe('useBilling', () => {
  it('redirects to the checkout URL on success', async () => {
    vi.mocked(startCheckoutSession).mockResolvedValue('https://checkout.stripe.com/test')
    const billing = useBilling()

    await billing.goToCheckout()

    expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.com/test')
    expect(billing.isRedirecting.value).toBe(true)
  })

  it('shows a notification and stops redirecting when checkout fails', async () => {
    vi.mocked(startCheckoutSession).mockRejectedValue(new Error('boom'))
    const billing = useBilling()
    const notifications = useAppNotifications()

    await billing.goToCheckout()

    expect(window.location.assign).not.toHaveBeenCalled()
    expect(billing.isRedirecting.value).toBe(false)
    expect(notifications.items).toHaveLength(1)
    expect(notifications.items[0]?.variant).toBe('error')
  })

  it('redirects to the portal URL on success', async () => {
    vi.mocked(startPortalSession).mockResolvedValue('https://billing.stripe.com/test')
    const billing = useBilling()

    await billing.goToPortal()

    expect(window.location.assign).toHaveBeenCalledWith('https://billing.stripe.com/test')
  })
})
