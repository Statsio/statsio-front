import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleToc from './ArticleToc.vue'

describe('ArticleToc', () => {
  it('renders nothing when there are fewer than 2 headings and no linked Statsdata', () => {
    const wrapper = mount(ArticleToc, { props: { entries: [{ id: 'block-1', label: 'Intro' }], linked: [] } })
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
    })
    const links = wrapper.findAll('a[href^="#block-"]')
    expect(links).toHaveLength(2)
    expect(wrapper.text()).toContain('01')
    expect(wrapper.text()).toContain('Huit régions en tension')
  })

  it('renders the "Statsdata liés" box from linked blocks even without a full sommaire', () => {
    const wrapper = mount(ArticleToc, {
      props: {
        entries: [],
        linked: [
          { id: 'block-9', title: 'Le prix des carburants' },
          { id: 'block-10', title: 'Loyers par région' },
        ],
      },
    })
    expect(wrapper.text()).toContain('Statsdata liés')
    expect(wrapper.find('a[href="#block-9"]').exists()).toBe(true)
    expect(wrapper.find('a[href="#block-10"]').text()).toContain('Loyers par région')
  })
})
