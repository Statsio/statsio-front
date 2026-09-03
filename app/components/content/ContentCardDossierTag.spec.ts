import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentCardDossierTag from './ContentCardDossierTag.vue'

describe('ContentCardDossierTag', () => {
  it('renders the dossier name when a dossier is linked', () => {
    const w = mount(ContentCardDossierTag, {
      props: { dossier: { slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine' } },
    })
    expect(w.text()).toContain('Guerre en Ukraine')
    expect(w.find('svg').exists()).toBe(true)
  })

  it('renders nothing when there is no dossier', () => {
    expect(mount(ContentCardDossierTag, { props: { dossier: null } }).text()).toBe('')
    expect(mount(ContentCardDossierTag, { props: { dossier: undefined } }).text()).toBe('')
  })

  it('is not a link (no destination for now)', () => {
    const w = mount(ContentCardDossierTag, {
      props: { dossier: { slug: 'x', name: 'X' } },
    })
    expect(w.find('a').exists()).toBe(false)
  })
})
