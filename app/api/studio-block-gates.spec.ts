import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createFetchMock, type FetchMock } from '#test/mock-fetch'
import { fetchPremiumBlockTypes } from './studio-block-gates'

describe('studio block gates api', () => {
  let mock: FetchMock

  beforeEach(() => {
    mock = createFetchMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('returns the list of premium block types', async () => {
    mock.onGet('/studio/block-gates').reply(200, {
      success: true,
      data: { premium_block_types: ['map'] },
    })

    await expect(fetchPremiumBlockTypes()).resolves.toEqual(['map'])
  })

  it('falls back to an empty list when the field is missing', async () => {
    mock.onGet('/studio/block-gates').reply(200, { success: true, data: {} })

    await expect(fetchPremiumBlockTypes()).resolves.toEqual([])
  })
})
