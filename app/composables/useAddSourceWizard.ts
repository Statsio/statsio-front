import { ref, computed } from 'vue'
import type { ModalStep } from '@/components/ui/AppStepModal.vue'
import type { DataSourcePagination, DetectStructureResult, Materialization, PaginationStyle, RefreshFrequency } from '@/api/data-sources'
import { detectApiStructure, mapPaginationToApi } from '@/api/data-sources'

export type SourceType = 'file' | 'api' | 'catalog' | 'datagouv'

/** Base de l'API tabulaire data.gouv.fr — une ressource s'y consulte à `.../resources/{id}/data/`. */
export const DATAGOUV_TABULAR_API_BASE = 'https://tabular-api.data.gouv.fr/api/resources'

/**
 * Accepte soit un identifiant de ressource nu, soit une URL data.gouv.fr / tabular-api collée
 * (page de jeu de données, lien d'API…), et en extrait l'identifiant de ressource.
 */
export function parseDatagouvResourceId(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const fromResourcesPath = trimmed.match(/resources\/([0-9a-f-]{16,})/i)
  if (fromResourcesPath) return fromResourcesPath[1]!.toLowerCase()
  const fromQuery = trimmed.match(/[?&]resource(?:_id)?=([0-9a-f-]{16,})/i)
  if (fromQuery) return fromQuery[1]!.toLowerCase()
  // Fragment "#/resources/{id}" des pages data.gouv.fr, ou UUID isolé.
  const uuidLike = trimmed.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (uuidLike) return uuidLike[1]!.toLowerCase()
  return trimmed
}

/** URL tabular-api complète pour une ressource data.gouv.fr. */
export function datagouvTabularUrl(resourceId: string): string {
  return `${DATAGOUV_TABULAR_API_BASE}/${resourceId}/data/`
}
export type AuthType = 'none' | 'api_key' | 'bearer'
export type HttpMethod = 'GET' | 'POST'

export interface ApiFormPagination {
  style: PaginationStyle
  paramName: string
  paramStart: number
  sizeParam: string
  pageSize: number
  totalPath: string
  totalMode: 'items' | 'pages'
  cursorParam: string
  cursorPath: string
  nextLinkSource: 'body' | 'header'
  nextLinkPath: string
  maxPages: number | null
}

export function defaultPagination(): ApiFormPagination {
  return {
    style: 'none',
    paramName: 'page',
    paramStart: 1,
    sizeParam: '',
    pageSize: 100,
    totalPath: '',
    totalMode: 'items',
    cursorParam: 'cursor',
    cursorPath: 'next_cursor',
    nextLinkSource: 'body',
    nextLinkPath: 'next_page_url',
    maxPages: null,
  }
}

/** number = a real source_provenances.id, 'other' = free-text website field. */
export type ProvenanceSelection = number | 'other' | null

export interface ApiFormShape {
  name: string
  url: string
  method: HttpMethod
  authType: AuthType
  apiKeyHeader: string
  apiKeyValue: string
  bearerToken: string
  dataPath: string
  refreshFrequency: RefreshFrequency
  pagination: ApiFormPagination
  materialization: Materialization
}

export const ADD_SOURCE_WIZARD_STEPS: ModalStep[] = [
  { id: 'type', title: 'Type de source', description: 'Choisissez la provenance de vos données' },
  { id: 'detect', title: 'Détection', description: "Connectez votre API pour pré-remplir la configuration" },
  { id: 'configure', title: 'Configuration', description: 'Importez votre fichier ou connectez une API' },
  { id: 'provenance', title: 'Provenance', description: "D'où proviennent vos données ?" },
  { id: 'visibility', title: 'Visibilité', description: 'Privée ou accessible à tous' },
]

