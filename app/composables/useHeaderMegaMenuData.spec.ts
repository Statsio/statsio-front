import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadArticleMenu,
  loadStatsDataMenu,
  loadSurveyMenu,
  loadChannelsMenu,
  loadMaladiesMenu,
  loadMedicamentsMenu,
  loadSoinsMenu,
} from './useHeaderMegaMenuData'
import { fetchPublicArticles, fetchPublicStatsDataCatalog, fetchPublicSurveys } from '@/api/studio'
import { getPublicChannels, getChannelCategories } from '@/api/channels'
import { fetchMaladiesPopulaires } from '@/api/maladies'
import { fetchMedicamentsSearch } from '@/api/medicaments'
import { fetchSoinsList } from '@/api/soins'
import type { StatsDataDocument } from '@/api/studio'

vi.mock('@/api/studio', () => ({
  fetchPublicArticles: vi.fn(),
  fetchPublicStatsDataCatalog: vi.fn(),
  fetchPublicSurveys: vi.fn(),
}))

vi.mock('@/api/channels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/channels')>()
  return {
    ...actual,
    getPublicChannels: vi.fn(),
    getChannelCategories: vi.fn(),
  }
})

vi.mock('@/api/maladies', () => ({ fetchMaladiesPopulaires: vi.fn() }))
vi.mock('@/api/medicaments', () => ({ fetchMedicamentsSearch: vi.fn() }))
vi.mock('@/api/soins', () => ({ fetchSoinsList: vi.fn() }))

const PALETTE = ['#111111', '#222222']

const baseDoc: Partial<StatsDataDocument> = { id: '1', title: 'Doc title', categories: ['news'] }

