import { nextTick, type Ref } from 'vue'
import {
  buildStatsDataApiSourceWriteBody,
  createStatsDataSource,
  deleteStatsDataSource,
  executeStatsDataQuery as executeStatsDataQueryApi,
  listStatsDataSources,
  probeSourceApiConnection,
  refreshStatsDataSourceDataset as refreshStatsDataSourceDatasetApi,
  normalizationMappingPatchPayload,
  updateStatsDataSource as patchStatsDataSourceApi,
  uploadStatsDataSourceFile as postStatsDataSourceFileUpload,
  type StatsDataUpdateSourcePayload,
} from '@/api/statsdata-sources'
import { formatApiErrorDetail } from '@/lib/http-errors'
import { studioDataSourceFromApi, studioDataSourcesFromApiList } from '@/lib/statsdata-source-mapper'
import type { StatsDataNormalizationMapping } from '@/types/statsdata-query'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import type { StudioBlock, StudioPage } from '@/types/studio-document'
import type { StudioDataSource, StudioDataSourceApi } from '@/types/studio-data-source'

export type SourcesFeedback = { kind: 'success' | 'error'; text: string }

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const dataSourceSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()

type StudioState = {
  isCreate: Ref<boolean>
  isStatsDataRemote: Ref<boolean>
  statsDataDocumentId: Ref<string | null>
  loadState: Ref<'idle' | 'loading' | 'ready' | 'error'>
  pages: Ref<StudioPage[]>
  dataSources: Ref<StudioDataSource[]>
  suppressDataSourcesDirty: Ref<number>
  sourcesBusy: Ref<boolean>
  sourcesFeedback: Ref<SourcesFeedback | null>
}

