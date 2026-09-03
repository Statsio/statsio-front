import { ref, computed } from 'vue'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'
import type { DataSourceDetail, DataSourcePagination, QueryMapping, RefreshFrequency, UpdateDataSourcePayload } from '@/api/data-sources'
import { mapPaginationToApi, mapQueryMappingToApi } from '@/api/data-sources'
import type { ApiFormPagination, AuthType, HttpMethod, ProvenanceSelection, SourceType } from '@/composables/useAddSourceWizard'
import { defaultPagination } from '@/composables/useAddSourceWizard'

export const EDIT_SOURCE_WIZARD_STEPS: ModalStep[] = [
  { id: 'configure', title: 'Configuration', description: 'Nom, fichier ou connexion' },
  { id: 'synchronisation', title: 'Synchronisation', description: 'Fréquence de resynchronisation' },
  { id: 'provenance', title: 'Provenance', description: "D'où proviennent vos données ?" },
  { id: 'visibility', title: 'Visibilité', description: 'Privée ou accessible à tous' },
]

export function useEditSourceWizard(source: DataSourceDetail) {
  const sourceType: SourceType = source.sourceKind === 'api' ? 'api' : 'file'

  // ─── Configure ───────────────────────────────────────────────────────────
  const name = ref(source.name)
  const newFileObj = ref<File | null>(null)
  /** xlsx/xls uniquement — reconfigurées via l'aperçu quand un nouveau fichier est choisi. */
  const sheetName = ref<string | null>(source.sheetName ?? null)
  const headerRow = ref<number | null>(source.headerRow ?? null)
  const excludedRows = ref<number[]>(source.excludedRows ?? [])

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

  // ─── Configuration avancée (query_mapping) ──────────────────────────────────
  // Corrige/complète la détection automatique pour une source "live" — recherche, tri,
  // filtres que le sondage n'a pas su deviner. Fusionné côté backend par-dessus la
  // détection lors de la sauvegarde (voir CreateLiveApiDataSourceAction::reconfigure()).
  // Non touché par défaut : `query_mapping` n'est envoyé que si l'utilisateur édite
  // effectivement cette section, pour ne pas déclencher un re-sondage à chaque
  // enregistrement (nom, visibilité...) sans rapport.
  const queryMappingOverride = ref<QueryMapping>(source.queryMapping ?? {
    countPath: null,
    maxPageSize: null,
    filters: {},
    sortableColumns: [],
    supportsDistinct: false,
    supportsJoins: false,
    supportsAggregate: false,
    searchParam: null,
    sortParam: null,
    sortDirectionParam: null,
    probeTruncated: false,
  })
  const queryMappingTouched = ref(false)

  function setFilterParam(column: string, param: string) {
    queryMappingTouched.value = true
    if (param.trim()) {
      queryMappingOverride.value.filters[column] = { param: param.trim(), operators: ['eq'] }
    } else {
      delete queryMappingOverride.value.filters[column]
    }
  }

  /** Filtre de plage (bornes min/max, ex. `prix__greater`/`prix__less`) — remplace tout mapping d'égalité existant sur cette colonne. */
  function setFilterRange(column: string, gteParam: string, lteParam: string) {
    queryMappingTouched.value = true
    if (gteParam.trim() && lteParam.trim()) {
      queryMappingOverride.value.filters[column] = {
        range: { gteParam: gteParam.trim(), lteParam: lteParam.trim() },
        operators: ['gte', 'lte'],
      }
    } else {
      delete queryMappingOverride.value.filters[column]
    }
  }

  function toggleSortableColumn(column: string, sortable: boolean) {
    queryMappingTouched.value = true
    const cols = new Set(queryMappingOverride.value.sortableColumns)
    if (sortable) cols.add(column)
    else cols.delete(column)
    queryMappingOverride.value.sortableColumns = Array.from(cols)
  }

  function setSearchParam(value: string) {
    queryMappingTouched.value = true
    queryMappingOverride.value.searchParam = value.trim() || null
  }

  function setSortParam(value: string) {
    queryMappingTouched.value = true
    queryMappingOverride.value.sortParam = value.trim() || null
  }

  function setSortDirectionParam(value: string) {
    queryMappingTouched.value = true
    queryMappingOverride.value.sortDirectionParam = value.trim() || null
  }

  // ─── Provenance ──────────────────────────────────────────────────────────
  const provenanceId = ref<ProvenanceSelection>(
    source.provenance ? source.provenance.id : (source.provenanceOtherLabel ? 'other' : null),
  )
  const provenanceOtherLabel = ref(source.provenanceOtherLabel ?? '')

  // ─── Visibility ──────────────────────────────────────────────────────────
  const visibility = ref<'private' | 'public'>(source.visibility)
  const categories = ref<string[]>(source.categories ?? [])

  const currentStepId = ref<string>(EDIT_SOURCE_WIZARD_STEPS[0]!.id)

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
      if (queryMappingTouched.value) {
        payload.query_mapping = mapQueryMappingToApi(queryMappingOverride.value)
      }
    }

    if (sourceType === 'file' && newFileObj.value) {
      payload.sheet_name = sheetName.value
      payload.header_row = headerRow.value
      payload.excluded_rows = excludedRows.value
    }

    return payload
  }

  return {
    sourceType,
    name,
    newFileObj,
    sheetName,
    headerRow,
    excludedRows,
    apiForm,
    existingFileLabel,
    queryMappingOverride,
    setFilterParam,
    setFilterRange,
    toggleSortableColumn,
    setSearchParam,
    setSortParam,
    setSortDirectionParam,
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
