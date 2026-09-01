import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useGlobalSearch } from './useGlobalSearch'
import { fetchGlobalSearch } from '@/api/studio'
import type { GlobalSearchResponse } from '@/types/search'

vi.mock('@/api/studio', () => ({
  fetchGlobalSearch: vi.fn<typeof fetchGlobalSearch>(),
}))

// Debounce synchrone pour les tests.
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn,
}))

const mockFetch = vi.mocked(fetchGlobalSearch)

function response(overrides: Partial<GlobalSearchResponse> = {}): GlobalSearchResponse {
  return {
    query: 'carbur',
    total: 3,
    groups: [
      {
        type: 'article',
        label: 'Articles',
        total: 2,
        items: [
          { id: '1', slug: 'a', title: 'A', category: null, publisher: { name: 'Éco', initials: 'E', is_channel: false, verified: false } } as never,
        ],
      },
      { type: 'statsdata', label: 'StatsData', total: 0, items: [] },
      { type: 'survey', label: 'Sondages', total: 0, items: [] },
      {
        type: 'channel',
        label: 'Chaînes',
        total: 1,
        items: [
          { id: '9', name: 'Obs', handle: 'obs', description: null, verified: true, followers_count: 1200, categories: [], logo_url: null, is_following: false },
        ],
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  mockFetch.mockReset()
  window.localStorage.clear()
})

describe('useGlobalSearch', () => {
  it('does not query below 2 characters', async () => {
    const s = useGlobalSearch()
    s.query.value = 'a'
    await nextTick()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(s.canSearch.value).toBe(false)
  })

  it('fetches and keeps only non-empty groups', async () => {
    mockFetch.mockResolvedValue(response())
    const s = useGlobalSearch()
    s.query.value = 'carbur'
    await nextTick()
    await Promise.resolve()

    expect(mockFetch).toHaveBeenCalledWith('carbur')
    expect(s.hasResults.value).toBe(true)
    expect(s.nonEmptyGroups.value.map((g) => g.type)).toEqual(['article', 'channel'])
    expect(s.loading.value).toBe(false)
  })

  it('flags an error when the request fails', async () => {
    mockFetch.mockRejectedValue(new Error('boom'))
    const s = useGlobalSearch()
    s.query.value = 'carbur'
    await nextTick()
    await Promise.resolve()

    expect(s.error.value).toBe(true)
    expect(s.hasResults.value).toBe(false)
  })

  it('remembers queries in localStorage (most recent first, deduped)', () => {
    const s = useGlobalSearch()
    s.rememberQuery('carburant')
    s.rememberQuery('loyers')
    s.rememberQuery('CARBURANT')

    expect(s.recent.value).toEqual(['CARBURANT', 'loyers'])
    expect(JSON.parse(window.localStorage.getItem('statsio:search:recent') ?? '[]')).toEqual(['CARBURANT', 'loyers'])
  })

  it('clearRecent wipes history and storage', () => {
    const s = useGlobalSearch()
    s.rememberQuery('carburant')
    s.clearRecent()
    expect(s.recent.value).toEqual([])
    expect(window.localStorage.getItem('statsio:search:recent')).toBeNull()
  })

  it('reset clears the query and results', async () => {
    mockFetch.mockResolvedValue(response())
    const s = useGlobalSearch()
    s.query.value = 'carbur'
    await nextTick()
    await Promise.resolve()

    s.reset()
    expect(s.query.value).toBe('')
    expect(s.hasResults.value).toBe(false)
  })
})
