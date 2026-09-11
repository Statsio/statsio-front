import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createFetchMock, type FetchMock } from '#test/mock-fetch'
import { fetchBlockGates } from './studio-block-gates'

describe('studio block gates api', () => {
  let mock: FetchMock

  beforeEach(() => {
    mock = createFetchMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('returns the list of premium block types and their required offer', async () => {
    mock.onGet('/studio/block-gates').reply(200, {
      success: true,
      data: {
        premium_block_types: ['map'],
        premium_block_offers: { map: { id: 2, key: 'premium', name: 'Premium' } },
      },
    })

    await expect(fetchBlockGates()).resolves.toEqual({
      types: ['map'],
      offerByType: { map: { id: 2, key: 'premium', name: 'Premium' } },
    })
  })

  it('falls back to empty data when the fields are missing', async () => {
    mock.onGet('/studio/block-gates').reply(200, { success: true, data: {} })

    await expect(fetchBlockGates()).resolves.toEqual({ types: [], offerByType: {} })
  })
})
