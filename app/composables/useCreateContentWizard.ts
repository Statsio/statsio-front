import { computed, ref } from 'vue'
import type {
  CoverageType,
  ContentVisibility,
  ContentPublishedAs,
  CreateContentPayload,
  ContentType,
  SurveyKind,
} from '@/types/content-creation'
import { ALL_CONTINENT_VALUES } from '@/types/content-creation'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'

const TITLE_STEP: ModalStep = { id: 'title', title: 'Titre', description: 'Donnez un nom à votre contenu' }
const SURVEY_STEP: ModalStep = { id: 'survey', title: 'Type de sondage', description: 'Format et vérification' }
const BASE_STEPS: ModalStep[] = [
  { id: 'categories', title: 'Catégories', description: 'Classifiez votre contenu' },
  { id: 'coverage', title: 'Couverture', description: 'Définissez la portée géographique' },
  { id: 'publication', title: 'Publication', description: 'Choisissez la visibilité' },
]

/** Steps for a given content type (survey inserts a dedicated step after the title). */
export function wizardStepsFor(type: ContentType): ModalStep[] {
  return type === 'survey' ? [TITLE_STEP, SURVEY_STEP, ...BASE_STEPS] : [TITLE_STEP, ...BASE_STEPS]
}

/** Kept for backwards-compat with existing imports/tests. */
export const CONTENT_WIZARD_STEPS: ModalStep[] = wizardStepsFor('statsdata')

export function useCreateContentWizard(type: ContentType = 'statsdata') {
  const title = ref('')
  const categories = ref<string[]>([])
  const coverageType = ref<CoverageType>('monde')
  const coverageValues = ref<string[]>([...ALL_CONTINENT_VALUES])
  const visibility = ref<ContentVisibility>('private')
  const publishedAs = ref<ContentPublishedAs | undefined>(undefined)
  const channelId = ref<number | undefined>(undefined)
  const surveyKind = ref<SurveyKind>('single_question')
  const requiresIdentityVerification = ref(false)

  const steps = computed(() => wizardStepsFor(type))

  const currentStepId = ref<string>(steps.value[0]!.id)

  const currentStepIndex = computed(
    () => steps.value.findIndex((s) => s.id === currentStepId.value),
  )

  const canGoNext = computed(() => {
    if (currentStepId.value === 'title') return title.value.trim().length > 0
    if (currentStepId.value === 'publication') {
      if (visibility.value === 'public') {
        if (!publishedAs.value) return false
        if (publishedAs.value === 'channel' && !channelId.value) return false
      }
      return true
    }
    return true
  })

  function reset() {
    title.value = ''
    categories.value = []
    coverageType.value = 'monde'
    coverageValues.value = [...ALL_CONTINENT_VALUES]
    visibility.value = 'private'
    publishedAs.value = undefined
    channelId.value = undefined
    surveyKind.value = 'single_question'
    requiresIdentityVerification.value = false
    currentStepId.value = steps.value[0]!.id
  }

  function buildPayload(payloadType: ContentType): CreateContentPayload {
    return {
      title: title.value.trim(),
      type: payloadType,
      categories: categories.value,
      coverage_type: coverageType.value,
      coverage_data: coverageValues.value,
      visibility: visibility.value,
      published_as: visibility.value === 'public' ? publishedAs.value : undefined,
      channel_id: publishedAs.value === 'channel' ? channelId.value : undefined,
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
    coverageType,
    coverageValues,
    visibility,
    publishedAs,
    channelId,
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
