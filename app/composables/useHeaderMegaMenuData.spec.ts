import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadArticleMenu,
  loadStatsDataMenu,
  loadSurveyMenu,
  loadChannelsMenu,
  loadPromoTicker,
  loadMaladiesMenu,
  loadMedicamentsMenu,
  loadSoinsMenu,
} from './useHeaderMegaMenuData'
import { fetchPublicCatalog } from '@/api/studio'
import { fetchChannelCatalog } from '@/api/channels'
import { fetchMaladiesPopulaires } from '@/api/maladies'
import { fetchMedicamentsSearch } from '@/api/medicaments'
import { fetchSoinsList } from '@/api/soins'
import type { CatalogItem, CatalogResponse } from '@/types/catalog'

vi.mock('@/api/studio', () => ({
  fetchPublicCatalog: vi.fn<typeof fetchPublicCatalog>(),
}))

vi.mock('@/api/channels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/channels')>()
  return {
    ...actual,
    fetchChannelCatalog: vi.fn<typeof fetchChannelCatalog>(),
  }
})

vi.mock('@/api/maladies', () => ({ fetchMaladiesPopulaires: vi.fn<typeof fetchMaladiesPopulaires>() }))
vi.mock('@/api/medicaments', () => ({ fetchMedicamentsSearch: vi.fn<typeof fetchMedicamentsSearch>() }))
vi.mock('@/api/soins', () => ({ fetchSoinsList: vi.fn<typeof fetchSoinsList>() }))

const PALETTE = ['#111111', '#222222']

function catalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'mon-contenu',
    title: 'Mon contenu',
    categories: ['energie'],
    category: 'energie',
    format: null,
    tags: [],
    reading_minutes: 6,
    linked_datasets_count: 2,
    charts_count: 3,
    views_count: 48200,
    updated_at: '2026-08-30T10:00:00Z',
    publisher: { name: 'Statsio Énergie', initials: 'SÉ', is_channel: true, verified: true },
    is_favorited: false,
    ...overrides,
  } as CatalogItem
}

function catalogResponse(items: CatalogItem[], categories = [{ value: 'energie', label: 'Énergie', count: 42 }]): CatalogResponse {
  return {
    data: items,
    meta: { total: items.length, shown: items.length, per_page: 6, has_more: false },
    facets: { categories, formats: [], survey_kinds: [] },
    stats: { published: 0, channels: 0, charts: 0, last_published_at: null },
    featured: null,
  }
}

