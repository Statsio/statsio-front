import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AppSearchModal from './AppSearchModal.vue'
import { fetchGlobalSearch } from '@/api/studio'
import type { GlobalSearchResponse } from '@/types/search'

const push = vi.fn<(...args: unknown[]) => void>()

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/' }),
  useRouter: () => ({ push }),
}))

vi.mock('@/api/studio', () => ({
  fetchGlobalSearch: vi.fn<typeof fetchGlobalSearch>(),
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn,
}))

const mockFetch = vi.mocked(fetchGlobalSearch)

function results(): GlobalSearchResponse {
  return {
    query: 'carbur',
    total: 14,
    groups: [
      {
        type: 'article',
        label: 'Articles',
        total: 12,
        items: [
          {
            id: '1',
            slug: 'prix-carburants',
            title: 'Le prix des carburants',
            category: 'energie',
            publisher: { name: 'Statsio Énergie', initials: 'SÉ', is_channel: true, verified: true },
          } as never,
        ],
      },
      { type: 'statsdata', label: 'StatsData', total: 0, items: [] },
      { type: 'survey', label: 'Sondages', total: 0, items: [] },
      {
        type: 'channel',
        label: 'Chaînes',
        total: 1,
        items: [
          {
            id: '9',
            name: 'Observatoire carburants',
            handle: 'obs-carburants',
            description: null,
            verified: true,
            followers_count: 1200,
            categories: [],
            logo_url: null,
            is_following: false,
          },
        ],
      },
    ],
  }
}

function mountOpen() {
  return mount(AppSearchModal, {
    props: { open: true },
    global: { stubs: { teleport: true } },
  })
}

beforeEach(() => {
  mockFetch.mockReset()
  push.mockClear()
  window.localStorage.clear()
  document.body.style.overflow = ''
})

describe('AppSearchModal', () => {
  it('renders the search field when open', () => {
    const wrapper = mountOpen()
    expect(wrapper.find('input[type="search"]').exists()).toBe(true)
  })

  it('shows grouped results and navigates on click', async () => {
    mockFetch.mockResolvedValue(results())
    const wrapper = mountOpen()

    await wrapper.find('input[type="search"]').setValue('carbur')
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith('carbur')
    expect(wrapper.text()).toContain('Le prix des carburants')
    expect(wrapper.text()).toContain('Observatoire carburants')
    expect(wrapper.text()).toContain('Voir les 12 résultats dans Articles')

    await wrapper.get('button[data-nav="0"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/articles/prix-carburants')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('the "see all" row points to the listing with the query', async () => {
    mockFetch.mockResolvedValue(results())
    const wrapper = mountOpen()

    await wrapper.find('input[type="search"]').setValue('carbur')
    await flushPromises()

    // article rows: nav 0 (item) then nav 1 ("voir tout")
    await wrapper.get('button[data-nav="1"]').trigger('click')
    expect(push).toHaveBeenCalledWith('/articles?q=carbur')
  })

  it('shows the min-length hint below 2 characters', async () => {
    const wrapper = mountOpen()
    await wrapper.find('input[type="search"]').setValue('c')
    expect(wrapper.text()).toContain('au moins 2 caractères')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