export function useStudioSourcesApi(args: {
  state: StudioState
  toastSuccess: (text: string, title?: string) => void
  toastError: (text: string, title?: string) => void
}) {
  const { state, toastSuccess, toastError } = args

  const setSourcesFeedback = (kind: SourcesFeedback['kind'], text: string) => {
    state.sourcesFeedback.value = { kind, text }
    if (kind === 'success') {
      window.setTimeout(() => {
        if (state.sourcesFeedback.value?.text === text) state.sourcesFeedback.value = null
      }, 5000)
    }
  }

  const sourcesFeedbackWithToast = (kind: SourcesFeedback['kind'], text: string, toastTitle?: string) => {
    setSourcesFeedback(kind, text)
    if (kind === 'success') toastSuccess(text, toastTitle)
    else toastError(text, toastTitle)
  }

  const loadRemoteSourcesList = async (documentId: string) => {
    try {
      const raw = await listStatsDataSources(documentId)
      state.suppressDataSourcesDirty.value++
      state.dataSources.value = studioDataSourcesFromApiList(raw)
      await nextTick()
      state.suppressDataSourcesDirty.value--
    } catch (e) {
      state.suppressDataSourcesDirty.value = Math.max(0, state.suppressDataSourcesDirty.value - 1)
      setSourcesFeedback('error', formatApiErrorDetail(e, 'Impossible de charger les sources.'))
    }
  }

  const pushSourcePatch = async (documentId: string, sourceId: string, body: StatsDataUpdateSourcePayload) => {
    const rawUnknown = await patchStatsDataSourceApi(documentId, sourceId, body)
    let mapped = studioDataSourceFromApi(rawUnknown)
    if (!mapped) {
      await loadRemoteSourcesList(documentId)
      return
    }
    if (isRecord(rawUnknown)) {
      const prev = state.dataSources.value.find((s) => s.id === sourceId)
      const r = rawUnknown
      if (prev) {
        const hasNorm =
          Object.prototype.hasOwnProperty.call(r, 'normalizationMapping') ||
          Object.prototype.hasOwnProperty.call(r, 'normalization_mapping')
        if (!hasNorm && prev.normalizationMapping !== undefined) {
          mapped = { ...mapped, normalizationMapping: prev.normalizationMapping } as StudioDataSource
        }
        const hasSnap =
          Object.prototype.hasOwnProperty.call(r, 'lastSnapshot') ||
          Object.prototype.hasOwnProperty.call(r, 'last_snapshot')
        if (!hasSnap && prev.lastSnapshot !== undefined) {
          mapped = { ...mapped, lastSnapshot: prev.lastSnapshot } as StudioDataSource
        }
      }
    }
    state.suppressDataSourcesDirty.value++
    state.dataSources.value = state.dataSources.value.map((s) => (s.id === sourceId ? mapped : s))
    await nextTick()
    state.suppressDataSourcesDirty.value--
  }

  const syncDataSourceToServer = async (source: StudioDataSource) => {
    const docId = state.statsDataDocumentId.value
    if (!state.isStatsDataRemote.value || !docId || state.loadState.value !== 'ready') return
    const latest = state.dataSources.value.find((s) => s.id === source.id) ?? source
    state.sourcesBusy.value = true
    try {
      const normPatch =
        latest.normalizationMapping !== undefined
          ? normalizationMappingPatchPayload(latest.normalizationMapping)
          : ({} as Partial<StatsDataUpdateSourcePayload>)
      if (latest.kind === 'manual') {
        await pushSourcePatch(docId, latest.id, { name: latest.name, manualData: { rows: latest.rows }, ...normPatch })
      } else if (latest.kind === 'api') {
        await pushSourcePatch(docId, latest.id, { ...buildStatsDataApiSourceWriteBody(latest), ...normPatch })
      } else if (latest.kind === 'file') {
        await pushSourcePatch(docId, latest.id, { name: latest.name, ...normPatch })
      }
      sourcesFeedbackWithToast('success', 'Source enregistrée sur le serveur.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Mise à jour de la source impossible.'), 'Sources')
    } finally {
      state.sourcesBusy.value = false
    }
  }

  const scheduleDataSourceSync = (source: StudioDataSource) => {
    const docId = state.statsDataDocumentId.value
    if (!state.isStatsDataRemote.value || !docId || state.isCreate.value) return
    const id = source.id
    const prev = dataSourceSyncTimers.get(id)
    if (prev) clearTimeout(prev)
    const t = setTimeout(() => {
      dataSourceSyncTimers.delete(id)
      const cur = state.dataSources.value.find((s) => s.id === id)
      if (cur) void syncDataSourceToServer(cur)
    }, 700)
    dataSourceSyncTimers.set(id, t)
  }

  const clearDataSourceSyncTimer = (sourceId: string) => {
    const t = dataSourceSyncTimers.get(sourceId)
    if (t) clearTimeout(t)
    dataSourceSyncTimers.delete(sourceId)
  }

  const probeApiSource = async (source: StudioDataSourceApi) => {
    const latest = state.dataSources.value.find((s): s is StudioDataSourceApi => s.id === source.id && s.kind === 'api')
    const s = latest ?? source
    const url = s.url?.trim() ?? ''
    if (!url) {
      sourcesFeedbackWithToast('error', 'Indiquez une URL avant de tester.', 'Connexion API')
      return
    }
    state.sourcesBusy.value = true
    try {
      const raw = await probeSourceApiConnection({ url, apiKey: s.apiKeyPreview?.trim() || null })
      let inner: Record<string, unknown> = {}
      if (isRecord(raw)) inner = isRecord(raw.data) ? (raw.data as Record<string, unknown>) : raw
      const ok = inner.ok === true
      const sc = inner.statusCode
      const fmt = inner.responseFormat
      const detail = [typeof sc === 'number' ? `HTTP ${sc}` : null, typeof fmt === 'string' ? fmt : null]
        .filter(Boolean)
        .join(' · ')
      sourcesFeedbackWithToast(
        ok ? 'success' : 'error',
        ok ? `Connexion OK${detail ? ` (${detail})` : ''}.` : `Échec du test${detail ? ` (${detail})` : ''}.`,
        'Connexion API',
      )
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Test de connexion impossible.'), 'Connexion API')
    } finally {
      state.sourcesBusy.value = false
    }
  }

  const addDataSource = async (source: StudioDataSource) => {
    if (!state.isStatsDataRemote.value || state.isCreate.value || state.loadState.value !== 'ready') {
      state.dataSources.value = [...state.dataSources.value, source]
      return
    }
    const docId = state.statsDataDocumentId.value
    if (!docId) {
      sourcesFeedbackWithToast(
        'error',
        'Enregistrez d’abord le document (bouton Enregistrer) pour obtenir un identifiant.',
        'Sources',
      )
      return
    }
    if (source.kind === 'file') {
      sourcesFeedbackWithToast('error', 'Utilisez « Importer un fichier » pour envoyer un fichier.', 'Sources')
      return
    }

    state.sourcesBusy.value = true
    try {
      let raw: unknown
      if (source.kind === 'manual') {
        raw = await createStatsDataSource(docId, { type: 'manual', name: source.name, manualData: { rows: source.rows } })
      } else {
        const u = source.url.trim()
        const k = source.apiKeyPreview.trim()
        raw = await createStatsDataSource(docId, {
          type: 'api',
          name: source.name,
          apiUrl: u,
          api_url: u,
          apiKey: k.length > 0 ? k : null,
          api_key: k.length > 0 ? k : null,
          verify: false,
        })
      }
      const mapped = studioDataSourceFromApi(raw)
      if (!mapped) throw new Error('Réponse source invalide')
      state.suppressDataSourcesDirty.value++
      state.dataSources.value = [...state.dataSources.value, mapped]
      await nextTick()
      state.suppressDataSourcesDirty.value--
      sourcesFeedbackWithToast('success', 'Source créée.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Création de la source impossible.'), 'Sources')
    } finally {
      state.sourcesBusy.value = false
    }
  }

  const uploadDataSourceFile = async (file: File, displayName?: string) => {
    if (!state.isStatsDataRemote.value || state.isCreate.value || state.loadState.value !== 'ready') {
      sourcesFeedbackWithToast('error', 'Enregistrez le document avant d’importer un fichier.', 'Sources')
      return
    }
    const docId = state.statsDataDocumentId.value
    if (!docId) {
      sourcesFeedbackWithToast('error', 'Document introuvable.', 'Sources')
      return
    }
    const name = displayName?.trim() || file.name || 'Import fichier'
    state.sourcesBusy.value = true
    try {
      const raw = await postStatsDataSourceFileUpload(docId, name, file)
      const mapped = studioDataSourceFromApi(raw)
      if (!mapped) throw new Error('Réponse source fichier invalide')
      state.suppressDataSourcesDirty.value++
      state.dataSources.value = [...state.dataSources.value, mapped]
      await nextTick()
      state.suppressDataSourcesDirty.value--
      sourcesFeedbackWithToast('success', 'Fichier importé.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Import fichier impossible.'), 'Sources')
    } finally {
      state.sourcesBusy.value = false
    }
  }

  const removeDataSource = async (id: string) => {
    const docId = state.statsDataDocumentId.value
    if (state.isStatsDataRemote.value && docId && state.loadState.value === 'ready') {
      state.sourcesBusy.value = true
      try {
        await deleteStatsDataSource(docId, id)
        sourcesFeedbackWithToast('success', 'Source supprimée.', 'Sources')
      } catch (e) {
        sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Suppression impossible sur le serveur.'), 'Sources')
        state.sourcesBusy.value = false
        return
      } finally {
        state.sourcesBusy.value = false
      }
    }
    clearDataSourceSyncTimer(id)
    state.dataSources.value = state.dataSources.value.filter((s) => s.id !== id)
    // Nettoyer les références à cette source dans tous les blocs de toutes les pages
    state.pages.value = state.pages.value.map((page) => ({
      ...page,
      blocks: page.blocks.map((b) => {
        if ((b.type === 'chart' || b.type === 'table') && b.dataBinding.sourceId === id) {
          return { ...b, dataBinding: { ...b.dataBinding, sourceId: '' } }
        }
        return b
      })
    }))
  }

  const dismissSourcesFeedback = () => {
    state.sourcesFeedback.value = null
  }

  const executeStatsDataDocumentQuery = async (body: StatsDataAnyQueryRequest) => {
    const docId = state.statsDataDocumentId.value
    if (!docId) return []
    return executeStatsDataQueryApi(docId, body)
  }

  const persistSourceNormalizationMapping = async (sourceId: string, mapping: StatsDataNormalizationMapping | null) => {
    const docId = state.statsDataDocumentId.value
    if (!state.isStatsDataRemote.value || !docId || state.loadState.value !== 'ready') return
    state.sourcesBusy.value = true
    try {
      await pushSourcePatch(docId, sourceId, { ...normalizationMappingPatchPayload(mapping) } as StatsDataUpdateSourcePayload)
      sourcesFeedbackWithToast('success', 'Mapping enregistré sur le serveur.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Enregistrement du mapping impossible.'), 'Sources')
      throw e
    } finally {
      state.sourcesBusy.value = false
    }
  }

  const refreshNormalizedSource = async (sourceId: string) => {
    const docId = state.statsDataDocumentId.value
    if (!state.isStatsDataRemote.value || !docId || state.loadState.value !== 'ready') return
    state.sourcesBusy.value = true
    try {
      const result = await refreshStatsDataSourceDatasetApi(docId, sourceId)
      if (result.status === 'failed') {
        sourcesFeedbackWithToast('error', result.errorMessage?.trim() || 'Le refresh s’est terminé en échec.', 'Sources')
      } else {
        sourcesFeedbackWithToast(
          'success',
          `Données actualisées${typeof result.rowCount === 'number' ? ` (${result.rowCount} ligne(s))` : ''}.`,
          'Sources',
        )
      }
      await loadRemoteSourcesList(docId)
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Actualisation impossible.'), 'Sources')
    } finally {
      state.sourcesBusy.value = false
    }
  }

  return {
    setSourcesFeedback,
    loadRemoteSourcesList,
    scheduleDataSourceSync,
    syncDataSourceToServer,
    probeApiSource,
    addDataSource,
    uploadDataSourceFile,
    removeDataSource,
    dismissSourcesFeedback,
    executeStatsDataDocumentQuery,
    refreshNormalizedSource,
    persistSourceNormalizationMapping,
  }
}