describe('useHeaderMegaMenuData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadArticleMenu', () => {
    it('builds cards + counted categories from the public catalog', async () => {
      vi.mocked(fetchPublicCatalog).mockResolvedValue(
        catalogResponse([catalogItem({ title: 'Pouvoir d’achat', format: 'enquete' })]),
      )

      const result = await loadArticleMenu(undefined, PALETTE)

      expect(result.menu.variant).toBe('doc')
      expect(result.menu.cards).toHaveLength(1)
      expect(result.menu.cards[0]).toMatchObject({ tag: 'ENQUÊTE', title: 'Pouvoir d’achat', publisher: 'Statsio Énergie' })
      expect(result.categories).toEqual([
        { name: 'Énergie', color: '#111111', count: 42, href: '/articles?category=energie' },
      ])
    })

    it('falls back to an empty "doc" menu on fetch error', async () => {
      vi.mocked(fetchPublicCatalog).mockRejectedValue(new Error('fail'))
      const result = await loadArticleMenu(undefined, PALETTE)
      expect(result.menu).toEqual({ variant: 'doc', cards: [] })
      expect(result.categories).toEqual([])
    })
  })

  describe('loadStatsDataMenu', () => {
    it('builds bar cards with a seeded sparkline + kpi', async () => {
      vi.mocked(fetchPublicCatalog).mockResolvedValue(catalogResponse([catalogItem({ title: 'Carburants' })]))

      const result = await loadStatsDataMenu(undefined, PALETTE)

      expect(result.menu.variant).toBe('bar')
      expect(result.menu.cards[0]).toMatchObject({ title: 'Carburants' })
      expect((result.menu.cards[0] as { kpi: string }).kpi).toMatch(/48,2/)
      expect((result.menu.cards[0] as { sparkline: number[] }).sparkline).toHaveLength(12)
    })

    it('falls back to an empty "bar" menu on fetch error', async () => {
      vi.mocked(fetchPublicCatalog).mockRejectedValue(new Error('fail'))
      const result = await loadStatsDataMenu(undefined, PALETTE)
      expect(result.menu).toEqual({ variant: 'bar', cards: [] })
    })
  })

  describe('loadSurveyMenu', () => {
    it('derives the lead option + percent from the survey primary options', async () => {
      vi.mocked(fetchPublicCatalog).mockResolvedValue(
        catalogResponse([
          catalogItem({
            title: 'Télétravail ?',
            survey_kind: 'single_question',
            is_closed: false,
            primary_options: [
              { label: 'Oui', pct: 54 },
              { label: 'Non', pct: 46 },
            ],
          }),
        ]),
      )

      const result = await loadSurveyMenu(undefined, PALETTE)

      expect(result.menu.variant).toBe('pie')
      expect(result.menu.cards[0]).toMatchObject({ question: 'Télétravail ?', lead: 'Oui', percent: 54, statusOpen: true })
    })

    it('falls back to an empty "pie" menu on fetch error', async () => {
      vi.mocked(fetchPublicCatalog).mockRejectedValue(new Error('fail'))
      const result = await loadSurveyMenu(undefined, PALETTE)
      expect(result.menu).toEqual({ variant: 'pie', cards: [] })
    })
  })

  describe('loadChannelsMenu', () => {
    it('builds channel cards + counted themes from the channel catalog', async () => {
      vi.mocked(fetchChannelCatalog).mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'Statsio Énergie',
            handle: '@statsio-energie',
            verified: true,
            categories: [],
            tags: [],
            followers_count: 184000,
            publications_count: 0,
            statsdata_count: 0,
            view_count: 0,
            last_published_at: null,
            pace: 'semaine',
            is_following: false,
            logo_url: null,
            banner_url: null,
            custom_color_primary: '#8b5cf6',
            custom_color_secondary: null,
            description: null,
            kind: 'redaction',
          },
        ],
        meta: { total: 1, shown: 1, per_page: 3, has_more: false },
        facets: { kinds: [], themes: [{ value: 'actualite', label: 'Actualité', count: 12 }], paces: [] },
        stats: { active: 0, verified: 0, publications_month: 0, last_channel_at: null },
        featured: null,
      })

      const result = await loadChannelsMenu(PALETTE)

      expect(result.menu.variant).toBe('plane')
      expect(result.menu.cards[0]).toMatchObject({ name: 'Statsio Énergie', verified: true })
      expect((result.menu.cards[0] as { followers: string }).followers).toMatch(/184/)
      expect(result.categories).toEqual([
        { name: 'Actualité', color: '#111111', count: 12, href: '/chaines?category=actualite' },
      ])
    })

    it('falls back to an empty "plane" menu when the catalog fails', async () => {
      vi.mocked(fetchChannelCatalog).mockRejectedValue(new Error('fail'))
      const result = await loadChannelsMenu(PALETTE)
      expect(result.menu).toEqual({ variant: 'plane', cards: [] })
    })
  })

  describe('loadPromoTicker', () => {
    it('returns one trending item per content type', async () => {
      vi.mocked(fetchPublicCatalog).mockImplementation(async (query) => {
        if (query.type === 'article') return catalogResponse([catalogItem({ slug: 'a', title: 'Article' })])
        if (query.type === 'statsdata') return catalogResponse([catalogItem({ slug: 'd', title: 'Dataset' })])
        return catalogResponse([catalogItem({ slug: 's', title: 'Sondage', primary_options: [{ label: 'Oui', pct: 61 }] })])
      })

      const items = await loadPromoTicker(undefined)

      expect(items.map((i) => i.kind)).toEqual(['article', 'statsdata', 'survey'])
      expect(items[2]).toMatchObject({ tag: 'SONDAGE', percent: 61, href: '/sondages/s' })
    })

    it('skips a type whose catalog call fails and keeps the others', async () => {
      vi.mocked(fetchPublicCatalog).mockImplementation(async (query) => {
        if (query.type === 'article') throw new Error('fail')
        return catalogResponse([catalogItem({ slug: 'x', title: 'Ok' })])
      })

      const items = await loadPromoTicker(undefined)

      expect(items.map((i) => i.kind)).toEqual(['statsdata', 'survey'])
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
