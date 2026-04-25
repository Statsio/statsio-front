<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import AppStudioDocumentHeader from '@/components/layout/AppStudioDocumentHeader.vue'
import StudioLeftDock from '@/components/studio/StudioLeftDock.vue'
import StudioSelectionContextBar from '@/components/studio/StudioSelectionContextBar.vue'
import StudioBlockCanvas from '@/components/studio/StudioBlockCanvas.vue'
import AppStudioLoading from '@/components/studio/AppStudioLoading.vue'
import AppButton from '@/components/ui/AppButton.vue'
import StudioPageTabs from '@/components/studio/StudioPageTabs.vue'
import type { StudioLeftTabId } from '@/components/studio/studio-left-dock.types'
import { useStudioDocument } from '@/composables/useStudioDocument'
import { getErrorMessage } from '@/lib/http-errors'
import {
  studioDataSourcesKey,
  studioSelectBlockKey,
  studioSelectedBlockIdKey,
  studioStatsDataWidgetKey,
  studioPageFiltersKey,
} from '@/lib/studio-inject-keys'
import type { StudioBlock, StudioBlockType, StudioDocumentKind, StudioDocumentSettings, StudioBlockAction } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

const route = useRoute()
const router = useRouter()

const documentKind = computed<StudioDocumentKind>(() =>
  route.meta.studioDocumentKind === 'article' ? 'article' : 'statsdata',
)

const {
  isCreate,
  isStatsDataRemote,
  title,
  pages,
  currentPageId,
  blocks,
  dataSources,
  settings,
  isDirty,
  loadState,
  loadError,
  saving,
  deleting,
  autoSaveError,
  statsDataDocumentId,
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
  reloadDocument,
  scheduleDataSourceSync,
  syncDataSourceToServer,
  probeApiSource,
  uploadDataSourceFile,
  dismissSourcesFeedback,
  executeStatsDataDocumentQuery,
  refreshNormalizedSource,
  persistSourceNormalizationMapping,
  addPage,
  removePage,
  renamePage,
  setCurrentPage,
  updatePageSettings,
} = useStudioDocument(route, documentKind)

const remoteStudioSources = computed(() => isStatsDataRemote.value && studioBodyReady.value)

const onSyncDataSource = (source: StudioDataSource) => {
  if (source.kind === 'manual') scheduleDataSourceSync(source)
  else void syncDataSourceToServer(source)
}

const studioBodyReady = computed(() => {
  if (!isStatsDataRemote.value) return true
  return loadState.value === 'ready'
})

const apiError = ref<string | null>(null)

const onSaveDraft = async () => {
  if (!isStatsDataRemote.value) return
  apiError.value = null
  autoSaveError.value = null
  try {
    await saveDocument()
  } catch (e) {
    apiError.value = getErrorMessage(e, 'Enregistrement impossible.')
  }
}

const onDeleteDocument = async () => {
  if (!isStatsDataRemote.value || isCreate.value) return
  if (!window.confirm('Supprimer définitivement cette StatsData ? Cette action est irréversible.')) return
  apiError.value = null
  try {
    await deleteDocument()
  } catch (e) {
    apiError.value = getErrorMessage(e, 'Suppression impossible.')
  }
}

provide(studioDataSourcesKey, dataSources)

const pageFilters = ref<Record<string, string>>({})
provide(studioPageFiltersKey, pageFilters)

const statsDataWidgetContext = computed(() => ({
  enabled: remoteStudioSources.value,
  documentId: statsDataDocumentId.value,
  executeQuery: executeStatsDataDocumentQuery,
}))
provide(studioStatsDataWidgetKey, statsDataWidgetContext)

const leftOpen = ref(false)
const leftTab = ref<StudioLeftTabId | null>(null)

const selectedBlockId = ref<string | null>(null)

provide(studioSelectedBlockIdKey, selectedBlockId)
provide(studioSelectBlockKey, (id: string | null) => {
  selectedBlockId.value = id
})

const dockWidth = computed(() => {
  // Rail always visible (4.5rem). Panel adds 26rem when open.
  // Use a plain length (rem) to avoid nested calc() edge cases in inline styles.
  const rail = 4.5
  const panel = leftOpen.value && leftTab.value ? 26 : 0
  return `${rail + panel}rem`
})

