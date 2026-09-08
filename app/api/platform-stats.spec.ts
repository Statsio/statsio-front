import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { publicHttp } from '@/lib/http'
import { fetchPlatformStats, EMPTY_PLATFORM_STATS } from './platform-stats'

describe('platform-stats api', () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(publicHttp)
  })

  afterEach(() => {
    mock.restore()
  })

  it('maps the snake_case payload to camelCase', async () => {
    mock.onGet('/public-stats').reply(200, {
      success: true,
      data: {
        statsdata: 12,
        articles: 8,
        surveys: 3,
        published_total: 23,
        datasets: 40,
        channels: 5,
        contributors: 9,
        last_published_at: '2026-09-01T10:00:00+00:00',
      },
    })

    const stats = await fetchPlatformStats()

    expect(stats).toEqual({
      statsdata: 12,
      articles: 8,
      surveys: 3,
      publishedTotal: 23,
      datasets: 40,
      channels: 5,
      contributors: 9,
      lastPublishedAt: '2026-09-01T10:00:00+00:00',
    })
  })

  it('falls back to zeros when fields are missing', async () => {
    mock.onGet('/public-stats').reply(200, { success: true, data: {} })

    await expect(fetchPlatformStats()).resolves.toEqual(EMPTY_PLATFORM_STATS)
  })
})
