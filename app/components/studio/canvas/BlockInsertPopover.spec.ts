import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import BlockInsertPopover from './BlockInsertPopover.vue'
import { useStudioStore } from '@/stores/studio'

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

function setup(type: 'statsdata' | 'survey' = 'statsdata') {
  const studio = useStudioStore()
  studio.initPage({ id: 'c1', type, survey_kind: 'long', title: 'Doc' })
  const zone = `${studio.sections[0]!.id}-0`
  studio.addBlock('heading', zone)
  studio.addBlock('paragraph', zone)
  const anchor = document.createElement('button')
  document.body.appendChild(anchor)
  const w = mount(BlockInsertPopover, { props: { anchor, zoneId: zone, index: 1 }, attachTo: document.body })
  return { studio, zone, w }
}

describe('BlockInsertPopover', () => {
  it('inserts the clicked block at the given index and closes', async () => {
    const { studio, zone, w } = setup()
    const kpi = [...document.querySelectorAll('.st-it')].find((b) => b.textContent?.includes('KPI')) as HTMLElement
    kpi.click()
    await w.vm.$nextTick()
    expect(studio.blocksByZone[zone]!.map((b) => b.type)).toEqual(['heading', 'kpi', 'paragraph'])
    expect(w.emitted('close')).toBeTruthy()
  })

  it('filters with the search box and inserts with Enter', async () => {
    const { studio, zone, w } = setup()
    const input = document.querySelector('.st-pop input') as HTMLInputElement
    input.value = 'camembert'
    input.dispatchEvent(new Event('input'))
    await w.vm.$nextTick()
    expect(document.querySelectorAll('.st-it')).toHaveLength(1)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await w.vm.$nextTick()
    expect(studio.blocksByZone[zone]!.map((b) => b.type)).toEqual(['heading', 'pie', 'paragraph'])
  })

  it('only offers the survey palette in a survey', () => {
    setup('survey')
    const labels = [...document.querySelectorAll('.st-it b')].map((b) => b.textContent)
    expect(labels).toEqual(expect.arrayContaining(['Choix unique', 'Nombre', 'Réponse libre']))
    expect(labels).not.toContain('Barres')
  })
})
