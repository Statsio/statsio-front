import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ContentManageCard from './ContentManageCard.vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentManageMeta } from '@/types/content-card'

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'mon-contenu',
    title: 'Mon contenu',
    description: null,
    type: 'article',
    categories: [],
    category: null,
    format: null,
    tags: [],
    reading_minutes: 0,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    publisher: { name: 'Éco&Vous', initials: 'EV', is_channel: true, verified: true },
    is_favorited: false,
    ...overrides,
  }
}

function manage(overrides: Partial<ContentManageMeta> = {}): ContentManageMeta {
  return {
    statusLabel: 'Publié',
    statusBg: 'rgba(16,185,129,0.14)',
    statusColor: '#0f9d76',
    live: true,
    ownerKind: 'chaine',
    ownerLabel: 'Éco&Vous',
    date: '3 juil.',
    viewsCount: 48200,
    studioPath: '/studio/article/mon-contenu',
    propertiesPath: '/contenu/mon-contenu/proprietes',
    publicPath: '/articles/mon-contenu',
    ...overrides,
  }
}

const global = { stubs: { NuxtLink: RouterLinkStub } }

describe('ContentManageCard', () => {
  it('renders the mockup card: type label, status badge, Éditer + Paramètres links', () => {
    const w = mount(ContentManageCard, { props: { item: item(), manage: manage() }, global })
    expect(w.text()).toContain('Article')
    expect(w.text()).toContain('Publié')
    expect(w.text()).toContain('Éditer')
    expect(w.text()).toContain('Paramètres')
    const links = w.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/studio/article/mon-contenu')
    expect(links).toContain('/contenu/mon-contenu/proprietes')
  })

  it('shows the owner row by default, hides it with hideOwner', () => {
    const shown = mount(ContentManageCard, { props: { item: item(), manage: manage() }, global })
    expect(shown.text()).toContain('Éco&Vous')

    const hidden = mount(ContentManageCard, { props: { item: item(), manage: manage(), hideOwner: true }, global })
    // owner label absent from the body (only the card, no publisher chip)
    expect(hidden.text()).not.toContain('Éco&Vous')
  })

  it('draft: no "Voir en ligne" link, views shown as em dash', () => {
    const w = mount(ContentManageCard, {
      props: { item: item(), manage: manage({ live: false, publicPath: null, statusLabel: 'Brouillon' }) },
      global,
    })
    expect(w.text()).toContain('Brouillon')
    expect(w.text()).not.toContain('Voir en ligne')
    expect(w.text()).toContain('—')
  })

  it('row format: renders a table row with the type pill', () => {
    const w = mount(ContentManageCard, { props: { item: item({ type: 'survey' }), manage: manage(), format: 'row' }, global })
    expect(w.text()).toContain('Sondage')
    expect(w.text()).toContain('Publié')
  })
})
