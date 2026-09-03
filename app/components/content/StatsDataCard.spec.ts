import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import StatsDataCard from './StatsDataCard.vue'
import StatsDataCardChart from './StatsDataCardChart.vue'
import ContentFeaturedBadge from './ContentFeaturedBadge.vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentManageMeta } from '@/types/content-card'

vi.mock('@/composables/useContentBasePath', () => ({
  useContentBasePath: () => ({ value: '' }),
}))

// La carte réelle charge son aperçu en lazy via l'API — on ne teste ici que le dispatch.
vi.mock('@/api/studio', () => ({
  fetchStatsDataCardPreview: vi
    .fn<() => Promise<{ empty: boolean }>>()
    .mockResolvedValue({ empty: true }),
}))

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'abc',
    slug: 'mon-statsdata',
    title: 'Mon statsdata',
    description: null,
    type: 'statsdata',
    categories: ['economie'],
    category: 'economie',
    format: null,
    reading_minutes: 0,
    linked_datasets_count: 3,
    charts_count: 4,
    views_count: 500,
    updated_at: '2026-08-01T00:00:00Z',
    publisher: { name: 'DataDesk', initials: 'DD', is_channel: true, verified: true },
    is_favorited: false,
    ...overrides,
  }
}

const manage: ContentManageMeta = {
  statusLabel: 'Brouillon',
  statusBg: '#eee',
  statusColor: '#555',
  live: false,
  ownerKind: 'perso',
  ownerLabel: 'Moi · Perso',
  date: '1 août',
  viewsCount: 0,
  studioPath: '/studio/statsdata/mon-statsdata',
  propertiesPath: '/contenu/mon-statsdata/proprietes',
  publicPath: null,
}

const global = {
  stubs: {
    NuxtLink: RouterLinkStub,
    CatalogSubBrandTag: true,
    ContentCardDossierTag: true,
    AppSparkline: true,
    StatsDataCardChart: true,
  },
}

describe('StatsDataCard', () => {
  it('card + public: mounts the real card chart by default', () => {
    const w = mount(StatsDataCard, { props: { item: item(), mode: 'public' }, global })
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(true)
    expect(w.text()).toContain('☆')
  })

  it('card: a cover image replaces the mini chart and carries the category badge', () => {
    const w = mount(StatsDataCard, {
      props: { item: item({ thumbnail_url: 'https://cdn.test/cover.jpg' }), mode: 'public' },
      global,
    })
    expect(w.find('img[src="https://cdn.test/cover.jpg"]').exists()).toBe(true)
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(false)
    expect(w.text()).toContain('ECONOMIE')
  })

  it('feature: a cover image backs the chart, kept in a frosted panel on top', () => {
    const w = mount(StatsDataCard, {
      props: { item: item({ thumbnail_url: 'https://cdn.test/cover.jpg' }), format: 'row', feature: true },
      global,
    })
    expect(w.find('img[src="https://cdn.test/cover.jpg"]').exists()).toBe(true)
    // Le graphe reste visible, posé sur l'image dans un conteneur blanc translucide.
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(true)
    expect(w.html()).toContain('backdrop-blur-md')
  })

  it('card chart shows nothing while the preview is still loading (no fake chart)', () => {
    const w = mount(StatsDataCard, {
      props: { item: item(), mode: 'public' },
      global: {
        stubs: { NuxtLink: RouterLinkStub, CatalogSubBrandTag: true, ContentCardDossierTag: true, AppSparkline: true },
      },
    })
    const chart = w.findComponent(StatsDataCardChart)
    expect(chart.exists()).toBe(true)
    // Le wrapper est monté mais ne rend aucun contenu tant que l'aperçu réel n'est pas chargé.
    expect(chart.find('canvas').exists()).toBe(false)
    expect(chart.text()).toBe('')
  })

  it('card: no chart block → no viz at all (no fake chart, no sparkline box)', () => {
    const w = mount(StatsDataCard, {
      props: { item: item({ charts_count: 0 }), mode: 'public' },
      global,
    })
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(false)
    expect(w.find('.bg-\\[\\#faf9fd\\]').exists()).toBe(false)
  })

  it('feature: no chart block and no image → single column, no chart panel', () => {
    const w = mount(StatsDataCard, {
      props: { item: item({ charts_count: 0 }), format: 'row', feature: true },
      global,
    })
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(false)
    expect(w.html()).not.toContain('lg:grid-cols-2')
  })

  it('card + manage: no card chart, status badge + Studio link, no fav star', () => {
    const w = mount(StatsDataCard, { props: { item: item(), mode: 'manage', manage }, global })
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(false)
    expect(w.text()).toContain('Brouillon')
    expect(w.text()).toContain('Studio')
    expect(w.text()).not.toContain('☆')
  })

  it('showSyntheticViz=false forces the decorative sparkline even in public', () => {
    const w = mount(StatsDataCard, {
      props: { item: item(), mode: 'public', showSyntheticViz: false },
      global,
    })
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(false)
  })

  it('row: links to the public page', () => {
    const w = mount(StatsDataCard, { props: { item: item(), format: 'row' }, global })
    const links = w.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/statsdata/mon-statsdata')
  })

  it('feature: renders the white à la une hero with the real chart', () => {
    const w = mount(StatsDataCard, {
      props: { item: item(), format: 'row', feature: true },
      global,
    })
    expect(w.text()).toContain('OUVRIR LE STATSDATA')
    expect(w.html()).toContain('bg-white')
    expect(w.findComponent(StatsDataCardChart).exists()).toBe(true)
  })

  it('is_featured: pins the "À la une" badge on the card and row (not on the big feature card)', () => {
    for (const format of ['card', 'row'] as const) {
      const w = mount(StatsDataCard, { props: { item: item({ is_featured: true }), format }, global })
      expect(w.findComponent(ContentFeaturedBadge).exists()).toBe(true)
    }
    const withImage = mount(StatsDataCard, {
      props: { item: item({ is_featured: true, thumbnail_url: 'https://cdn.test/c.jpg' }) },
      global,
    })
    expect(withImage.findComponent(ContentFeaturedBadge).exists()).toBe(true)

    const feature = mount(StatsDataCard, {
      props: { item: item({ is_featured: true }), format: 'row', feature: true },
      global,
    })
    expect(feature.findComponent(ContentFeaturedBadge).exists()).toBe(false)
  })

  it('shows a real freshness badge when the item carries a scheduled source', () => {
    const w = mount(StatsDataCard, {
      props: {
        item: item({
          freshness: {
            is_live: false,
            last_refreshed_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
            refresh_frequency: 'daily',
          },
        }),
        mode: 'public',
      },
      global,
    })
    expect(w.text()).toContain('Mis à jour')
    expect(w.text()).toContain('rafraîchi chaque jour')
  })

  it('shows no freshness badge when the source never syncs (freshness null)', () => {
    const w = mount(StatsDataCard, {
      props: { item: item({ freshness: null }), mode: 'public' },
      global,
    })
    expect(w.text()).not.toContain('Mis à jour')
  })
})