const findBlockById = (list: StudioBlock[], id: string): StudioBlock | null => {
  for (const b of list) {
    if (b.id === id) return b
    if ((b.type === 'layout_2col' || b.type === 'layout_3col') && Array.isArray(b.columns)) {
      for (const col of b.columns) {
        const found = findBlockById(col, id)
        if (found) return found
      }
    }
  }
  return null
}

const selectedBlock = computed(() => {
  const id = selectedBlockId.value
  if (!id) return null
  return findBlockById(blocks.value, id)
})

watch(selectedBlockId, (id) => {
  if (id) {
    leftTab.value = 'inspector'
    leftOpen.value = true
  } else {
    // If the inspector was opened implicitly by a selection,
    // close it when nothing is selected to avoid showing the empty-state message.
    if (leftTab.value === 'inspector') {
      leftOpen.value = false
      leftTab.value = null
    }
  }
})

watch(
  blocks,
  (next) => {
    if (selectedBlockId.value && !findBlockById(next, selectedBlockId.value)) {
      selectedBlockId.value = null
    }
  },
  { deep: true },
)

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    selectedBlockId.value = null
  }
})

const onRemoveBlock = (id: string) => {
  removeBlock(id)
  if (selectedBlockId.value === id) {
    selectedBlockId.value = null
  }
}

const onAddBlock = (type: StudioBlockType) => {
  const len = blocks.value.length
  addBlock(type)
  const added = blocks.value[len]
  if (added) {
    selectedBlockId.value = added.id
  }
}

const syncBlocks = (next: StudioBlock[]) => {
  blocks.value = next
}

const applySettings = (next: StudioDocumentSettings) => {
  settings.value = next
}

const openLeftTab = (tab: StudioLeftTabId) => {
  leftTab.value = tab
  leftOpen.value = true
}

const backTo = computed(() => (documentKind.value === 'article' ? '/articles' : '/statsdata'))

const backAriaLabel = computed(() =>
  documentKind.value === 'article' ? 'Revenir à la liste des articles' : 'Revenir au catalogue StatsData',
)

const mode = computed<'create' | 'edit'>(() => (isCreate.value ? 'create' : 'edit'))

const headerActionsDisabled = computed(
  () => isStatsDataRemote.value && loadState.value === 'loading',
)

const canPreview = computed(() => !!statsDataDocumentId.value)

const onPreview = () => {
  if (!statsDataDocumentId.value) return
  void router.push({ name: 'studio-statsdata-preview', params: { id: statsDataDocumentId.value } })
}

