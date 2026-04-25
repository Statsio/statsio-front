import { nextTick, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import axios from 'axios'
import type { SaveDocumentOptions } from '@/composables/useStudioDocument'
import type { StudioDocumentKind } from '@/types/studio-document'
import type { StatsDataDocumentDto, StatsDataDocumentWritePayload } from '@/types/statsdata-document-api'
import {
  createStatsDataDocument,
  deleteStatsDataDocument,
  fetchStatsDataDocument,
  updateStatsDataDocument,
} from '@/api/statsdata-documents'
import { formatApiErrorDetail } from '@/lib/http-errors'

type StudioState = {
  isCreate: Ref<boolean>
  isStatsDataRemote: Ref<boolean>
  title: Ref<string>
  blocks: Ref<unknown[]>
  dataSources: Ref<unknown[]>
  settings: Ref<{ subtitle: string; visibility: 'private' | 'team' | 'public' }>
  isDirty: Ref<boolean>
  suppressDirty: Ref<boolean>
  suppressDataSourcesDirty: Ref<number>
  loadState: Ref<'idle' | 'loading' | 'ready' | 'error'>
  loadError: Ref<string | null>
  saving: Ref<boolean>
  deleting: Ref<boolean>
  documentSlug: Ref<string>
  pendingRouteBootstrap: Ref<StatsDataDocumentDto | null>
  applyFromDto: (doc: StatsDataDocumentDto, options?: { skipDataSources?: boolean }) => void
  resetLocalArticleLike: () => Promise<void>
}

export function useStudioDocumentApi(args: {
  route: RouteLocationNormalizedLoaded
  documentKind: Ref<StudioDocumentKind>
  router: Router
  state: StudioState
  loadRemoteSourcesList: (documentId: string) => Promise<void>
  setSourcesFeedback: (kind: 'success' | 'error', text: string) => void
  toastSuccess: (text: string, title?: string) => void
  toastError: (text: string, title?: string) => void
}) {
  const {
    route,
    documentKind,
    router,
    state,
    loadRemoteSourcesList,
    setSourcesFeedback,
    toastSuccess,
    toastError,
  } = args

  const buildWritePayload = (): StatsDataDocumentWritePayload => {
    // Ensure plain JSON-serializable data (avoid Vue proxies).
    const blocksPlain = JSON.parse(JSON.stringify(state.blocks.value ?? [])) as unknown[]
    const dataSourcesPlain = JSON.parse(JSON.stringify(state.dataSources.value ?? [])) as unknown[]
    const base = {
      title: state.title.value.trim() || 'Sans titre',
      subtitle: state.settings.value.subtitle ?? '',
      visibility: state.settings.value.visibility,
      blocks: blocksPlain as any,
    }
    if (state.isStatsDataRemote.value) return { ...base, dataSources: [] }
    return { ...base, dataSources: dataSourcesPlain as any }
  }

  const resetStatsDataFromRoute = async () => {
    state.suppressDirty.value = true
    state.loadError.value = null

    if (state.isCreate.value) {
      state.isDirty.value = false
      state.title.value = 'Nouvelle StatsData'
      state.blocks.value = []
      state.dataSources.value = []
      state.settings.value = { subtitle: '', visibility: 'private' }
      state.documentSlug.value = ''
      state.pendingRouteBootstrap.value = null
      state.loadState.value = 'ready'
      await nextTick()
      state.suppressDirty.value = false
      return
    }

    const id = String(route.params.id ?? '')
    if (!id) {
      state.loadState.value = 'error'
      state.loadError.value = 'Identifiant du document manquant.'
      state.suppressDirty.value = false
      return
    }

    const bootstrap = state.pendingRouteBootstrap.value
    if (bootstrap && bootstrap.id === id) {
      state.pendingRouteBootstrap.value = null
      state.isDirty.value = false
      state.applyFromDto(bootstrap, { skipDataSources: true })
      state.loadState.value = 'ready'
      await loadRemoteSourcesList(id)
      await nextTick()
      state.suppressDirty.value = false
      return
    }

    state.loadState.value = 'loading'
    await nextTick()
    try {
      const doc = await fetchStatsDataDocument(id)
      state.isDirty.value = false
      state.applyFromDto(doc, { skipDataSources: true })
      await loadRemoteSourcesList(id)
      state.loadState.value = 'ready'
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 405) {
        state.isDirty.value = false
        state.title.value = `StatsData`
        state.settings.value = { subtitle: '', visibility: 'private' }
        state.blocks.value = []
        state.suppressDataSourcesDirty.value++
        state.dataSources.value = []
        state.suppressDataSourcesDirty.value--
        state.documentSlug.value = ''
        state.loadState.value = 'ready'
        state.loadError.value = null
        await loadRemoteSourcesList(id)
        setSourcesFeedback(
          'error',
          'Le chargement du document (GET) n’est pas disponible sur l’API ; les blocs peuvent être vides jusqu’à correction du back.',
        )
      } else {
        state.loadState.value = 'error'
        state.loadError.value = formatApiErrorDetail(e, 'Impossible de charger le document.')
      }
    }
    await nextTick()
    state.suppressDirty.value = false
  }

  const resetFromRoute = async () => {
    if (state.isStatsDataRemote.value) {
      await resetStatsDataFromRoute()
      return
    }
    state.loadState.value = 'ready'
    state.loadError.value = null
    await state.resetLocalArticleLike()
  }

  watch(
    () => [route.fullPath, documentKind.value] as const,
    () => {
      void resetFromRoute()
    },
    { immediate: true },
  )

  const saveDocument = async (options?: SaveDocumentOptions): Promise<void> => {
    if (!state.isStatsDataRemote.value) return
    const syncMode = options?.syncMode ?? 'full'
    const withToast = options?.notify ?? syncMode === 'full'
    state.saving.value = true
    try {
      const payload = buildWritePayload()
      if (state.isCreate.value) {
        const doc = await createStatsDataDocument(payload)
        state.pendingRouteBootstrap.value = doc
        await router.replace({ name: 'studio-statsdata-edit', params: { id: doc.id } })
        if (withToast) toastSuccess('La StatsData a été créée.', 'Enregistrement')
        return
      }
      const id = String(route.params.id ?? '')
      const doc = await updateStatsDataDocument(id, payload)
      state.suppressDirty.value = true
      state.isDirty.value = false
      if (syncMode === 'minimal') {
        state.documentSlug.value = doc.slug
      } else {
        state.applyFromDto(doc, { skipDataSources: true })
        await loadRemoteSourcesList(id)
      }
      await nextTick()
      state.suppressDirty.value = false
      if (withToast) toastSuccess('Modifications enregistrées.', 'StatsData')
    } catch (e) {
      if (withToast) toastError(formatApiErrorDetail(e, 'Enregistrement impossible.'), 'StatsData')
      throw e
    } finally {
      state.saving.value = false
    }
  }

  const deleteDocument = async (): Promise<void> => {
    if (!state.isStatsDataRemote.value || state.isCreate.value) return
    const id = String(route.params.id ?? '')
    if (!id) return
    state.deleting.value = true
    try {
      await deleteStatsDataDocument(id)
      await router.push({ name: 'statsdata' })
    } finally {
      state.deleting.value = false
    }
  }

  return {
    resetFromRoute,
    saveDocument,
    deleteDocument,
  }
}

