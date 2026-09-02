import { computed, ref } from 'vue'
import type {
  ContentCoverage,
  CreateContentPayload,
  ContentType,
  SurveyKind,
} from '@/types/content-creation'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'

const INFO_STEP: ModalStep = { id: 'info', title: 'Contenu', description: 'Titre, catégories et couverture' }
const SURVEY_STEP: ModalStep = { id: 'survey', title: 'Type de sondage', description: 'Format et vérification' }
const REVIEW_STEP: ModalStep = { id: 'review', title: 'Récapitulatif', description: 'Vérifiez avant de créer' }

/** Steps for a given content type (survey inserts a dedicated step before the review). */
export function wizardStepsFor(type: ContentType): ModalStep[] {
  return type === 'survey' ? [INFO_STEP, SURVEY_STEP, REVIEW_STEP] : [INFO_STEP, REVIEW_STEP]
}

/** Kept for backwards-compat with existing imports/tests. */
export const CONTENT_WIZARD_STEPS: ModalStep[] = wizardStepsFor('statsdata')

export function useCreateContentWizard(type: ContentType = 'statsdata') {
  const title = ref('')
  const categories = ref<string[]>([])
  const coverage = ref<ContentCoverage | null>(null)
  const surveyKind = ref<SurveyKind>('single_question')
  const requiresIdentityVerification = ref(false)

  const steps = computed(() => wizardStepsFor(type))

  const currentStepId = ref<string>(steps.value[0]!.id)

  const currentStepIndex = computed(
    () => steps.value.findIndex((s) => s.id === currentStepId.value),
  )

  const canGoNext = computed(() => {
    if (currentStepId.value === 'info') return title.value.trim().length > 0
    return true
  })

  function reset() {
    title.value = ''
    categories.value = []
    coverage.value = null
    surveyKind.value = 'single_question'
    requiresIdentityVerification.value = false
    currentStepId.value = steps.value[0]!.id
  }

  function buildPayload(payloadType: ContentType): CreateContentPayload {
    return {
      title: title.value.trim(),
      type: payloadType,
      categories: categories.value,
      ...(coverage.value ? { coverage: coverage.value } : {}),
      ...(payloadType === 'survey'
        ? {
            survey_kind: surveyKind.value,
            requires_identity_verification: requiresIdentityVerification.value,
          }
        : {}),
    }
  }

  return {
    title,
    categories,
    coverage,
    surveyKind,
    requiresIdentityVerification,
    steps,
    currentStepId,
    currentStepIndex,
    canGoNext,
    reset,
    buildPayload,
  }
}
