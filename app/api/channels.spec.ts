import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import {
  createChannel,
  getMyChannels,
  getPublicChannels,
  getChannelStats,
  updateChannelProfile,
  deleteChannel,
  getChannelFeaturedContent,
  toggleChannelSubscription,
} from './channels'
import type { Channel } from './channels'

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 1,
    status: 'active',
    suspended_until: null,
    anonymized_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    profile: {
      id: 1,
      channel_id: 1,
      name: 'My channel',
      handle: 'my-channel',
      description: null,
      is_private: false,
      logo: null,
      banner: null,
      logo_url: null,
      banner_url: null,
      categories: [],
      tags: [],
      country: null,
      is_featured: false,
      subscriber_count: 0,
      view_count: 0,
      custom_color_primary: null,
      custom_color_secondary: null,
      is_following: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    badges: [],
    organization: null,
    ...overrides,
  }
}

describe('app/api/channels', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    apiMock.restore()
  })

  describe('createChannel', () => {
    it('only appends optional fields that are present in the payload', async () => {
      apiMock.onPost('/channels').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        const form = config.data as FormData
        expect(form.get('name')).toBe('x')
        expect(form.get('handle')).toBe('x-handle')
        expect(form.get('description')).toBeNull()
        expect(form.get('custom_color_primary')).toBeNull()
        return [200, { success: true, data: makeChannel(), message: 'ok' }]
      })

      const result = await createChannel({ name: 'x', handle: 'x-handle' })
      expect(result.profile.name).toBe('My channel')
    })

    it('appends categories as indexed form fields', async () => {
      apiMock.onPost('/channels').reply((config) => {
        const form = config.data as FormData
        expect(form.get('categories[0]')).toBe('sport')
        expect(form.get('categories[1]')).toBe('science')
        return [200, { success: true, data: makeChannel(), message: 'ok' }]
      })

      await createChannel({ name: 'x', handle: 'x-handle', categories: ['sport', 'science'] })
    })
  })

  describe('getMyChannels', () => {
    it('filters out channels with a null profile', async () => {
      apiMock.onGet('/channels/my').reply(200, {
        success: true,
        data: { data: [makeChannel({ id: 1 }), { ...makeChannel({ id: 2 }), profile: null }] },
      })

      const result = await getMyChannels()

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(1)
    })
  })

  describe('getPublicChannels', () => {
    it('applies default sort/page/perPage and filters null-profile channels', async () => {
      apiMock.onGet('/channels').reply((config) => {
        expect(config.params).toEqual({
          search: undefined,
          category: undefined,
          sort: 'popular',
          page: 1,
          per_page: 12,
        })
        return [200, {
          success: true,
          data: {
            data: [makeChannel({ id: 1 }), { ...makeChannel({ id: 2 }), profile: null }],
            current_page: 1,
            last_page: 3,
            per_page: 12,
            total: 30,
          },
        }]
      })

      const result = await getPublicChannels()

      expect(result.channels).toHaveLength(1)
      expect(result.lastPage).toBe(3)
      expect(result.total).toBe(30)
    })

    it('passes through explicit search/category/sort/page/perPage params', async () => {
      apiMock.onGet('/channels').reply((config) => {
        expect(config.params).toMatchObject({ search: 'foo', category: 'sport', sort: 'recent', page: 2, per_page: 5 })
        return [200, { success: true, data: { data: [], current_page: 2, last_page: 2, per_page: 5, total: 5 } }]
      })

      await getPublicChannels({ search: 'foo', category: 'sport', sort: 'recent', page: 2, perPage: 5 })
    })
  })

  describe('getChannelStats', () => {
    it('maps snake_case fields to camelCase', async () => {
      apiMock.onGet('/channels/1/stats').reply(200, {
        success: true,
        data: {
          views: { total: 100, growth_percent: 5.5, series: [{ date: '2024-01-01', views: 10 }] },
          subscribers: { total: 20, growth: { new_count: 3, growth_percent: 1.2 } },
          team_member_count: 4,
          lifetime_views: 1000,
        },
      })

      const result = await getChannelStats(1)

      expect(result).toEqual({
        views: { total: 100, growthPercent: 5.5, series: [{ date: '2024-01-01', views: 10 }] },
        subscribers: { total: 20, growth: { newCount: 3, growthPercent: 1.2 } },
        teamMemberCount: 4,
        lifetimeViews: 1000,
      })
    })
  })

  describe('toggleChannelSubscription', () => {
    it('POSTs to the follow endpoint and returns the response data', async () => {
      apiMock.onPost('/channels/1/follow').reply(200, { success: true, data: { isFollowing: true, followersCount: 5 } })
      const result = await toggleChannelSubscription(1)
      expect(result).toEqual({ isFollowing: true, followersCount: 5 })
    })
  })

  describe('updateChannelProfile', () => {
    it('only appends fields explicitly present in the payload (undefined-checked, not truthy-checked)', async () => {
      // POST + spoofing Laravel (_method=PUT), pas un vrai PUT : PHP ne parse pas les corps
      // multipart pour PUT (cf. commentaire dans updateChannelProfile).
      apiMock.onPost('/channels/1').reply((config) => {
        const form = config.data as FormData
        expect(form.get('_method')).toBe('PUT')
        expect(form.get('name')).toBe('New name')
        expect(form.get('description')).toBe('') // empty string is still "present" (!== undefined)
        expect(form.get('handle')).toBeNull()
        return [200, { success: true, data: makeChannel(), message: 'ok' }]
      })

      await updateChannelProfile(1, { name: 'New name', description: '' })
    })
  })

  describe('deleteChannel', () => {
    it('DELETEs the channel resource', async () => {
      apiMock.onDelete('/channels/1').reply(200)
      await expect(deleteChannel(1)).resolves.toBeUndefined()
    })
  })

  describe('getChannelFeaturedContent', () => {
    it('GETs the featured-content endpoint and returns the response data', async () => {
      apiMock.onGet(STATSIO_API.channels.featured('1')).reply(200, {
        success: true,
        data: { article: null, statsdata: null, survey: null },
      })

      const result = await getChannelFeaturedContent(1)

      expect(result).toEqual({ article: null, statsdata: null, survey: null })
    })
  })
})
