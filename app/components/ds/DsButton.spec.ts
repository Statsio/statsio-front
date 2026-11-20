import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import DsButton from './DsButton.vue'

const mountBtn = (props: Record<string, unknown> = {}) =>
  mount(DsButton, { props, slots: { default: 'Go' }, global: { stubs: { RouterLink: RouterLinkStub } } })

describe('DsButton', () => {
  it('renders a typed <button> by default', () => {
    const w = mountBtn()
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.classes()).toEqual(expect.arrayContaining(['ds-btn', 'ds-btn--primary', 'ds-btn--md']))
  })

  it('renders a RouterLink when `to` is set', () => {
    const w = mountBtn({ to: '/studio', variant: 'secondary', size: 'sm' })
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/studio')
    expect(w.classes()).toEqual(expect.arrayContaining(['ds-btn--secondary', 'ds-btn--sm']))
  })

  it('renders an anchor when `href` is set', () => {
    const w = mountBtn({ href: 'https://example.org' })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('https://example.org')
  })

  it('forwards submit type and disabled state', () => {
    const w = mountBtn({ type: 'submit', disabled: true })
    expect(w.attributes('type')).toBe('submit')
    expect(w.attributes('disabled')).toBeDefined()
  })
})
