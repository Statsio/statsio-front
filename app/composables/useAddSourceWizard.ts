import { ref, computed } from 'vue'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'

export type SourceType = 'file' | 'api' | 'catalog'
export type AuthType = 'none' | 'api_key' | 'bearer'
export type HttpMethod = 'GET' | 'POST'

/** number = a real source_provenances.id, 'other' = free-text website field. */
export type ProvenanceSelection = number | 'other' | null

export const ADD_SOURCE_WIZARD_STEPS: ModalStep[] = [
  { id: 'type', title: 'Type de source', description: 'Choisissez la provenance de vos données' },
  { id: 'configure', title: 'Configuration', description: 'Importez votre fichier ou connectez une API' },
  { id: 'provenance', title: 'Provenance', description: "D'où proviennent vos données ?" },
  { id: 'visibility', title: 'Visibilité', description: 'Privée ou accessible à tous' },
]

export function useAddSourceWizard() {
  const sourceType = ref<SourceType | null>(null)

  // ─── File ────────────────────────────────────────────────────────────────
  const fileObj = ref<File | null>(null)
  const fileName = ref('')

  // ─── API ─────────────────────────────────────────────────────────────────
  const apiForm = ref({
    name: '',
    url: '',
    method: 'GET' as HttpMethod,
    authType: 'none' as AuthType,
    apiKeyHeader: 'X-API-Key',
    apiKeyValue: '',
    bearerToken: '',
    dataPath: '',
  })

  // ─── Provenance ──────────────────────────────────────────────────────────
  const provenanceId = ref<ProvenanceSelection>(null)
  const provenanceOtherLabel = ref('')

  // ─── Visibility ──────────────────────────────────────────────────────────
  const visibility = ref<'private' | 'public'>('private')
  const categories = ref<string[]>([])

  const currentStepId = ref<string>(ADD_SOURCE_WIZARD_STEPS[0].id)

  const canGoNext = computed(() => {
    if (currentStepId.value === 'type') {
      return sourceType.value === 'file' || sourceType.value === 'api'
    }
    if (currentStepId.value === 'configure') {
      if (sourceType.value === 'file') return fileObj.value !== null
      if (sourceType.value === 'api') return !!apiForm.value.name.trim() && !!apiForm.value.url.trim()
      return false
    }
    if (currentStepId.value === 'provenance') {
      if (provenanceId.value === 'other') return provenanceOtherLabel.value.trim().length > 0
      return provenanceId.value !== null
    }
    return true
  })

  function reset() {
    sourceType.value = null
    fileObj.value = null
    fileName.value = ''
    apiForm.value = {
      name: '',
      url: '',
      method: 'GET',
      authType: 'none',
      apiKeyHeader: 'X-API-Key',
      apiKeyValue: '',
      bearerToken: '',
      dataPath: '',
    }
    provenanceId.value = null
    provenanceOtherLabel.value = ''
    visibility.value = 'private'
    categories.value = []
    currentStepId.value = ADD_SOURCE_WIZARD_STEPS[0].id
  }

  function buildMetadataPayload() {
    return {
      visibility: visibility.value,
      categories: visibility.value === 'public' ? categories.value : [],
      provenance_id: typeof provenanceId.value === 'number' ? provenanceId.value : null,
      provenance_other_label: provenanceId.value === 'other' ? provenanceOtherLabel.value.trim() : null,
    }
  }

  function buildApiPayload() {
    const headers: Record<string, string> = {}
    if (apiForm.value.authType === 'api_key' && apiForm.value.apiKeyValue) {
      headers[apiForm.value.apiKeyHeader || 'X-API-Key'] = apiForm.value.apiKeyValue
    }
    if (apiForm.value.authType === 'bearer' && apiForm.value.bearerToken) {
      headers['Authorization'] = `Bearer ${apiForm.value.bearerToken}`
    }

    return {
      name: apiForm.value.name,
      url: apiForm.value.url,
      method: apiForm.value.method,
      auth_type: apiForm.value.authType,
      headers,
      data_path: apiForm.value.dataPath || null,
      ...buildMetadataPayload(),
    }
  }

  return {
    sourceType,
    fileObj,
    fileName,
    apiForm,
    provenanceId,
    provenanceOtherLabel,
    visibility,
    categories,
    currentStepId,
    canGoNext,
    reset,
    buildMetadataPayload,
    buildApiPayload,
  }
}
