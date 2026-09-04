import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import StatsDataToc from './StatsDataToc.vue'

vi.mock('@/api/studio', () => ({
  fetchScalarAggregate: vi.fn<(...a: unknown[]) => unknown>(),
  fetchPublicScalarAggregate: vi.fn<(...a: unknown[]) => unknown>(),
}))

const RouterLinkStub = { name: 'RouterLink', props: ['to'], template: '<a :href="to"><slot /></a>' }
const mountToc = () => mount(StatsDataToc, { global: { stubs: { RouterLink: RouterLinkStub } } })

function seed(sections: { id: string; title?: string }[], params: Record<string, string> = {}, pageParams: { name: string; label?: string }[] = []) {
  const store = useStudioStore()
  store.initPage(
    { id: 'c1', type: 'statsdata', title: 'Doc' },
    sections.map((s) => ({ ...s, layout: '1-col', pageId: 'p1' })),
    [],
    [{ id: 'p1', title: 'Principale', params: pageParams }],
  )
  store.setPageParams(params)
  return store
}

describe('StatsDataToc', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders one numbered entry per titled section, anchor slugified from the title, in order', () => {
    seed([
      { id: 's1', title: 'Chiffres clés' },
      { id: 's2' },
      { id: 's3', title: 'Écarts régionaux' },
    ])
    const w = mount(StatsDataToc)
    const links = w.findAll('a')
    expect(links).toHaveLength(2)
    expect(links[0]!.text()).toContain('01')
    expect(links[0]!.text()).toContain('Chiffres clés')
    expect(links[0]!.attributes('href')).toBe('#chiffres-cles')
    expect(links[1]!.text()).toContain('02')
    expect(links[1]!.attributes('href')).toBe('#ecarts-regionaux')
  })

  it('hides itself when there are fewer than 2 titled sections', () => {
    seed([{ id: 's1', title: 'Seul' }])
    expect(mount(StatsDataToc).find('nav').exists()).toBe(false)
  })

  it('shows the active value of declared page params', () => {
    seed(
      [{ id: 's1', title: 'A' }, { id: 's2', title: 'B' }],
      { carburant: 'Gazole', code_commune: '69003' },
      [{ name: 'carburant', label: 'Carburant' }],
    )
    const text = mountToc().text()
    expect(text).toContain('Carburant')
    expect(text).toContain('Gazole')
    expect(text).not.toContain('69003') // non déclaré → pas affiché
  })

  it('lists every page and its sections, linking other pages by URL', () => {
    const store = useStudioStore()
    store.initPage(
      { id: 'c1', type: 'statsdata', title: 'Doc', slug: 'prix-carburants' },
      [
        { id: 'a1', title: 'Vue nationale', layout: '1-col', pageId: 'p1' },
        { id: 'a2', title: 'Par région', layout: '1-col', pageId: 'p1' },
        { id: 'b1', title: 'Ma commune', layout: '1-col', pageId: 'p2' },
      ],
      [],
      [
        { id: 'p1', title: 'Panorama', slug: 'panorama' },
        { id: 'p2', title: 'Détail commune', slug: 'commune' },
      ],
    )
    const w = mountToc()
    const text = w.text()
    expect(text).toContain('Panorama')
    expect(text).toContain('Détail commune')
    expect(text).toContain('Vue nationale')
    expect(text).toContain('Ma commune')
    // Section de la page courante → ancre locale
    expect(w.find('a[href="#vue-nationale"]').exists()).toBe(true)
    // Section d'une autre page → URL complète avec ancre
    expect(w.find('a[href="/statsdata/prix-carburants/commune#ma-commune"]').exists()).toBe(true)
  })
})
