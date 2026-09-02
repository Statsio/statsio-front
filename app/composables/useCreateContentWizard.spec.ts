import { describe, it, expect } from 'vitest'
import { useCreateContentWizard, wizardStepsFor } from '@/composables/useCreateContentWizard'

describe('useCreateContentWizard', () => {
  it('inserts a "survey" step only for surveys', () => {
    expect(wizardStepsFor('article').map((s) => s.id)).toEqual(['info', 'review'])
    expect(wizardStepsFor('survey').map((s) => s.id)).toEqual(['info', 'survey', 'review'])
  })

  it('buildPayload includes survey fields for a survey', () => {
    const w = useCreateContentWizard('survey')
    w.title.value = '  Ma consultation  '
    w.surveyKind.value = 'petition'
    w.requiresIdentityVerification.value = true

    const payload = w.buildPayload('survey')

    expect(payload).toMatchObject({
      title: 'Ma consultation',
      type: 'survey',
      survey_kind: 'petition',
      requires_identity_verification: true,
    })
  })

  it('buildPayload omits survey fields for non-surveys', () => {
    const w = useCreateContentWizard('article')
    w.title.value = 'Un article'

    const payload = w.buildPayload('article')

    expect(payload.survey_kind).toBeUndefined()
    expect(payload.requires_identity_verification).toBeUndefined()
  })

  it('buildPayload includes coverage only when set, never status/visibility', () => {
    const w = useCreateContentWizard('statsdata')
    w.title.value = 'Un jeu de données'

    expect(w.buildPayload('statsdata').coverage).toBeUndefined()

    w.coverage.value = 'nationale'
    const payload = w.buildPayload('statsdata')
    expect(payload.coverage).toBe('nationale')
    expect(payload).not.toHaveProperty('visibility')
    expect(payload).not.toHaveProperty('published_as')
  })

  it('reset restores defaults', () => {
    const w = useCreateContentWizard('survey')
    w.surveyKind.value = 'long'
    w.requiresIdentityVerification.value = true
    w.coverage.value = 'mondiale'
    w.reset()
    expect(w.surveyKind.value).toBe('single_question')
    expect(w.requiresIdentityVerification.value).toBe(false)
    expect(w.coverage.value).toBeNull()
    expect(w.currentStepId.value).toBe('info')
  })
})
