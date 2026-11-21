import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleToc from './ArticleToc.vue'

const stubs = {
  RouterLink: { props: ['to'], template: '<a :href="typeof to === \'string\' ? to : \'#\'"><slot /></a>' },
}

describe('ArticleToc', () => {
  it('renders nothing when there are fewer than 2 headings and no linked Statsdata', () => {
    const wrapper = mount(ArticleToc, {
      props: { entries: [{ id: 'block-1', label: 'Intro' }], linked: [] },
      global: { stubs },
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders numbered anchors for each heading entry', () => {
    const wrapper = mount(ArticleToc, {
      props: {
        entries: [
          { id: 'block-1', label: 'Le grand écart' },
          { id: 'block-2', label: 'Huit régions en tension' },
        ],
        linked: [],
      },
      global: { stubs },
    })
    const links = wrapper.findAll('a[href^="#block-"]')
    expect(links).toHaveLength(2)
    expect(wrapper.text()).toContain('01')
    expect(wrapper.text()).toContain('Huit régions en tension')
  })

  it('renders the linked Statsdata card even without a full sommaire', () => {
    const wrapper = mount(ArticleToc, {
      props: {
        entries: [],
        linked: [
          {
            slug: 'carburants',
            title: 'Le prix des carburants',
            href: '/statsdata/carburants',
            blocks: [{ id: 'block-9', label: 'Lignes' }],
          },
        ],
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain("Données de l'article")
    expect(wrapper.text()).toContain('Le prix des carburants')
    expect(wrapper.find('a[href="#block-9"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Lignes')
  })
})
