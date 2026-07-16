import { ref, computed } from 'vue'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'
import type { DataSourceDetail, DataSourcePagination, RefreshFrequency, UpdateDataSourcePayload } from '@/api/data-sources'
import { mapPaginationToApi } from '@/api/data-sources'
import type { ApiFormPagination, AuthType, HttpMethod, ProvenanceSelection, SourceType } from '@/composables/useAddSourceWizard'
import { defaultPagination } from '@/composables/useAddSourceWizard'

export const EDIT_SOURCE_WIZARD_STEPS: ModalStep[] = [
  { id: 'configure', title: 'Configuration', description: 'Nom, fichier ou connexion' },
  { id: 'provenance', title: 'Provenance', description: "D'où proviennent vos données ?" },
  { id: 'visibility', title: 'Visibilité', description: 'Privée ou accessible à tous' },
]

export function useEditSourceWizard(source: DataSourceDetail) {
  const sourceType: SourceType = source.sourceKind === 'api' ? 'api' : 'file'

  // ─── Configure ───────────────────────────────────────────────────────────
  const name = ref(source.name)
  const newFileObj = ref<File | null>(null)

  const apiForm = ref({
    name: source.name,
    url: source.apiConfig?.url ?? '',
    method: (source.apiConfig?.method ?? 'GET') as HttpMethod,
    authType: (source.apiConfig?.authType ?? 'none') as AuthType,
    apiKeyHeader: Object.keys(source.apiConfig?.headers ?? {})[0] ?? 'X-API-Key',
    apiKeyValue: source.apiConfig?.authType === 'api_key' ? Object.values(source.apiConfig.headers ?? {})[0] ?? '' : '',
    bearerToken: source.apiConfig?.authType === 'bearer'
      ? (Object.values(source.apiConfig.headers ?? {})[0] ?? '').replace(/^Bearer\s+/i, '')
      : '',
    dataPath: source.apiConfig?.dataPath ?? '',
    refreshFrequency: source.refreshFrequency as RefreshFrequency,
    pagination: toApiFormPagination(source.apiConfig?.pagination),
    // Non modifiable après création (voir StepSourceConfigure) — passé tel quel pour l'affichage.
    materialization: source.materialization,
  })

  const existingFileLabel = source.originalFilename
    ? `${source.originalFilename}${source.fileSizeBytes ? ` · ${formatBytes(source.fileSizeBytes)}` : ''}`
    : undefined

  // ─── Provenance ──────────────────────────────────────────────────────────
  const provenanceId = ref<ProvenanceSelection>(
    source.provenance ? source.provenance.id : (source.provenanceOtherLabel ? 'other' : null),
  )
  const provenanceOtherLabel = ref(source.provenanceOtherLabel ?? '')

  // ─── Visibility ──────────────────────────────────────────────────────────
  const visibility = ref<'private' | 'public'>(source.visibility)
  const categories = ref<string[]>(source.categories ?? [])

  const currentStepId = ref<string>(EDIT_SOURCE_WIZARD_STEPS[0].id)

  const canGoNext = computed(() => {
    if (currentStepId.value === 'configure') {
      if (sourceType === 'api') return !!apiForm.value.name.trim() && !!apiForm.value.url.trim()
      return !!name.value.trim()
    }
    if (currentStepId.value === 'provenance') {
      if (provenanceId.value === 'other') return provenanceOtherLabel.value.trim().length > 0
      return provenanceId.value !== null
    }
    return true
  })

  function buildPayload(): UpdateDataSourcePayload {
    const payload: UpdateDataSourcePayload = {
      name: sourceType === 'api' ? apiForm.value.name.trim() : name.value.trim(),
      visibility: visibility.value,
      categories: visibility.value === 'public' ? categories.value : [],
      provenance_id: typeof provenanceId.value === 'number' ? provenanceId.value : null,
      provenance_other_label: provenanceId.value === 'other' ? provenanceOtherLabel.value.trim() : null,
    }

    if (sourceType === 'api') {
      const headers: Record<string, string> = {}
      if (apiForm.value.authType === 'api_key' && apiForm.value.apiKeyValue) {
        headers[apiForm.value.apiKeyHeader || 'X-API-Key'] = apiForm.value.apiKeyValue
      }
      if (apiForm.value.authType === 'bearer' && apiForm.value.bearerToken) {
        headers['Authorization'] = `Bearer ${apiForm.value.bearerToken}`
      }

      payload.url = apiForm.value.url
      payload.method = apiForm.value.method
      payload.auth_type = apiForm.value.authType
      payload.headers = headers
      payload.data_path = apiForm.value.dataPath || null
      payload.pagination = mapPaginationToApi(apiForm.value.pagination)
      if (apiForm.value.materialization !== 'live') {
        payload.refresh_frequency = apiForm.value.refreshFrequency
      }
    }

    return payload
  }

  return {
    sourceType,
    name,
    newFileObj,
    apiForm,
    existingFileLabel,
    provenanceId,
    provenanceOtherLabel,
    visibility,
    categories,
    currentStepId,
    canGoNext,
    buildPayload,
  }
}

function toApiFormPagination(pagination: DataSourcePagination | undefined): ApiFormPagination {
  const defaults = defaultPagination()
  if (!pagination) return defaults

  return {
    style: pagination.style ?? defaults.style,
    paramName: pagination.paramName ?? defaults.paramName,
    paramStart: pagination.paramStart ?? defaults.paramStart,
    sizeParam: pagination.sizeParam ?? defaults.sizeParam,
    pageSize: pagination.pageSize ?? defaults.pageSize,
    totalPath: pagination.totalPath ?? defaults.totalPath,
    totalMode: pagination.totalMode ?? defaults.totalMode,
    cursorParam: pagination.cursorParam ?? defaults.cursorParam,
    cursorPath: pagination.cursorPath ?? defaults.cursorPath,
    nextLinkSource: pagination.nextLinkSource ?? defaults.nextLinkSource,
    nextLinkPath: pagination.nextLinkPath ?? defaults.nextLinkPath,
    maxPages: pagination.maxPages ?? defaults.maxPages,
  }
}

function formatBytes(bytes: number): string {
  if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mo`
  return `${(bytes / 1024).toFixed(0)} Ko`
}
