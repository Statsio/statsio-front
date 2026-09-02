import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LinkCardBlock from './LinkCardBlock.vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const routeParams: Record<string, string> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
}))

function makeBlock(config: Record<string, unknown> = {}): StudioBlock {
  return { id: 'lnk-1', type: 'link-card', zoneId: 'z', fieldMapping: {}, config }
}

describe('LinkCardBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    for (const k of Object.keys(routeParams)) delete routeParams[k]
  })

  it('renders the empty state when unconfigured', () => {
    const wrapper = mount(LinkCardBlock, { props: { block: makeBlock(), readonly: true } })
    expect(wrapper.text()).toContain('Ajouter un lien')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('mode url: links out to the raw URL, opened in a new tab', () => {
    const wrapper = mount(LinkCardBlock, {
      props: {
        block: makeBlock({ linkMode: 'url', linkUrl: 'https://lemonde.fr/x', linkTitle: 'Titre', linkDomain: 'lemonde.fr' }),
        readonly: true,
      },
    })
    const a = wrapper.find('a')
    expect(a.attributes('href')).toBe('https://lemonde.fr/x')
    expect(a.attributes('target')).toBe('_blank')
    expect(wrapper.text()).toContain('lemonde.fr')
    expect(wrapper.text()).toContain('Titre')
  })

  it('mode content: resolves the public path for the picked content and stays same-tab', () => {
    const wrapper = mount(LinkCardBlock, {
      props: {
        block: makeBlock({
          linkMode: 'content',
          linkContentType: 'article',
          linkContentSlug: 'mon-article',
          linkTitle: 'Mon article',
        }),
        readonly: true,
      },
    })
    const a = wrapper.find('a')
    expect(a.attributes('href')).toBe('/articles/mon-article')
    expect(a.attributes('target')).toBeUndefined()
    expect(wrapper.text()).toContain('Article')
  })

  it('mode page: links to a page of the current Statsdata document, using the route slug', () => {
    routeParams.slug = 'prix-de-lessence'
    const studio = useStudioStore()
    studio.pages = [
      { id: 'default', title: 'France' },
      { id: 'p2', title: 'Occitanie', slug: 'occitanie' },
    ]

    const wrapper = mount(LinkCardBlock, {
      props: { block: makeBlock({ linkMode: 'page', linkPageId: 'p2', linkTitle: 'Occitanie' }), readonly: true },
    })
    const a = wrapper.find('a')
    expect(a.attributes('href')).toBe('/statsdata/prix-de-lessence/occitanie')
    expect(a.attributes('target')).toBeUndefined()
  })

  it('is not clickable while editing (readonly false), even when configured', () => {
    const wrapper = mount(LinkCardBlock, {
      props: { block: makeBlock({ linkMode: 'url', linkUrl: 'https://x.fr', linkTitle: 'Titre' }), readonly: false },
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('https://x.fr')
  })
})
