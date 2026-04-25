import { ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter } from 'vue-router'
import { useIntervalFn } from '@vueuse/core'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { formatApiErrorDetail } from '@/lib/http-errors'
import type { StudioDocumentKind } from '@/types/studio-document'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import { useStudioDocumentState, type SourcesFeedback } from '@/composables/studio/useStudioDocumentState'
import { useStudioSourcesApi } from '@/composables/studio/useStudioSourcesApi'
import { useStudioDocumentApi } from '@/composables/studio/useStudioDocumentApi'

export type SaveDocumentOptions = {
  syncMode?: 'full' | 'minimal'
  /** Par défaut : toast si `syncMode === 'full'` (ex. bouton Enregistrer), pas si `minimal` (auto-save). */
  notify?: boolean
}

export type { SourcesFeedback }

export function useStudioDocument(
  route: RouteLocationNormalizedLoaded,
  documentKind: Ref<StudioDocumentKind>,
) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useAppNotifications()

  const state = useStudioDocumentState(route, documentKind)

  const sourcesApi = useStudioSourcesApi({
    state: {
      isCreate: state.isCreate,
      isStatsDataRemote: state.isStatsDataRemote,
      statsDataDocumentId: state.statsDataDocumentId,
      loadState: state.loadState,
      pages: state.pages,
      dataSources: state.dataSources,
      suppressDataSourcesDirty: state.suppressDataSourcesDirty,
      sourcesBusy: state.sourcesBusy,
      sourcesFeedback: state.sourcesFeedback,
    },
    toastSuccess,
    toastError,
  })

  const documentApi = useStudioDocumentApi({
    route,
    documentKind,
    router,
    state: {
      isCreate: state.isCreate,
      isStatsDataRemote: state.isStatsDataRemote,
      title: state.title,
      pages: state.pages,
      dataSources: state.dataSources,
      settings: state.settings,
      isDirty: state.isDirty,
      suppressDirty: state.suppressDirty,
      suppressDataSourcesDirty: state.suppressDataSourcesDirty,
      loadState: state.loadState,
      loadError: state.loadError,
      saving: state.saving,
      deleting: state.deleting,
      documentSlug: state.documentSlug,
      pendingRouteBootstrap: state.pendingRouteBootstrap,
      applyFromDto: state.applyFromDto,
      resetLocalArticleLike: state.resetLocalArticleLike,
    },
    loadRemoteSourcesList: sourcesApi.loadRemoteSourcesList,
    setSourcesFeedback: sourcesApi.setSourcesFeedback,
    toastSuccess,
    toastError,
  })

  const autoSaveError = ref<string | null>(null)

  const tickAutoSave = async () => {
    if (!state.isStatsDataRemote.value || state.loadState.value !== 'ready') return
    if (!state.isDirty.value || state.saving.value || state.deleting.value) return
    try {
      await documentApi.saveDocument({ syncMode: 'minimal' })
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
    () => [state.isStatsDataRemote.value, state.loadState.value] as const,
    ([remote, st]) => {
      if (remote && st === 'ready') resume()
      else pause()
    },
    { flush: 'post' },
  )

  return {
    isCreate: state.isCreate,
    isStatsDataRemote: state.isStatsDataRemote,
    statsDataDocumentId: state.statsDataDocumentId,
    title: state.title,
    pages: state.pages,
    currentPageId: state.currentPageId,
    blocks: state.blocks,
    dataSources: state.dataSources,
    settings: state.settings,
    isDirty: state.isDirty,
    loadState: state.loadState,
    loadError: state.loadError,
    saving: state.saving,
    deleting: state.deleting,
    autoSaveError,
    documentSlug: state.documentSlug,
    sourcesFeedback: state.sourcesFeedback,
    sourcesBusy: state.sourcesBusy,
    addBlock: state.addBlock,
    removeBlock: state.removeBlock,
    duplicateBlock: state.duplicateBlock,
    updateBlock: state.updateBlock,
    updateDataSource: state.updateDataSource,
    addDataSource: sourcesApi.addDataSource,
    removeDataSource: sourcesApi.removeDataSource,
    saveDocument: documentApi.saveDocument,
    deleteDocument: documentApi.deleteDocument,
    reloadDocument: documentApi.resetFromRoute,
    scheduleDataSourceSync: sourcesApi.scheduleDataSourceSync,
    syncDataSourceToServer: sourcesApi.syncDataSourceToServer,
    probeApiSource: sourcesApi.probeApiSource,
    uploadDataSourceFile: sourcesApi.uploadDataSourceFile,
    dismissSourcesFeedback: sourcesApi.dismissSourcesFeedback,
    executeStatsDataDocumentQuery: sourcesApi.executeStatsDataDocumentQuery as (body: StatsDataAnyQueryRequest) => Promise<
      Record<string, unknown>[]
    >,
    refreshNormalizedSource: sourcesApi.refreshNormalizedSource,
    persistSourceNormalizationMapping: sourcesApi.persistSourceNormalizationMapping,
    addPage: state.addPage,
    removePage: state.removePage,
    renamePage: state.renamePage,
    setCurrentPage: state.setCurrentPage,
    updatePageSettings: state.updatePageSettings,
  }
}
