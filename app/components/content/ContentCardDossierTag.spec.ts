import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ContentCardDossierTag from './ContentCardDossierTag.vue'

const global = { stubs: { NuxtLink: RouterLinkStub } }

describe('ContentCardDossierTag', () => {
  it('renders the dossier name when a dossier is linked', () => {
    const w = mount(ContentCardDossierTag, {
      props: { dossier: { slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine' } },
      global,
    })
    expect(w.text()).toContain('Guerre en Ukraine')
  })

  it('renders nothing when there is no dossier', () => {
    expect(mount(ContentCardDossierTag, { props: { dossier: null }, global }).text()).toBe('')
    expect(mount(ContentCardDossierTag, { props: { dossier: undefined }, global }).text()).toBe('')
  })

  it('links to the dossier page', () => {
    const w = mount(ContentCardDossierTag, {
      props: { dossier: { slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine' } },
      global,
    })
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/dossiers/guerre-en-ukraine')
  })
})
