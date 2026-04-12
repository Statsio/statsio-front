<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import AppStudioDocumentHeader from '@/components/layout/AppStudioDocumentHeader.vue'
import StudioLeftDock from '@/components/studio/StudioLeftDock.vue'
import StudioSelectionContextBar from '@/components/studio/StudioSelectionContextBar.vue'
import StudioBlockCanvas from '@/components/studio/StudioBlockCanvas.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { StudioLeftTabId } from '@/components/studio/studio-left-dock.types'
import { useStudioDocument } from '@/composables/useStudioDocument'
import { getErrorMessage } from '@/lib/http-errors'
import { studioDataSourcesKey } from '@/lib/studio-inject-keys'
import type { StudioBlock, StudioBlockType, StudioDocumentKind, StudioDocumentSettings } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'

const route = useRoute()

const documentKind = computed<StudioDocumentKind>(() =>
  route.meta.studioDocumentKind === 'article' ? 'article' : 'statsdata',
)

const {
  isCreate,
  isStatsDataRemote,
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

const leftOpen = ref(false)
const leftTab = ref<StudioLeftTabId | null>(null)

const selectedBlockId = ref<string | null>(null)

const selectedBlock = computed(() => blocks.value.find((b) => b.id === selectedBlockId.value) ?? null)

watch(selectedBlockId, (id) => {
  if (id) {
    leftTab.value = 'inspector'
    leftOpen.value = true
  }
})

watch(
  blocks,
  (next) => {
    if (selectedBlockId.value && !next.some((b) => b.id === selectedBlockId.value)) {
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
      @save-draft="onSaveDraft"
      @delete-document="onDeleteDocument"
    >
      <template #title>
        <label class="sr-only" for="studio-doc-title">Titre du document</label>
        <input
          id="studio-doc-title"
          v-model="title"
          type="text"
          class="w-full max-w-xl truncate rounded-2xl border border-transparent bg-transparent px-2 py-1 text-lg font-semibold tracking-tight text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/15 sm:text-xl motion-reduce:transition-none"
          placeholder="Sans titre"
          autocomplete="off"
        />
      </template>
    </AppStudioDocumentHeader>

    <div
      v-if="apiError || autoSaveError"
      class="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm text-rose-800 sm:px-6"
      role="alert"
    >
      {{ apiError || autoSaveError }}
    </div>

    <StudioSelectionContextBar v-if="selectedBlock && studioBodyReady" :block="selectedBlock" @open-tab="openLeftTab" />

    <div class="flex min-h-0 min-h-[calc(100vh-4.5rem)] flex-1 flex-col lg:flex-row">
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
        :sources-feedback="sourcesFeedback"
        :sources-busy="sourcesBusy"
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
              @select-block="selectedBlockId = $event"
              @update="updateBlock"
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

      <div
        v-else
        class="flex flex-1 items-center justify-center px-6 py-16"
      >
        <p class="text-sm text-slate-600">Chargement du document…</p>
      </div>
    </div>
  </div>
</template>
