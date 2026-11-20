import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const save = vi.fn<(id: string, payload: Record<string, unknown>) => Promise<unknown>>()
vi.mock('@/api/studio', async (orig) => ({
  ...(await orig<typeof import('@/api/studio')>()),
  saveStatsDataDocument: (id: string, payload: Record<string, unknown>) => save(id, payload),
}))

import SidebarSurveySettings from './SidebarSurveySettings.vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'

beforeEach(() => {
  setActivePinia(createPinia())
  save.mockReset()
  save.mockImplementation(async (_id: string, payload: Record<string, unknown>) => ({ id: 'c1', slug: 's', title: 'S', ...payload }))
  useStudioStore().initPage({ id: 'c1', type: 'survey', survey_kind: 'long', title: 'Sondage' })
  useStudioMetaStore().init({ id: 'c1', slug: 's', title: 'Sondage', survey_kind: 'long', one_response_per_account: true, results_visibility: 'after_submit' })
})

describe('SidebarSurveySettings', () => {
  it('reflects the current settings', () => {
    const w = mount(SidebarSurveySettings)
    const pressed = w.findAll('[aria-pressed="true"]').map((b) => b.text())
    expect(pressed).toEqual(['Questionnaire', 'Après l’envoi'])
    expect(w.find('[aria-label="Une réponse par compte"]').attributes('aria-checked')).toBe('true')
  })

  it('saves a change of results visibility and of the one-answer toggle', async () => {
    const w = mount(SidebarSurveySettings)
    await w.findAll('button').find((b) => b.text() === 'Jamais')!.trigger('click')
    expect(save).toHaveBeenLastCalledWith('s', { results_visibility: 'never' })

    await w.find('[aria-label="Une réponse par compte"]').trigger('click')
    expect(save).toHaveBeenLastCalledWith('s', { one_response_per_account: false })
  })

  it('switching format updates the studio content too (palette locks follow)', async () => {
    const w = mount(SidebarSurveySettings)
    await w.findAll('button').find((b) => b.text() === 'Pétition')!.trigger('click')
    expect(useStudioStore().content?.survey_kind).toBe('petition')
    expect(save).toHaveBeenLastCalledWith('s', { survey_kind: 'petition' })
  })
})
