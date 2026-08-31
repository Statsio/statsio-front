import { describe, it, expect } from 'vitest'
import { useCreateContentWizard, wizardStepsFor } from '@/composables/useCreateContentWizard'

describe('useCreateContentWizard', () => {
  it('inserts a "survey" step only for surveys', () => {
    expect(wizardStepsFor('article').map((s) => s.id)).toEqual([
      'title', 'categories', 'coverage', 'publication',
    ])
    expect(wizardStepsFor('survey').map((s) => s.id)).toEqual([
      'title', 'survey', 'categories', 'coverage', 'publication',
    ])
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

  it('reset restores survey defaults', () => {
    const w = useCreateContentWizard('survey')
    w.surveyKind.value = 'long'
    w.requiresIdentityVerification.value = true
    w.reset()
    expect(w.surveyKind.value).toBe('single_question')
    expect(w.requiresIdentityVerification.value).toBe(false)
    expect(w.currentStepId.value).toBe('title')
  })
})
