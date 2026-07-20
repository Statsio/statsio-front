import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/http', () => ({
  apiHttp: { get: vi.fn<(...args: unknown[]) => Promise<unknown>>() },
}))

import { apiHttp } from '@/lib/http'
import { fetchAllChannels, fetchChannelByHandle, fetchChannelById } from './channels-api'

const apiChannel = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  status: 'active',
  suspended_until: null,
  anonymized_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  profile: {
    id: 1,
    channel_id: 1,
    name: 'Data Journalism Co',
    handle: 'datajourn',
    description: 'Chaîne de data journalism',
    logo: null,
    banner: null,
    tags: null,
    country: 'FR',
    is_featured: false,
    view_count: 120,
    custom_color_primary: null,
    custom_color_secondary: null,
    age_restriction: null,
    subscriber_count: 42,
    categories: ['politique', 'economie'],
    logo_url: null,
    banner_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  },
})

describe('fetchAllChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps the paginated API payload to ChannelEntry objects', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({
      data: { success: true, data: { current_page: 1, last_page: 1, per_page: 100, total: 1, data: [apiChannel()] } },
    })

    const channels = await fetchAllChannels()

    expect(apiHttp.get).toHaveBeenCalledWith('/channels', { params: { per_page: 100 } })
    expect(channels).toEqual([
      expect.objectContaining({
        slug: '1',
        name: 'Data Journalism Co',
        handle: '@datajourn',
        initials: 'DJ',
        themes: ['politique', 'economie'],
        followers: 42,
      }),
    ])
  })

  it('adds the @ prefix only when the stored handle lacks it', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({
      data: { success: true, data: { current_page: 1, last_page: 1, per_page: 100, total: 1, data: [apiChannel({ handle: '@already' })] } },
    })

    const [channel] = await fetchAllChannels()

    expect(channel!.handle).toBe('@already')
  })

  it('falls back to sane defaults when the profile is missing', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          current_page: 1,
          last_page: 1,
          per_page: 100,
          total: 1,
          data: [{ id: 2, status: 'active', suspended_until: null, anonymized_at: null, created_at: 'x', updated_at: 'x', profile: null }],
        },
      },
    })

    const [channel] = await fetchAllChannels()

    expect(channel).toMatchObject({ name: 'Chaîne sans nom', handle: '@', initials: 'CS', themes: [], followers: 0 })
  })
})

describe('fetchChannelByHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds the channel whose normalized handle matches', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({
      data: { success: true, data: { current_page: 1, last_page: 1, per_page: 100, total: 1, data: [apiChannel()] } },
    })

    const channel = await fetchChannelByHandle('datajourn')

    expect(channel?.handle).toBe('@datajourn')
  })

  it('returns undefined when no channel matches', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({
      data: { success: true, data: { current_page: 1, last_page: 1, per_page: 100, total: 1, data: [apiChannel()] } },
    })

    expect(await fetchChannelByHandle('inconnu')).toBeUndefined()
  })
})

describe('fetchChannelById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps a successful envelope to a ChannelEntry', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({ data: { success: true, data: apiChannel() } })

    const channel = await fetchChannelById(1)

    expect(apiHttp.get).toHaveBeenCalledWith('/channels/1')
    expect(channel?.name).toBe('Data Journalism Co')
  })

  it('returns undefined when the envelope reports failure', async () => {
    vi.mocked(apiHttp.get).mockResolvedValue({ data: { success: false, data: apiChannel() } })

    expect(await fetchChannelById(1)).toBeUndefined()
  })
})
