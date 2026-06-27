<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['auth'], ssr: false })
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioAutosave } from '@/composables/useStudioAutosave'
import { fetchStatsDataDocument } from '@/api/studio'
import StudioHeader from '@/components/studio/StudioHeader.vue'
import TextFormatToolbar from '@/components/studio/TextFormatToolbar.vue'
import StudioSidebarLeft from '@/components/studio/StudioSidebarLeft.vue'
import StudioSidebarRight from '@/components/studio/StudioSidebarRight.vue'
import CanvasGrid from '@/components/studio/canvas/CanvasGrid.vue'

const route = useRoute()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const { saveNow } = useStudioAutosave()

onMounted(async () => {
  const documentId = route.params.slug as string | undefined
  datasets.loadDatasets()

  if (documentId) {
    try {
      const doc = await fetchStatsDataDocument(documentId)
      studio.initPage(
        { id: doc.id, type: 'statsdata', title: doc.title, status: doc.status as 'draft' | 'published' },
        doc.sections,
        doc.blocks,
        doc.pages,
      )
    } catch {
      studio.initPage({ id: documentId, type: 'statsdata', title: 'Nouveau dashboard' })
    }
  } else {
    studio.initPage({ id: 'demo', type: 'statsdata', title: 'Mon dashboard' })
  }
})

onBeforeUnmount(() => {
  if (studio.isDirty) saveNow()
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-[#f0f1f5]">
    <!-- Header -->
    <StudioHeader @save="saveNow" />

    <!-- Floating overlays: no layout space, both absolute over the canvas -->
    <div class="relative h-0 z-30">
      <!-- Text format toolbar (centered pill, shown when a text block is active) -->
      <div class="absolute top-3 w-full flex justify-center pointer-events-none">
        <div class="pointer-events-auto">
          <TextFormatToolbar />
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Icon strip + floating panel -->
      <StudioSidebarLeft />

      <!-- Canvas (scrollable) -->
      <main
        class="flex-1 min-w-0 overflow-auto p-8"
        @click.self="studio.selectBlock(null)"
      >
        <CanvasGrid />
      </main>

      <!-- Right config panel (block selected) -->
      <StudioSidebarRight />
    </div>
  </div>
</template>