describe('useHeaderMegaMenuData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadArticleMenu', () => {
    it('builds cards + categories from the fetched articles', async () => {
      vi.mocked(fetchPublicArticles).mockResolvedValue([
        { ...baseDoc, id: '1', title: 'A', categories: ['news'], author: { name: 'Jane' } } as StatsDataDocument,
      ])

      const result = await loadArticleMenu(undefined, PALETTE)

      expect(result.menu.variant).toBe('doc')
      expect(result.menu.cards).toHaveLength(1)
      expect(result.categories).toEqual([{ name: 'news', color: '#111111' }])
      expect(result.links).toEqual(['news'])
    })

    it('falls back to an empty "doc" menu on fetch error', async () => {
      vi.mocked(fetchPublicArticles).mockRejectedValue(new Error('fail'))

      const result = await loadArticleMenu(undefined, PALETTE)

      expect(result.menu).toEqual({ variant: 'doc', cards: [] })
      expect(result.categories).toEqual([])
    })
  })

  describe('loadStatsDataMenu', () => {
    it('builds cards with a seeded sparkline from the catalog', async () => {
      vi.mocked(fetchPublicStatsDataCatalog).mockResolvedValue([
        { ...baseDoc, id: '1', title: 'Dataset', categories: ['eco'], datasets: [{ id: 'd1', name: 'd1', row_count: 1200 }] } as StatsDataDocument,
      ])

      const result = await loadStatsDataMenu(undefined, PALETTE)

      expect(result.menu.variant).toBe('bar')
      expect(result.menu.cards).toHaveLength(1)
    })

    it('falls back to an empty "bar" menu on fetch error', async () => {
      vi.mocked(fetchPublicStatsDataCatalog).mockRejectedValue(new Error('fail'))
      const result = await loadStatsDataMenu(undefined, PALETTE)
      expect(result.menu).toEqual({ variant: 'bar', cards: [] })
    })
  })

  describe('loadSurveyMenu', () => {
    it('counts form blocks per survey to build the vote-count label', async () => {
      vi.mocked(fetchPublicSurveys).mockResolvedValue([
        {
          ...baseDoc,
          id: '1',
          title: 'Survey',
          blocks: [
            { id: 'b1', type: 'choice', zoneId: 'z', fieldMapping: {}, config: {} },
            { id: 'b2', type: 'table', zoneId: 'z', fieldMapping: {}, config: {} },
          ],
        } as StatsDataDocument,
      ])

      const result = await loadSurveyMenu(undefined, PALETTE)

      expect(result.menu.cards).toEqual([{ question: 'Survey', voteCount: '1 question' }])
    })

    it('shows "Sondage ouvert" when the survey has no form blocks', async () => {
      vi.mocked(fetchPublicSurveys).mockResolvedValue([{ ...baseDoc, id: '1', title: 'Survey', blocks: [] } as StatsDataDocument])
      const result = await loadSurveyMenu(undefined, PALETTE)
      expect(result.menu.cards).toEqual([{ question: 'Survey', voteCount: 'Sondage ouvert' }])
    })

    it('falls back to an empty "pie" menu on fetch error', async () => {
      vi.mocked(fetchPublicSurveys).mockRejectedValue(new Error('fail'))
      const result = await loadSurveyMenu(undefined, PALETTE)
      expect(result.menu).toEqual({ variant: 'pie', cards: [] })
    })
  })

  describe('loadChannelsMenu', () => {
    it('builds channel cards with resolved colors and category labels', async () => {
      vi.mocked(getPublicChannels).mockResolvedValue({
        channels: [
          {
            id: 1,
            profile: {
              name: 'Le Monde',
              categories: ['actualite'],
              custom_color_primary: '#ff0000',
              custom_color_secondary: null,
              subscriber_count: 4200,
              logo_url: null,
            },
          },
        ],
        total: 1,
        page: 1,
        lastPage: 1,
      } as never)
      vi.mocked(getChannelCategories).mockResolvedValue([{ key: 'actualite', label: 'Actualité' }] as never)

      const result = await loadChannelsMenu(PALETTE)

      expect(result.menu.variant).toBe('plane')
      expect(result.menu.cards).toEqual([
        {
          name: 'Le Monde',
          initials: 'LM',
          meta: '4,2 k abonnés · Actualité',
          logoUrl: null,
          avatarPrimary: '#ff0000',
          avatarSecondary: '#ff0000',
        },
      ])
      expect(result.categories).toEqual([{ name: 'Actualité', color: '#111111' }])
    })

    it('still succeeds when getChannelCategories rejects (caught internally)', async () => {
      vi.mocked(getPublicChannels).mockResolvedValue({ channels: [], total: 0, page: 1, lastPage: 1 } as never)
      vi.mocked(getChannelCategories).mockRejectedValue(new Error('fail'))

      const result = await loadChannelsMenu(PALETTE)

      expect(result.categories).toEqual([])
      expect(result.menu.cards).toEqual([])
    })

    it('falls back to an empty "plane" menu when getPublicChannels itself fails', async () => {
      vi.mocked(getPublicChannels).mockRejectedValue(new Error('fail'))
      const result = await loadChannelsMenu(PALETTE)
      expect(result.menu).toEqual({ variant: 'plane', cards: [] })
    })
  })

  describe('loadMaladiesMenu', () => {
    it('builds cards from popular maladies, using the real trend when present', async () => {
      vi.mocked(fetchMaladiesPopulaires).mockResolvedValue([
        { id: 'm1', code: null, name: 'Grippe', category: 'Respiratoire', value: 12, year: 2024, evolutionPercent: null, trend: [{ value: 5, year: 2023 }] },
      ] as never)

      const result = await loadMaladiesMenu(PALETTE)

      expect(result.menu.cards).toEqual([{ icon: '🦠', title: 'Grippe', meta: '12 (2024)', sparkline: [5] }])
      expect(result.categories).toEqual([{ name: 'Respiratoire', color: '#111111' }])
    })

    it('falls back to an empty "bar" menu on fetch error', async () => {
      vi.mocked(fetchMaladiesPopulaires).mockRejectedValue(new Error('fail'))
      const result = await loadMaladiesMenu(PALETTE)
      expect(result.menu).toEqual({ variant: 'bar', cards: [] })
    })
  })

  describe('loadMedicamentsMenu', () => {
    it('takes the first search result per popular medicament name', async () => {
      vi.mocked(fetchMedicamentsSearch).mockImplementation(async (name: string) =>
        name === 'Doliprane'
          ? [{ cis: 123, elementPharmaceutique: 'Doliprane', formePharmaceutique: 'Comprimé', titulaire: 'X' } as never]
          : [],
      )

      const result = await loadMedicamentsMenu(PALETTE)

      expect(result.menu.cards.some((c) => 'title' in c && c.title === 'Doliprane')).toBe(true)
    })

    it('falls back to an empty "bar" menu when a search rejects for every name', async () => {
      vi.mocked(fetchMedicamentsSearch).mockRejectedValue(new Error('fail'))
      const result = await loadMedicamentsMenu(PALETTE)
      expect(result.menu.cards).toEqual([])
    })
  })

  describe('loadSoinsMenu', () => {
    it('ranks countries by value and formats the meta with the indicator unit', async () => {
      vi.mocked(fetchSoinsList).mockResolvedValue({
        indicator: { key: 'physicians', label: 'Médecins', unit: 'pour 1000', source: 's', indicatorCode: 'c' },
        options: [{ key: 'physicians', label: 'Médecins' }],
        countries: [
          { iso3: 'FRA', iso2: 'FR', name: 'France', region: 'Europe', lat: 0, lon: 0, population: 1, value: 3.2, year: 2022, stats: {} as never },
          { iso3: 'DEU', iso2: 'DE', name: 'Allemagne', region: 'Europe', lat: 0, lon: 0, population: 1, value: 4.5, year: 2022, stats: {} as never },
        ],
      } as never)

      const result = await loadSoinsMenu(PALETTE)

      expect(result.menu.cards[0]).toMatchObject({ title: 'Allemagne', meta: '4.5 pour 1000 (2022)' })
      expect(result.categories).toEqual([{ name: 'Médecins', color: '#111111' }])
    })

    it('falls back to an empty "bar" menu on fetch error', async () => {
      vi.mocked(fetchSoinsList).mockRejectedValue(new Error('fail'))
      const result = await loadSoinsMenu(PALETTE)
      expect(result.menu).toEqual({ variant: 'bar', cards: [] })
    })
  })
})