/** Construit les headers d'authentification à partir du formulaire API — partagé entre détection, test de connexion et soumission. */
export function apiFormAuthHeaders(apiForm: Pick<ApiFormShape, 'authType' | 'apiKeyHeader' | 'apiKeyValue' | 'bearerToken'>): Record<string, string> {
  const headers: Record<string, string> = {}
  if (apiForm.authType === 'api_key' && apiForm.apiKeyValue) {
    headers[apiForm.apiKeyHeader || 'X-API-Key'] = apiForm.apiKeyValue
  }
  if (apiForm.authType === 'bearer' && apiForm.bearerToken) {
    headers['Authorization'] = `Bearer ${apiForm.bearerToken}`
  }
  return headers
}

function mergeDetectedPagination(pagination: DataSourcePagination | undefined): ApiFormPagination {
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

/**
 * Détection auto de la structure d'une API REST — partagée entre l'étape dédiée du wizard
 * de création (StepApiDetect) et le bouton de re-détection en édition (StepSourceConfigure).
 * `getApiForm`/`setApiForm` plutôt qu'un Ref : les composants appelants exposent apiForm via
 * un prop + un emit `update:apiForm`, pas une ref locale.
 */
export function useApiStructureDetection(getApiForm: () => ApiFormShape, setApiForm: (patch: Partial<ApiFormShape>) => void) {
  const detectStatus = ref<'idle' | 'loading' | 'detected' | 'error'>('idle')
  const detectResult = ref<DetectStructureResult | null>(null)
  const detectError = ref('')

  async function runDetection() {
    const apiForm = getApiForm()
    if (!apiForm.url) return
    detectStatus.value = 'loading'
    detectError.value = ''
    detectResult.value = null

    try {
      const result = await detectApiStructure(apiForm.url.trim(), apiFormAuthHeaders(apiForm))
      detectResult.value = result

      if (result.partial) {
        detectStatus.value = 'error'
        detectError.value = result.message
          ?? (result.reason === 'no_records_array_found'
            ? "Aucun tableau d'enregistrements n'a été trouvé dans la réponse."
            : "La détection n'a pas pu aboutir complètement — vérifiez la configuration manuellement.")
        if (result.method) setApiForm({ method: result.method })
        return
      }

      detectStatus.value = 'detected'
      setApiForm({
        method: result.method,
        dataPath: result.dataPath ?? '',
        pagination: mergeDetectedPagination(result.pagination),
      })
    } catch (e: unknown) {
      detectStatus.value = 'error'
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      detectError.value = msg ?? "Impossible d'analyser cette API. Vérifiez l'URL ou configurez manuellement."
    }
  }

  function resetDetection() {
    detectStatus.value = 'idle'
    detectResult.value = null
    detectError.value = ''
  }

  return { detectStatus, detectResult, detectError, runDetection, resetDetection }
}

export function useAddSourceWizard() {
  const sourceType = ref<SourceType | null>(null)

  // ─── File ────────────────────────────────────────────────────────────────
  const fileObj = ref<File | null>(null)
  const fileName = ref('')
  /** xlsx/xls uniquement — feuille et ligne d'en-têtes choisies via l'aperçu (StepSourceConfigure). */
  const sheetName = ref<string | null>(null)
  const headerRow = ref<number | null>(null)
  const excludedRows = ref<number[]>([])

  // ─── API ─────────────────────────────────────────────────────────────────
  const apiForm = ref<ApiFormShape>({
    name: '',
    url: '',
    method: 'GET' as HttpMethod,
    authType: 'none' as AuthType,
    apiKeyHeader: 'X-API-Key',
    apiKeyValue: '',
    bearerToken: '',
    dataPath: '',
    refreshFrequency: 'none' as RefreshFrequency,
    pagination: defaultPagination(),
    materialization: 'snapshot' as Materialization,
  })

  // ─── data.gouv.fr (raccourci : l'utilisateur ne saisit qu'un identifiant de ressource,
  //     la configuration API tabular-api est pré-remplie automatiquement) ──────
  const datagouvInput = ref('')
  const datagouvName = ref('')
  const datagouvResourceId = computed(() => parseDatagouvResourceId(datagouvInput.value))

  /**
   * Pré-remplit `apiForm` à partir de l'identifiant de ressource data.gouv.fr saisi :
   * l'API tabulaire renvoie `{ data: [...], links: { next } }`, d'où l'enveloppe `data`
   * et la pagination « lien suivant ». Appelé au moment de quitter l'étape « Type ».
   */
  function applyDatagouvPreset() {
    const resourceId = datagouvResourceId.value
    apiForm.value = {
      ...apiForm.value,
      name: datagouvName.value.trim() || `Ressource data.gouv.fr ${resourceId.slice(0, 8)}`,
      url: datagouvTabularUrl(resourceId),
      method: 'GET',
      authType: 'none',
      apiKeyHeader: 'X-API-Key',
      apiKeyValue: '',
      bearerToken: '',
      dataPath: 'data',
      materialization: 'snapshot',
      refreshFrequency: 'none',
      pagination: {
        ...defaultPagination(),
        style: 'next_link',
        nextLinkSource: 'body',
        nextLinkPath: 'links.next',
        // tabular-api plafonne page_size à 200 ; le lien "next" renvoyé conserve ensuite ce paramètre.
        sizeParam: 'page_size',
        pageSize: 200,
        // Ressource potentiellement volumineuse : on relève le plafond de pages
        // (borné côté serveur par max_pages_hard_cap / max_rows / time_budget).
        maxPages: 500,
      },
    }
  }

  // ─── Provenance ──────────────────────────────────────────────────────────
  const provenanceId = ref<ProvenanceSelection>(null)
  const provenanceOtherLabel = ref('')

  // ─── Visibility ──────────────────────────────────────────────────────────
  const visibility = ref<'private' | 'public'>('private')
  const categories = ref<string[]>([])

  const currentStepId = ref<string>(ADD_SOURCE_WIZARD_STEPS[0]!.id)

  const canGoNext = computed(() => {
    if (currentStepId.value === 'type') {
      if (sourceType.value === 'file' || sourceType.value === 'api') return true
      if (sourceType.value === 'datagouv') return datagouvResourceId.value.length >= 16
      return false
    }
    if (currentStepId.value === 'detect') {
      return !!apiForm.value.url.trim()
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
    sheetName.value = null
    headerRow.value = null
    excludedRows.value = []
    apiForm.value = {
      name: '',
      url: '',
      method: 'GET',
      authType: 'none',
      apiKeyHeader: 'X-API-Key',
      apiKeyValue: '',
      bearerToken: '',
      dataPath: '',
      refreshFrequency: 'none',
      pagination: defaultPagination(),
      materialization: 'snapshot',
    }
    datagouvInput.value = ''
    datagouvName.value = ''
    provenanceId.value = null
    provenanceOtherLabel.value = ''
    visibility.value = 'private'
    categories.value = []
    currentStepId.value = ADD_SOURCE_WIZARD_STEPS[0]!.id
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

    const isLive = apiForm.value.materialization === 'live'

    return {
      name: apiForm.value.name,
      url: apiForm.value.url,
      method: apiForm.value.method,
      auth_type: apiForm.value.authType,
      headers,
      data_path: apiForm.value.dataPath || null,
      pagination: mapPaginationToApi(apiForm.value.pagination),
      materialization: apiForm.value.materialization,
      // Une source live n'a pas de cycle de re-fetch (les données sont toujours
      // à jour) — refresh_frequency n'est envoyé que pour le mode snapshot.
      ...(isLive ? {} : { refresh_frequency: apiForm.value.refreshFrequency }),
      ...buildMetadataPayload(),
    }
  }

  return {
    sourceType,
    fileObj,
    fileName,
    sheetName,
    headerRow,
    excludedRows,
    apiForm,
    datagouvInput,
    datagouvName,
    datagouvResourceId,
    applyDatagouvPreset,
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
