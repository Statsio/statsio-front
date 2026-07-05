import { ref, computed } from 'vue'
import type { ChannelCategory, CreateChannelPayload } from '@/api/channels'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'

export const CHANNEL_WIZARD_STEPS: ModalStep[] = [
  { id: 'identity',  title: 'Identité',   description: 'Nommez votre chaîne et choisissez son identifiant' },
  { id: 'editorial', title: 'Éditorial',  description: 'Décrivez votre ligne éditoriale' },
  { id: 'visuals',   title: 'Visuels',    description: 'Personnalisez l\'apparence de votre chaîne' },
  { id: 'legal',     title: 'Conditions', description: 'Acceptez les conditions pour publier' },
]

export function useCreateChannelWizard() {
  const name = ref('')
  const handle = ref('')
  const handleAvailable = ref<boolean | null>(null)
  const description = ref('')
  const categories = ref<ChannelCategory[]>([])
  const logo = ref<File | null>(null)
  const banner = ref<File | null>(null)
  const primaryColor = ref('#8b5cf6')
  const accentColor = ref('#3b82f6')
  const agreements = ref({ rgpd: false, publicVisibility: false, termsOfService: false })

  const currentStepId = ref<string>(CHANNEL_WIZARD_STEPS[0]!.id)

  const currentStepIndex = computed(
    () => CHANNEL_WIZARD_STEPS.findIndex((s) => s.id === currentStepId.value),
  )

  const canGoNext = computed(() => {
    if (currentStepId.value === 'identity') {
      return name.value.trim().length > 0 && handleAvailable.value === true
    }
    if (currentStepId.value === 'editorial') {
      return description.value.trim().length > 0 && categories.value.length > 0
    }
    if (currentStepId.value === 'legal') {
      return agreements.value.rgpd && agreements.value.publicVisibility && agreements.value.termsOfService
    }
    return true
  })

  function reset() {
    name.value = ''
    handle.value = ''
    handleAvailable.value = null
    description.value = ''
    categories.value = []
    logo.value = null
    banner.value = null
    primaryColor.value = '#8b5cf6'
    accentColor.value = '#3b82f6'
    agreements.value = { rgpd: false, publicVisibility: false, termsOfService: false }
    currentStepId.value = CHANNEL_WIZARD_STEPS[0]!.id
  }

  function buildPayload(): CreateChannelPayload {
    return {
      name: name.value.trim(),
      handle: handle.value.trim(),
      description: description.value.trim(),
      categories: categories.value,
      logo: logo.value ?? undefined,
      banner: banner.value ?? undefined,
      custom_color_primary: primaryColor.value,
      custom_color_secondary: accentColor.value,
    }
  }

  return {
    name,
    handle,
    handleAvailable,
    description,
    categories,
    logo,
    banner,
    primaryColor,
    accentColor,
    agreements,
    currentStepId,
    currentStepIndex,
    canGoNext,
    reset,
    buildPayload,
  }
}
