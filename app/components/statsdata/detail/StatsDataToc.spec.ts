import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import StatsDataToc from './StatsDataToc.vue'

vi.mock('@/api/studio', () => ({
  fetchScalarAggregate: vi.fn<(...a: unknown[]) => unknown>(),
  fetchPublicScalarAggregate: vi.fn<(...a: unknown[]) => unknown>(),
}))

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
    const text = mount(StatsDataToc).text()
    expect(text).toContain('Carburant')
    expect(text).toContain('Gazole')
    expect(text).not.toContain('69003') // non déclaré → pas affiché
  })
})
