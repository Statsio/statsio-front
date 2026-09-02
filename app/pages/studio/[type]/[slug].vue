<script setup lang="ts">
definePageMeta({ layout: 'studio', middleware: ['auth'], ssr: false })
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioAutosave } from '@/composables/useStudioAutosave'
import { useStudioPublish } from '@/composables/useStudioPublish'
import { useStudioDocumentGuard } from '@/composables/useStudioDocumentGuard'
import { fetchStatsDataDocument } from '@/api/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import type { ContentType } from '@/types/content-creation'
import StudioHeader from '@/components/studio/StudioHeader.vue'
import StudioPublishModal from '@/components/studio/StudioPublishModal.vue'
import TextFormatToolbar from '@/components/studio/TextFormatToolbar.vue'
import StudioSidebarLeft from '@/components/studio/StudioSidebarLeft.vue'
import StudioSidebarRight from '@/components/studio/StudioSidebarRight.vue'
import CanvasGrid from '@/components/studio/canvas/CanvasGrid.vue'

const route = useRoute()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const { saveNow } = useStudioAutosave()
const {
  isOpen: publishOpen,
  isPublishing,
  mode: publishMode,
  nextVersion: publishNextVersion,
  open: openPublish,
  close: closePublish,
  confirm: confirmPublish,
} = useStudioPublish(saveNow)
const { fail } = useStudioDocumentGuard()

onMounted(async () => {
  const documentId = route.params.slug as string | undefined
  const routeType = (route.params.type as ContentType | undefined) ?? 'statsdata'
  datasets.loadDatasets()

  if (documentId) {
    try {
      const doc = await fetchStatsDataDocument(documentId)
      studio.initPage(
        {
          id: doc.id,
          type: doc.type ?? routeType,
          title: doc.title,
          status: doc.status as 'draft' | 'published',
          categories: doc.categories ?? [],
          slug: doc.slug,
          published_version: doc.published_version ?? null,
          first_published_at: doc.first_published_at ?? null,
          published_as: doc.published_as ?? null,
          channel_id: doc.channel_id ?? null,
        },
        doc.sections,
        doc.blocks,
        doc.pages,
      )
    } catch (e) {
      fail(getHttpErrorStatus(e, 404))
    }
  } else {
    studio.initPage({ id: 'demo', type: routeType, title: 'Mon dashboard' })
  }
})

onBeforeUnmount(() => {
  if (studio.isDirty) saveNow()
})
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-[var(--studio-wash)] font-sans">
    <!-- Header -->
    <StudioHeader :publishing="isPublishing" @save="saveNow" @publish="openPublish" />

    <StudioPublishModal
      v-if="publishOpen"
      :mode="publishMode"
      :next-version="publishNextVersion"
      :publishing="isPublishing"
      @close="closePublish"
      @confirm="confirmPublish"
    />

    <!-- Floating overlays: no layout space, both absolute over the canvas -->
    <div v-if="!studio.isPreview" class="relative z-30 h-0">
      <div class="pointer-events-none absolute top-3 flex w-full justify-center">
        <div class="pointer-events-auto">
          <TextFormatToolbar />
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Icon rail + panel -->
      <StudioSidebarLeft v-if="!studio.isPreview" />

      <!-- Canvas (scrollable) -->
      <main
        class="min-w-0 flex-1 overflow-auto"
        @click.self="studio.selectBlock(null)"
      >
        <CanvasGrid />
      </main>

      <!-- Right config panel (block selected) -->
      <StudioSidebarRight v-if="!studio.isPreview" />
    </div>
  </div>
</template>
