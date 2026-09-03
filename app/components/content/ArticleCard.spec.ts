import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ArticleCard from './ArticleCard.vue'
import ContentFeaturedBadge from './ContentFeaturedBadge.vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentManageMeta } from '@/types/content-card'

vi.mock('@/composables/useContentBasePath', () => ({
  useContentBasePath: () => ({ value: '' }),
}))

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'mon-article',
    title: 'Mon article',
    description: null,
    type: 'article',
    categories: ['economie'],
    category: 'economie',
    format: null,
    reading_minutes: 6,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 120,
    updated_at: '2026-08-01T00:00:00Z',
    publisher: { name: 'Éco&Vous', initials: 'EV', is_channel: true, verified: true },
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
  studioPath: '/studio/article/mon-article',
  propertiesPath: '/contenu/mon-article/proprietes',
  publicPath: null,
}

const global = { stubs: { NuxtLink: RouterLinkStub, CatalogSubBrandTag: true } }

describe('ArticleCard', () => {
  it('card + public: shows the fav star, links to the public page, no Studio link', () => {
    const w = mount(ArticleCard, { props: { item: item(), format: 'card', mode: 'public' }, global })
    expect(w.text()).toContain('Mon article')
    expect(w.text()).toContain('☆')
    expect(w.text()).not.toContain('Studio')
    const links = w.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/articles/mon-article')
  })

  it('card + manage: shows the status badge + Studio link, no fav star', () => {
    const w = mount(ArticleCard, { props: { item: item(), format: 'card', mode: 'manage', manage }, global })
    expect(w.text()).toContain('Brouillon')
    expect(w.text()).toContain('Studio')
    expect(w.text()).not.toContain('☆')
    const links = w.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/studio/article/mon-article')
  })

  it('row: renders the row layout and the public link', () => {
    const w = mount(ArticleCard, { props: { item: item(), format: 'row', mode: 'public' }, global })
    expect(w.text()).toContain('6 min de lecture')
    const links = w.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/articles/mon-article')
  })

  it('feature: renders the hero treatment', () => {
    const w = mount(ArticleCard, { props: { item: item(), format: 'row', feature: true }, global })
    expect(w.text()).toContain('À LA UNE')
    expect(w.text()).toContain('LIRE L’ARTICLE')
  })

  it('is_featured: shows the "À la une" pin badge on the normal card and row', () => {
    const card = mount(ArticleCard, { props: { item: item({ is_featured: true }), mode: 'public' }, global })
    expect(card.findComponent(ContentFeaturedBadge).exists()).toBe(true)

    const row = mount(ArticleCard, { props: { item: item({ is_featured: true }), format: 'row' }, global })
    expect(row.findComponent(ContentFeaturedBadge).exists()).toBe(true)
  })

  it('is_featured: the big feature card does not double up the pin badge', () => {
    const w = mount(ArticleCard, { props: { item: item({ is_featured: true }), format: 'row', feature: true }, global })
    expect(w.findComponent(ContentFeaturedBadge).exists()).toBe(false)
  })
})
