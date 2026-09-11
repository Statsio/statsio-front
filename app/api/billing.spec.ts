import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createFetchMock, type FetchMock } from '#test/mock-fetch'
import { startCheckoutSession, startPortalSession } from './billing'

describe('billing api', () => {
  let mock: FetchMock

  beforeEach(() => {
    mock = createFetchMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('starts a checkout session and returns the hosted URL', async () => {
    mock.onPost('/billing/checkout-session').reply(200, {
      success: true,
      data: { url: 'https://checkout.stripe.com/test-session' },
    })

    const url = await startCheckoutSession()

    expect(url).toBe('https://checkout.stripe.com/test-session')
  })

  it('starts a portal session and returns the hosted URL', async () => {
    mock.onPost('/billing/portal-session').reply(200, {
      success: true,
      data: { url: 'https://billing.stripe.com/test-portal' },
    })

    const url = await startPortalSession()

    expect(url).toBe('https://billing.stripe.com/test-portal')
  })
})
