import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ContentDossierBadge from './ContentDossierBadge.vue'

const global = { stubs: { RouterLink: RouterLinkStub } }

describe('ContentDossierBadge', () => {
  it('renders a linked badge per dossier', () => {
    const w = mount(ContentDossierBadge, {
      props: {
        dossiers: [
          { id: 1, slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine' },
          { id: 2, slug: 'prix-carburants', name: 'Prix des carburants' },
        ],
      },
      global,
    })
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
    expect(links[0]!.props('to')).toBe('/dossiers/guerre-en-ukraine')
    expect(w.text()).toContain('Guerre en Ukraine')
    expect(w.text()).toContain('Prix des carburants')
  })

  it('renders nothing without dossiers', () => {
    expect(mount(ContentDossierBadge, { props: { dossiers: [] }, global }).text()).toBe('')
    expect(mount(ContentDossierBadge, { props: { dossiers: null }, global }).text()).toBe('')
    expect(mount(ContentDossierBadge, { props: {}, global }).text()).toBe('')
  })

  it('skips malformed entries', () => {
    const w = mount(ContentDossierBadge, {
      props: { dossiers: [null, { slug: '', name: 'x' }, { slug: 'ok', name: 'OK' }] },
      global,
    })
    expect(w.findAllComponents(RouterLinkStub)).toHaveLength(1)
    expect(w.text()).toContain('OK')
  })
})
