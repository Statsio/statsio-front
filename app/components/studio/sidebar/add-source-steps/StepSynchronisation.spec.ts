import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepSynchronisation from './StepSynchronisation.vue'

describe('StepSynchronisation', () => {
  it('renders one button per frequency option, including hourly and never', () => {
    const w = mount(StepSynchronisation, { props: { modelValue: 'weekly' } })
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toEqual(['Toutes les heures', 'Journalière', 'Hebdomadaire', 'Mensuelle', 'Annuelle', 'Jamais'])
  })

  it('emits the picked frequency', async () => {
    const w = mount(StepSynchronisation, { props: { modelValue: 'weekly' } })
    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['hourly'])
  })

  it('warns when "Jamais" is selected', () => {
    const w = mount(StepSynchronisation, { props: { modelValue: 'none' } })
    expect(w.text()).toContain('Aucune resynchronisation')
  })

  it('hides the "Actualiser maintenant" block outside edit mode', () => {
    const w = mount(StepSynchronisation, { props: { modelValue: 'weekly' } })
    expect(w.text()).not.toContain('Actualiser maintenant')
  })

  it('shows "Actualiser maintenant" + dates in edit mode and emits refresh-now', async () => {
    const w = mount(StepSynchronisation, {
      props: { modelValue: 'weekly', lastRefreshedAt: '2026-09-01T10:00:00Z', nextRefreshAt: null, refreshing: false },
    })
    expect(w.text()).toContain('Actualiser maintenant')
    expect(w.text()).toContain('Dernière synchronisation')
    await w.findAll('button').at(-1)!.trigger('click')
    expect(w.emitted('refresh-now')).toHaveLength(1)
  })
})
