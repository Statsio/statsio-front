import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ContentCard from './ContentCard.vue'
import type { CatalogItem } from '@/types/catalog'

vi.mock('@/composables/useContentBasePath', () => ({
  useContentBasePath: () => ({ value: '' }),
}))

function item(type: CatalogItem['type'], slug: string): CatalogItem {
  return {
    id: '1',
    slug,
    title: `Titre ${type}`,
    description: null,
    type,
    categories: [],
    category: null,
    format: null,
    tags: [],
    reading_minutes: 3,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    publisher: { name: 'X', initials: 'X', is_channel: false, verified: false },
    is_favorited: false,
  }
}

const global = { stubs: { NuxtLink: RouterLinkStub, CatalogSubBrandTag: true, AppSparkline: true } }

describe('ContentCard dispatcher', () => {
  it.each([
    ['article', 'ArticleCard'],
    ['survey', 'SurveyCard'],
    ['statsdata', 'StatsDataCard'],
  ] as const)('renders %s → %s', (type, name) => {
    const w = mount(ContentCard, { props: { item: item(type, `s-${type}`) }, global })
    expect(w.findComponent({ name }).exists()).toBe(true)
  })

  it('forwards the favorite event', async () => {
    const w = mount(ContentCard, { props: { item: item('article', 'a'), favorited: false }, global })
    await w.get('button[aria-label="Ajouter aux favoris"]').trigger('click')
    expect(w.emitted('favorite')).toBeTruthy()
  })
})
