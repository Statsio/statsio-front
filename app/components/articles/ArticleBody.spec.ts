import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import ArticleBody from './ArticleBody.vue'
import type { Section, StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchBlockData: vi.fn<(...args: unknown[]) => unknown>(),
  fetchPublicBlockData: vi.fn<(...args: unknown[]) => unknown>(),
  fetchScalarAggregate: vi.fn<(...args: unknown[]) => unknown>(),
  fetchPublicScalarAggregate: vi.fn<(...args: unknown[]) => unknown>(),
}))

const stubs = {
  BlockRenderer: { name: 'BlockRenderer', props: ['block', 'readonly'], template: '<div class="br" />' },
}

function seed(sections: Partial<Section>[], blocks: StudioBlock[]) {
  const store = useStudioStore()
  store.initPage(
    { id: 'a1', type: 'article', title: 'Article' },
    sections.map((s) => ({ id: 's', layout: '1-col', pageId: 'p1', ...s })) as Section[],
    blocks,
    [{ id: 'p1', title: 'Page 1' }],
  )
  return store
}

describe('ArticleBody', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders section headers (kicker + h2 + anchor id) and their blocks in order', () => {
    seed(
      [
        { id: 'intro', title: undefined },
        { id: 'sec1', kicker: 'Tendance', title: 'Le grand écart', description: 'Analyse' },
      ],
      [
        { id: 'p0', type: 'paragraph', zoneId: 'intro-0', fieldMapping: {}, config: { content: '<p>chapô</p>' } },
        { id: 'p1', type: 'paragraph', zoneId: 'sec1-0', fieldMapping: {}, config: { content: '<p>corps</p>' } },
      ],
    )

    const w = mount(ArticleBody, { global: { stubs } })

    const h2 = w.find('h2')
    expect(h2.text()).toBe('Le grand écart')
    expect(w.find('header#le-grand-ecart').exists()).toBe(true)
    expect(w.text()).toContain('Tendance')
    expect(w.text()).toContain('Analyse')
    expect(w.findAllComponents({ name: 'BlockRenderer' })).toHaveLength(2)
  })

  it('shows the empty state when the page has no header and no block', () => {
    seed([{ id: 's1' }], [])
    expect(mount(ArticleBody, { global: { stubs } }).text()).toContain('aucun contenu')
  })

  it('renders sd-embed blocks bare (no bordered card wrapper)', () => {
    seed(
      [{ id: 's1', title: 'Chiffres' }],
      [{ id: 'e1', type: 'sd-embed', zoneId: 's1-0', fieldMapping: {}, config: { sourceSlug: 'x', sourceBlockId: 'b' } }],
    )
    const w = mount(ArticleBody, { global: { stubs } })
    // pas de carte bordée autour d'un sd-embed
    expect(w.find('.border').exists()).toBe(false)
    expect(w.findComponent({ name: 'BlockRenderer' }).exists()).toBe(true)
  })
})
