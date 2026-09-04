import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ContentOwnerBar from './ContentOwnerBar.vue'

function mountBar(props: { type: 'statsdata' | 'article' | 'survey'; slug: string; status?: string | null }) {
  return mount(ContentOwnerBar, {
    props,
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('ContentOwnerBar', () => {
  it('links « Éditer » to the properties dashboard and « Studio » to the block editor', () => {
    const wrapper = mountBar({ type: 'statsdata', slug: 'prix-essence', status: 'published' })
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.map((l) => l.props('to'))).toEqual([
      '/contenu/prix-essence/proprietes',
      '/studio/statsdata/prix-essence',
    ])
    expect(wrapper.text()).not.toContain('non publié')
  })

  it('uses the content type in the Studio path', () => {
    const wrapper = mountBar({ type: 'article', slug: 'mon-article' })
    const studio = wrapper.findAllComponents(RouterLinkStub)[1]!
    expect(studio.props('to')).toBe('/studio/article/mon-article')
  })

  it('flags a draft as not published', () => {
    const wrapper = mountBar({ type: 'survey', slug: 'sondage', status: 'draft' })
    expect(wrapper.text()).toContain('non publié')
  })
})
