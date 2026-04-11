<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import AppStudioDocumentHeader from '@/components/layout/AppStudioDocumentHeader.vue'
import StudioSidebar from '@/components/studio/StudioSidebar.vue'
import StudioInspectorSidebar from '@/components/studio/StudioInspectorSidebar.vue'
import StudioBlockCanvas from '@/components/studio/StudioBlockCanvas.vue'
import { useStudioDocument } from '@/composables/useStudioDocument'
import type { StudioBlockType, StudioDocumentKind } from '@/types/studio-document'

const route = useRoute()

const documentKind = computed<StudioDocumentKind>(() =>
  route.meta.studioDocumentKind === 'article' ? 'article' : 'statsdata',
)

const { isCreate, title, blocks, settings, isDirty, addBlock, removeBlock, duplicateBlock, updateBlock } =
  useStudioDocument(route, documentKind)

const selectedBlockId = ref<string | null>(null)

const selectedBlock = computed(() => blocks.value.find((b) => b.id === selectedBlockId.value) ?? null)

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

const backTo = computed(() => (documentKind.value === 'article' ? '/articles' : '/statsdata'))

const backAriaLabel = computed(() =>
  documentKind.value === 'article' ? 'Revenir à la liste des articles' : 'Revenir au catalogue StatsData',
)

const mode = computed<'create' | 'edit'>(() => (isCreate.value ? 'create' : 'edit'))
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_12%,#f8fafc_38%)] text-slate-900">
    <AppStudioDocumentHeader
      :title="title"
      :document-kind="documentKind"
      :back-to="backTo"
      :back-aria-label="backAriaLabel"
      :quit-to="backTo"
      :is-dirty="isDirty"
      :mode="mode"
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

    <div class="mx-auto flex min-h-0 max-w-[1920px] flex-1 flex-col lg:min-h-[calc(100vh-4.5rem)] lg:flex-row">
      <StudioSidebar @add-block="onAddBlock" />

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

      <StudioInspectorSidebar
        v-model:settings="settings"
        :selected-block="selectedBlock"
        @update-block="updateBlock"
        @remove-block="onRemoveBlock"
        @duplicate-block="duplicateBlock"
      />
    </div>
  </div>
</template>
