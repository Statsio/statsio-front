import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useIntervalFn } from '@vueuse/core'
import {
  createStatsDataDocument,
  deleteStatsDataDocument,
  fetchStatsDataDocument,
  updateStatsDataDocument,
} from '@/api/statsdata-documents'
import {
  buildStatsDataApiSourceWriteBody,
  createStatsDataSource,
  deleteStatsDataSource,
  listStatsDataSources,
  probeSourceApiConnection,
  updateStatsDataSource as patchStatsDataSourceApi,
  uploadStatsDataSourceFile as postStatsDataSourceFileUpload,
  type StatsDataUpdateSourcePayload,
} from '@/api/statsdata-sources'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { formatApiErrorDetail } from '@/lib/http-errors'
import { studioDataSourceFromApi, studioDataSourcesFromApiList } from '@/lib/statsdata-source-mapper'
import {
  cloneBlock,
  createEmptyBlock,
  type StudioBlock,
  type StudioBlockType,
  type StudioDocumentKind,
  type StudioDocumentSettings,
} from '@/types/studio-document'
import type { StatsDataDocumentDto, StatsDataDocumentWritePayload } from '@/types/statsdata-document-api'
import type { StudioDataSource, StudioDataSourceApi, StudioDataSourceManual } from '@/types/studio-data-source'

export type SaveDocumentOptions = {
  syncMode?: 'full' | 'minimal'
  /** Par défaut : toast si `syncMode === 'full'` (ex. bouton Enregistrer), pas si `minimal` (auto-save). */
  notify?: boolean
}

export type SourcesFeedback = { kind: 'success' | 'error'; text: string }

let dataSourceSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function useStudioDocument(
  route: RouteLocationNormalizedLoaded,
  documentKind: Ref<StudioDocumentKind>,
) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useAppNotifications()

  const isCreate = computed(() => route.name === 'studio-statsdata-create')
  const isStatsDataRemote = computed(() => documentKind.value === 'statsdata')

  const title = ref('Sans titre')
  const blocks = ref<StudioBlock[]>([])
  const dataSources = ref<StudioDataSource[]>([])
  const settings = ref<StudioDocumentSettings>({
    subtitle: '',
    visibility: 'private',
  })
  const isDirty = ref(false)
  const suppressDirty = ref(false)
  /** Ignore les touch() déclenchés par sync API / chargement des sources */
  const suppressDataSourcesDirty = ref(0)

  const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const loadError = ref<string | null>(null)
  const saving = ref(false)
  const deleting = ref(false)
  const documentSlug = ref('')
  const pendingRouteBootstrap = ref<StatsDataDocumentDto | null>(null)

  const sourcesFeedback = ref<SourcesFeedback | null>(null)
  const sourcesBusy = ref(false)

  const statsDataDocumentId = computed(() => {
    if (!isStatsDataRemote.value || isCreate.value) return null
    const id = String(route.params.id ?? '')
    return id || null
  })

  const touch = () => {
    if (!suppressDirty.value) {
      isDirty.value = true
    }
  }

  const setSourcesFeedback = (kind: SourcesFeedback['kind'], text: string) => {
    sourcesFeedback.value = { kind, text }
    if (kind === 'success') {
      window.setTimeout(() => {
        if (sourcesFeedback.value?.text === text) sourcesFeedback.value = null
      }, 5000)
    }
  }

  /** Retour utilisateur dans le panneau sources + notification globale (studio). */
  const sourcesFeedbackWithToast = (kind: SourcesFeedback['kind'], text: string, toastTitle?: string) => {
    setSourcesFeedback(kind, text)
    if (kind === 'success') toastSuccess(text, toastTitle)
    else toastError(text, toastTitle)
  }

  const applyFromDto = (doc: StatsDataDocumentDto, options?: { skipDataSources?: boolean }) => {
    title.value = doc.title || 'Sans titre'
    settings.value = {
      subtitle: doc.subtitle ?? '',
      visibility: doc.visibility,
    }
    blocks.value = Array.isArray(doc.blocks) ? [...doc.blocks] : []
    if (!options?.skipDataSources) {
      dataSources.value = Array.isArray(doc.dataSources) ? [...doc.dataSources] : []
    }
    documentSlug.value = doc.slug
  }

  const buildWritePayload = (): StatsDataDocumentWritePayload => {
    const base = {
      title: title.value.trim() || 'Sans titre',
      subtitle: settings.value.subtitle ?? '',
      visibility: settings.value.visibility,
      blocks: blocks.value,
    }
    if (isStatsDataRemote.value) {
      return { ...base, dataSources: [] }
    }
    return { ...base, dataSources: dataSources.value }
  }

  const loadRemoteSourcesList = async (documentId: string) => {
    try {
      const raw = await listStatsDataSources(documentId)
      suppressDataSourcesDirty.value++
      dataSources.value = studioDataSourcesFromApiList(raw)
      await nextTick()
      suppressDataSourcesDirty.value--
    } catch (e) {
      suppressDataSourcesDirty.value = Math.max(0, suppressDataSourcesDirty.value - 1)
      setSourcesFeedback('error', formatApiErrorDetail(e, 'Impossible de charger les sources.'))
    }
  }

  const resetLocalArticleLike = async () => {
    suppressDirty.value = true
    isDirty.value = false
    if (isCreate.value) {
      title.value = documentKind.value === 'article' ? 'Nouvel article' : 'Nouvelle StatsData'
      blocks.value = []
      dataSources.value = []
      settings.value = { subtitle: '', visibility: 'private' }
    } else {
      title.value =
        documentKind.value === 'article'
          ? `Article ${String(route.params.id)}`
          : `StatsData ${String(route.params.id)}`
      blocks.value = []
      dataSources.value = []
      settings.value = { subtitle: 'Brouillon local', visibility: 'team' }
    }
    documentSlug.value = ''
    await nextTick()
    suppressDirty.value = false
  }

  const resetStatsDataFromRoute = async () => {
    suppressDirty.value = true
    loadError.value = null

    if (isCreate.value) {
      isDirty.value = false
      title.value = 'Nouvelle StatsData'
      blocks.value = []
      dataSources.value = []
      settings.value = { subtitle: '', visibility: 'private' }
      documentSlug.value = ''
      pendingRouteBootstrap.value = null
      loadState.value = 'ready'
      await nextTick()
      suppressDirty.value = false
      return
    }

    const id = String(route.params.id ?? '')
    if (!id) {
      loadState.value = 'error'
      loadError.value = 'Identifiant du document manquant.'
      suppressDirty.value = false
      return
    }

    const bootstrap = pendingRouteBootstrap.value
    if (bootstrap && bootstrap.id === id) {
      pendingRouteBootstrap.value = null
      isDirty.value = false
      applyFromDto(bootstrap, { skipDataSources: true })
      loadState.value = 'ready'
      await loadRemoteSourcesList(id)
      await nextTick()
      suppressDirty.value = false
      return
    }

    loadState.value = 'loading'
    await nextTick()
    try {
      const doc = await fetchStatsDataDocument(id)
      isDirty.value = false
      applyFromDto(doc, { skipDataSources: true })
      await loadRemoteSourcesList(id)
      loadState.value = 'ready'
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 405) {
        isDirty.value = false
        title.value = `StatsData`
        settings.value = { subtitle: '', visibility: 'private' }
        blocks.value = []
        suppressDataSourcesDirty.value++
        dataSources.value = []
        suppressDataSourcesDirty.value--
        documentSlug.value = ''
        loadState.value = 'ready'
        loadError.value = null
        await loadRemoteSourcesList(id)
        setSourcesFeedback(
          'error',
          'Le chargement du document (GET) n’est pas disponible sur l’API ; les blocs peuvent être vides jusqu’à correction du back.',
        )
      } else {
        loadState.value = 'error'
        loadError.value = formatApiErrorDetail(e, 'Impossible de charger le document.')
      }
    }
    await nextTick()
    suppressDirty.value = false
  }

  const resetFromRoute = async () => {
    if (isStatsDataRemote.value) {
      await resetStatsDataFromRoute()
      return
    }
    loadState.value = 'ready'
    loadError.value = null
    await resetLocalArticleLike()
  }

  watch(
    () => [route.fullPath, documentKind.value] as const,
    () => {
      void resetFromRoute()
    },
    { immediate: true },
  )

  watch(title, touch, { flush: 'post' })
  watch(settings, touch, { deep: true, flush: 'post' })
  watch(blocks, touch, { deep: true, flush: 'post' })
  watch(
    dataSources,
    () => {
      if (suppressDataSourcesDirty.value > 0) return
      touch()
    },
    { deep: true, flush: 'post' },
  )

  const addBlock = (type: StudioBlockType) => {
    blocks.value = [...blocks.value, createEmptyBlock(type)]
  }

  const removeBlock = (id: string) => {
    blocks.value = blocks.value.filter((b) => b.id !== id)
  }

  const duplicateBlock = (id: string) => {
    const index = blocks.value.findIndex((b) => b.id === id)
    if (index === -1) return
    const copy = cloneBlock(blocks.value[index]!)
    const next = [...blocks.value]
    next.splice(index + 1, 0, copy)
    blocks.value = next
  }

  const updateBlock = (next: StudioBlock) => {
    blocks.value = blocks.value.map((b) => (b.id === next.id ? next : b))
  }

  const updateDataSource = (next: StudioDataSource) => {
    dataSources.value = dataSources.value.map((s) => (s.id === next.id ? next : s))
  }

  const pushSourcePatch = async (documentId: string, sourceId: string, body: StatsDataUpdateSourcePayload) => {
    const raw = await patchStatsDataSourceApi(documentId, sourceId, body)
    const mapped = studioDataSourceFromApi(raw)
    if (mapped) {
      suppressDataSourcesDirty.value++
      dataSources.value = dataSources.value.map((s) => (s.id === sourceId ? mapped : s))
      await nextTick()
      suppressDataSourcesDirty.value--
    } else {
      await loadRemoteSourcesList(documentId)
    }
  }

  const syncDataSourceToServer = async (source: StudioDataSource) => {
    const docId = statsDataDocumentId.value
    if (!isStatsDataRemote.value || !docId || loadState.value !== 'ready') return
    const latest = dataSources.value.find((s) => s.id === source.id) ?? source
    sourcesBusy.value = true
    try {
      if (latest.kind === 'manual') {
        await pushSourcePatch(docId, latest.id, {
          name: latest.name,
          manualData: { rows: latest.rows },
        })
      } else if (latest.kind === 'api') {
        await pushSourcePatch(docId, latest.id, buildStatsDataApiSourceWriteBody(latest))
      } else if (latest.kind === 'file') {
        await pushSourcePatch(docId, latest.id, { name: latest.name })
      }
      sourcesFeedbackWithToast('success', 'Source enregistrée sur le serveur.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Mise à jour de la source impossible.'), 'Sources')
    } finally {
      sourcesBusy.value = false
    }
  }

  const scheduleDataSourceSync = (source: StudioDataSource) => {
    const docId = statsDataDocumentId.value
    if (!isStatsDataRemote.value || !docId || isCreate.value) return
    const id = source.id
    const prev = dataSourceSyncTimers.get(id)
    if (prev) clearTimeout(prev)
    const t = setTimeout(() => {
      dataSourceSyncTimers.delete(id)
      const cur = dataSources.value.find((s) => s.id === id)
      if (cur) void syncDataSourceToServer(cur)
    }, 700)
    dataSourceSyncTimers.set(id, t)
  }

  const clearDataSourceSyncTimer = (sourceId: string) => {
    const t = dataSourceSyncTimers.get(sourceId)
    if (t) clearTimeout(t)
    dataSourceSyncTimers.delete(sourceId)
  }

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  const probeApiSource = async (source: StudioDataSourceApi) => {
    const latest = dataSources.value.find(
      (s): s is StudioDataSourceApi => s.id === source.id && s.kind === 'api',
    )
    const s = latest ?? source
    const url = s.url?.trim() ?? ''
    if (!url) {
      sourcesFeedbackWithToast('error', 'Indiquez une URL avant de tester.', 'Connexion API')
      return
    }
    sourcesBusy.value = true
    try {
      const raw = await probeSourceApiConnection({
        url,
        apiKey: s.apiKeyPreview?.trim() || null,
      })
      let inner: Record<string, unknown> = {}
      if (isRecord(raw)) {
        inner = isRecord(raw.data) ? (raw.data as Record<string, unknown>) : raw
      }
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
      sourcesBusy.value = false
    }
  }

  const addDataSource = async (source: StudioDataSource) => {
    if (!isStatsDataRemote.value || isCreate.value || loadState.value !== 'ready') {
      dataSources.value = [...dataSources.value, source]
      return
    }
    const docId = statsDataDocumentId.value
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

    sourcesBusy.value = true
    try {
      let raw: unknown
      if (source.kind === 'manual') {
        raw = await createStatsDataSource(docId, {
          type: 'manual',
          name: source.name,
          manualData: { rows: source.rows },
        })
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
      suppressDataSourcesDirty.value++
      dataSources.value = [...dataSources.value, mapped]
      await nextTick()
      suppressDataSourcesDirty.value--
      sourcesFeedbackWithToast('success', 'Source créée.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Création de la source impossible.'), 'Sources')
    } finally {
      sourcesBusy.value = false
    }
  }

  const uploadDataSourceFile = async (file: File, displayName?: string) => {
    if (!isStatsDataRemote.value || isCreate.value || loadState.value !== 'ready') {
      sourcesFeedbackWithToast('error', 'Enregistrez le document avant d’importer un fichier.', 'Sources')
      return
    }
    const docId = statsDataDocumentId.value
    if (!docId) {
      sourcesFeedbackWithToast('error', 'Document introuvable.', 'Sources')
      return
    }
    const name = displayName?.trim() || file.name || 'Import fichier'
    sourcesBusy.value = true
    try {
      const raw = await postStatsDataSourceFileUpload(docId, name, file)
      const mapped = studioDataSourceFromApi(raw)
      if (!mapped) throw new Error('Réponse source fichier invalide')
      suppressDataSourcesDirty.value++
      dataSources.value = [...dataSources.value, mapped]
      await nextTick()
      suppressDataSourcesDirty.value--
      sourcesFeedbackWithToast('success', 'Fichier importé.', 'Sources')
    } catch (e) {
      sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Import fichier impossible.'), 'Sources')
    } finally {
      sourcesBusy.value = false
    }
  }

  const removeDataSource = async (id: string) => {
    const docId = statsDataDocumentId.value
    if (isStatsDataRemote.value && docId && loadState.value === 'ready') {
      sourcesBusy.value = true
      try {
        await deleteStatsDataSource(docId, id)
        sourcesFeedbackWithToast('success', 'Source supprimée.', 'Sources')
      } catch (e) {
        sourcesFeedbackWithToast('error', formatApiErrorDetail(e, 'Suppression impossible sur le serveur.'), 'Sources')
        sourcesBusy.value = false
        return
      } finally {
        sourcesBusy.value = false
      }
    }
    clearDataSourceSyncTimer(id)
    dataSources.value = dataSources.value.filter((s) => s.id !== id)
    blocks.value = blocks.value.map((b) => {
      if ((b.type === 'chart' || b.type === 'table') && b.dataBinding.sourceId === id) {
        return { ...b, dataBinding: { ...b.dataBinding, sourceId: '' } }
      }
      return b
    })
  }

  const saveDocument = async (options?: SaveDocumentOptions): Promise<void> => {
    if (!isStatsDataRemote.value) return
    const syncMode = options?.syncMode ?? 'full'
    const withToast = options?.notify ?? syncMode === 'full'
    saving.value = true
    try {
      const payload = buildWritePayload()
      if (isCreate.value) {
        const doc = await createStatsDataDocument(payload)
        pendingRouteBootstrap.value = doc
        await router.replace({ name: 'studio-statsdata-edit', params: { id: doc.id } })
        if (withToast) toastSuccess('La StatsData a été créée.', 'Enregistrement')
        return
      }
      const id = String(route.params.id ?? '')
      const doc = await updateStatsDataDocument(id, payload)
      suppressDirty.value = true
      isDirty.value = false
      if (syncMode === 'minimal') {
        documentSlug.value = doc.slug
      } else {
        applyFromDto(doc, { skipDataSources: true })
        await loadRemoteSourcesList(id)
      }
      await nextTick()
      suppressDirty.value = false
      if (withToast) toastSuccess('Modifications enregistrées.', 'StatsData')
    } catch (e) {
      if (withToast) toastError(formatApiErrorDetail(e, 'Enregistrement impossible.'), 'StatsData')
      throw e
    } finally {
      saving.value = false
    }
  }

  const autoSaveError = ref<string | null>(null)

  const tickAutoSave = async () => {
    if (!isStatsDataRemote.value || loadState.value !== 'ready') return
    if (!isDirty.value || saving.value || deleting.value) return
    try {
      await saveDocument({ syncMode: 'minimal' })
      autoSaveError.value = null
    } catch (e) {
      autoSaveError.value = formatApiErrorDetail(e, 'Sauvegarde automatique impossible.')
    }
  }

  const { pause, resume } = useIntervalFn(
    () => {
      void tickAutoSave()
    },
    1000,
    { immediate: false },
  )

  watch(
    () => [isStatsDataRemote.value, loadState.value] as const,
    ([remote, st]) => {
      if (remote && st === 'ready') resume()
      else pause()
    },
    { flush: 'post' },
  )

  const deleteDocument = async (): Promise<void> => {
    if (!isStatsDataRemote.value || isCreate.value) return
    const id = String(route.params.id ?? '')
    if (!id) return
    deleting.value = true
    try {
      await deleteStatsDataDocument(id)
      await router.push({ name: 'statsdata' })
    } finally {
      deleting.value = false
    }
  }

  const dismissSourcesFeedback = () => {
    sourcesFeedback.value = null
  }

  return {
    isCreate,
    isStatsDataRemote,
    statsDataDocumentId,
    title,
    blocks,
    dataSources,
    settings,
    isDirty,
    loadState,
    loadError,
    saving,
    deleting,
    autoSaveError,
    documentSlug,
    sourcesFeedback,
    sourcesBusy,
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlock,
    updateDataSource,
    addDataSource,
    removeDataSource,
    saveDocument,
    deleteDocument,
    reloadDocument: resetFromRoute,
    scheduleDataSourceSync,
    syncDataSourceToServer,
    probeApiSource,
    uploadDataSourceFile,
    dismissSourcesFeedback,
  }
}
