import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import HomeSearchHero from './HomeSearchHero.vue'
import { fetchGlobalSearch } from '@/api/studio'
import { statsioHomeTranches } from '@/data/brands/statsio/home-tranches'
import type { GlobalSearchResponse } from '@/types/search'

const push = vi.fn<(...args: unknown[]) => void>()

vi.mock('vue-router', async () => {
  const { RouterLinkStub: Stub } = await import('@vue/test-utils')
  return {
    RouterLink: Stub,
    useRoute: () => ({ path: '/' }),
    useRouter: () => ({ push }),
  }
})

vi.mock('@/api/studio', () => ({ fetchGlobalSearch: vi.fn<typeof fetchGlobalSearch>() }))
vi.mock('@vueuse/core', () => ({ useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn }))

const mockFetch = vi.mocked(fetchGlobalSearch)

function results(): GlobalSearchResponse {
  return {
    query: 'carbur',
    total: 3,
    groups: [
      {
        type: 'article',
        label: 'Articles',
        total: 1,
        items: [{ id: '1', slug: 'prix-carburants', title: 'Le prix des carburants', publisher: { name: 'Statsio' } } as never],
      },
      {
        type: 'statsdata',
        label: 'StatsData',
        total: 1,
        items: [{ id: '2', slug: 'carburants', title: 'Carburants en France', publisher: { name: 'Statsio' } } as never],
      },
      { type: 'survey', label: 'Sondages', total: 0, items: [] },
    ],
  }
}

function mountHero() {
  return mount(HomeSearchHero, {
    props: { content: statsioHomeTranches.hero, totalContents: 18, channelsCount: 3, lastPublishedAt: null },
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

async function typeQuery(w: ReturnType<typeof mountHero>, q: string) {
  const input = w.find('input[type="search"]')
  await input.trigger('focus')
  await input.setValue(q)
  await flushPromises()
  return input
}

describe('HomeSearchHero', () => {
  beforeEach(() => {
    push.mockReset()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(results())
  })

  it('shows the real platform counters', () => {
    const w = mountHero()
    expect(w.text()).toContain('18 contenus · 3 chaînes')
    w.unmount()
  })

  it('lists grouped results with highlighted query words', async () => {
    const w = mountHero()
    const input = await typeQuery(w, 'carbur')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(w.findAll('[role="option"]')).toHaveLength(2)
    expect(w.find('mark').text()).toBe('carbur')
    w.unmount()
  })

  it('filters groups by scope', async () => {
    const w = mountHero()
    await typeQuery(w, 'carbur')
    const statsdataChip = w.findAll('.hs__scope button').find((b) => b.text().includes('StatsData'))!
    await statsdataChip.trigger('click')
    const options = w.findAll('[role="option"]')
    expect(options).toHaveLength(1)
    expect(options[0]!.text()).toContain('Carburants en France')
    w.unmount()
  })

  it('navigates to the active result with the keyboard', async () => {
    const w = mountHero()
    const input = await typeQuery(w, 'carbur')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/statsdata/carburants')
    w.unmount()
  })

  it('falls back to the articles listing when nothing is selected', async () => {
    mockFetch.mockResolvedValue({ query: 'zzz', total: 0, groups: [] })
    const w = mountHero()
    const input = await typeQuery(w, 'zzz')
    expect(w.text()).toContain('Rien pour « zzz »')
    await input.trigger('keydown', { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/articles?q=zzz')
    w.unmount()
  })

  it('fills the query from a suggestion', async () => {
    const w = mountHero()
    const ask = w.findAll('.hs__asks button')[0]!
    await ask.trigger('click')
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith(statsioHomeTranches.hero.asks[0]!.query)
    w.unmount()
  })
})