const onBlockAction = (action: StudioBlockAction, context: Record<string, unknown>) => {
  console.log('onBlockAction called', { action, context })
  if (action.type === 'navigate_to_page') {
    const targetPage = pages.value.find((p) => p.id === action.targetPageId)
    if (targetPage) {
      setCurrentPage(action.targetPageId)
      // Appliquer les filtres passés via action.passColumns et context
      if (action.passColumns && Array.isArray(action.passColumns)) {
        const newFilters: Record<string, string> = {}
        action.passColumns.forEach((col: string) => {
          if (context[col] !== undefined) {
            newFilters[col] = String(context[col])
          }
        })
        console.log('Setting page filters:', newFilters)
        pageFilters.value = newFilters
      }
    }
  } else if (action.type === 'set_filters') {
    // Appliquer les filtres aux blocs de la page courante
    if (action.filters) {
      console.log('Setting filters:', action.filters)
      pageFilters.value = { ...pageFilters.value, ...action.filters }
    }
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_12%,#f8fafc_38%)] text-slate-900">
    <AppStudioDocumentHeader
      :title="title"
      :document-kind="documentKind"
      :back-to="backTo"
      :back-aria-label="backAriaLabel"
      :quit-to="backTo"
      :is-dirty="isDirty"
      :mode="mode"
      :actions-disabled="headerActionsDisabled"
      :saving="saving"
      :deleting="deleting"
      :show-delete-document="isStatsDataRemote && !isCreate"
      :primary-action-label="isStatsDataRemote ? 'Enregistrer' : 'Publier plus tard'"
      :can-preview="canPreview"
      @save-draft="onSaveDraft"
      @delete-document="onDeleteDocument"
      @preview="onPreview"
      @update:title="title = $event"
    />

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <AppStudioLoading
        v-if="saving"
        overlay
        label="Enregistrement"
        message="Vos modifications sont en cours de sécurisation..."
      />
    </Transition>

    <div
      v-if="apiError || autoSaveError"
      class="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm text-rose-800 sm:px-6"
      role="alert"
    >
      {{ apiError || autoSaveError }}
    </div>

    <div
      v-if="selectedBlock && studioBodyReady"
      :style="{ paddingLeft: dockWidth }"
    >
      <StudioSelectionContextBar
        :block="selectedBlock"
        @update-block="updateBlock"
      />
    </div>

    <div
      v-if="studioBodyReady"
      :style="{ paddingLeft: dockWidth }"
    >
      <StudioPageTabs
        :pages="pages"
        :current-page-id="currentPageId"
        @update:current-page-id="setCurrentPage"
        @add-page="addPage"
        @remove-page="removePage"
        @rename-page="renamePage"
        @update-page-settings="updatePageSettings"
      />
    </div>

    <div
      class="flex h-[calc(100vh-4.5rem-2.75rem)] min-h-0 flex-1 flex-col lg:flex-row"
      :style="{
        paddingLeft: dockWidth,
      }"
    >
      <template v-if="studioBodyReady">
      <StudioLeftDock
        v-model:open="leftOpen"
        v-model:tab="leftTab"
        :blocks="blocks"
        :selected-id="selectedBlockId"
        :selected-block="selectedBlock"
        :data-sources="dataSources"
        :settings="settings"
        :stats-data-document-id="statsDataDocumentId"
        :remote-studio-sources="remoteStudioSources"
        :stats-data-query-mode="remoteStudioSources"
        :sources-feedback="sourcesFeedback"
        :sources-busy="sourcesBusy"
        :pages="pages"
        :persist-source-normalization="persistSourceNormalizationMapping"
        @update:blocks="syncBlocks"
        @update:settings="applySettings"
        @select-block="selectedBlockId = $event"
        @add-block="onAddBlock"
        @update-block="updateBlock"
        @remove-block="onRemoveBlock"
        @duplicate-block="duplicateBlock"
        @update-data-source="updateDataSource"
        @add-data-source="addDataSource"
        @remove-data-source="removeDataSource"
        @sync-data-source="onSyncDataSource"
        @probe-api-source="probeApiSource"
        @upload-data-source-file="uploadDataSourceFile"
        @dismiss-sources-feedback="dismissSourcesFeedback"
        @refresh-normalized-source="refreshNormalizedSource($event)"
      />

      <main class="relative min-h-0 flex-1 overflow-y-auto" aria-label="Aperçu page publique">
        <div class="min-h-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10" @click.self="selectedBlockId = null">
          <div
            class="mx-auto max-w-3xl cursor-default rounded-[1.35rem] bg-white px-6 py-10 shadow-[0_2px_3px_rgba(15,23,42,0.04),0_12px_40px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 sm:px-10 sm:py-12 lg:px-14 lg:py-14"
            @click.self="selectedBlockId = null"
          >
            <StudioBlockCanvas
              v-model="blocks"
              :selected-block-id="selectedBlockId"
              :data-sources="dataSources"
              :pages="pages"
              @select-block="selectedBlockId = $event"
              @update="updateBlock"
              @duplicate-block="duplicateBlock"
              @remove-block="onRemoveBlock"
              @block-action="onBlockAction"
            />
          </div>
        </div>
      </main>
      </template>

      <div
        v-else-if="isStatsDataRemote && loadState === 'error'"
        class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      >
        <p class="max-w-md text-sm text-slate-600">{{ loadError }}</p>
        <div class="flex flex-wrap justify-center gap-2">
          <AppButton variant="primary" size="md" type="button" @click="reloadDocument">Réessayer</AppButton>
          <AppButton as="router-link" :to="backTo" variant="secondary" size="md">Retour</AppButton>
        </div>
      </div>

      <AppStudioLoading v-else />
    </div>
  </div>
</template>
