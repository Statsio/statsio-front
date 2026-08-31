import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleHero from './ArticleHero.vue'
import type { StatsDataDocument } from '@/api/studio'

const stubs = {
  StatsDataPublisherCard: { name: 'StatsDataPublisherCard', props: ['doc', 'isFollowing', 'canFollow'], template: '<aside />' },
}

function makeDoc(overrides: Partial<StatsDataDocument> = {}): StatsDataDocument {
  return {
    id: '1',
    title: "Le pouvoir d'achat des ménages français",
    description: 'Un an d’enquête et deux Statsdata.',
    categories: ['enquete', 'economie'],
    author: { name: 'Éco&Vous' },
    created_at: '2026-07-03T09:00:00Z',
    ...overrides,
  }
}

describe('ArticleHero', () => {
  it('derives the format label + theme from categories', () => {
    const wrapper = mount(ArticleHero, {
      props: { doc: makeDoc(), readingMinutes: 9, linkedCount: 0, isFollowing: false, canFollow: false },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('ENQUÊTE')
    expect(wrapper.text()).toContain('ECONOMIE')
    expect(wrapper.text()).toContain('9 min de lecture')
  })

  it('shows the linked-Statsdata pill only when linkedCount > 0', () => {
    const none = mount(ArticleHero, {
      props: { doc: makeDoc(), readingMinutes: 5, linkedCount: 0, isFollowing: false, canFollow: false },
      global: { stubs },
    })
    expect(none.text()).not.toContain('Statsdata lié')

    const some = mount(ArticleHero, {
      props: { doc: makeDoc(), readingMinutes: 5, linkedCount: 2, isFollowing: false, canFollow: false },
      global: { stubs },
    })
    expect(some.text()).toContain('2 Statsdata liés')
  })

  it('falls back gracefully when no format category is present', () => {
    const wrapper = mount(ArticleHero, {
      props: {
        doc: makeDoc({ categories: ['economie'] }),
        readingMinutes: 3,
        linkedCount: 0,
        isFollowing: false,
        canFollow: false,
      },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('ENQUÊTE')
    expect(wrapper.text()).toContain('ECONOMIE')
  })
})
