import { ref, computed } from 'vue'
import type {
  CoverageType,
  ContentVisibility,
  ContentPublishedAs,
  CreateContentPayload,
} from '@/types/content-creation'
import { ALL_CONTINENT_VALUES } from '@/types/content-creation'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'

export const CONTENT_WIZARD_STEPS: ModalStep[] = [
  { id: 'title',       title: 'Titre',       description: 'Donnez un nom à votre contenu' },
  { id: 'categories',  title: 'Catégories',  description: 'Classifiez votre contenu' },
  { id: 'coverage',    title: 'Couverture',  description: 'Définissez la portée géographique' },
  { id: 'publication', title: 'Publication', description: 'Choisissez la visibilité' },
]

export function useCreateContentWizard() {
  const title = ref('')
  const categories = ref<string[]>([])
  const coverageType = ref<CoverageType>('monde')
  const coverageValues = ref<string[]>([...ALL_CONTINENT_VALUES])
  const visibility = ref<ContentVisibility>('private')
  const publishedAs = ref<ContentPublishedAs | undefined>(undefined)
  const channelId = ref<number | undefined>(undefined)

  const currentStepId = ref<string>(CONTENT_WIZARD_STEPS[0].id)

  const currentStepIndex = computed(
    () => CONTENT_WIZARD_STEPS.findIndex((s) => s.id === currentStepId.value),
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
    currentStepId.value = CONTENT_WIZARD_STEPS[0].id
  }

  function buildPayload(): CreateContentPayload {
    return {
      title: title.value.trim(),
      categories: categories.value,
      coverage_type: coverageType.value,
      coverage_data: coverageValues.value,
      visibility: visibility.value,
      published_as: visibility.value === 'public' ? publishedAs.value : undefined,
      channel_id: publishedAs.value === 'channel' ? channelId.value : undefined,
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
    currentStepId,
    currentStepIndex,
    canGoNext,
    reset,
    buildPayload,
  }
}
