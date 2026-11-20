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
import StudioBottomTabBar from '@/components/studio/mobile/StudioBottomTabBar.vue'
import StudioBottomSheet from '@/components/studio/mobile/StudioBottomSheet.vue'
import StudioMobileSheetContent from '@/components/studio/mobile/StudioMobileSheetContent.vue'
import { useStudioBreakpoint } from '@/composables/useStudioBreakpoint'
import { useStudioShortcuts } from '@/composables/useStudioShortcuts'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { provideBlockSkin } from '@/lib/block-skin'
import CanvasBar from '@/components/studio/canvas/CanvasBar.vue'
import StudioToast from '@/components/studio/ui/StudioToast.vue'

const route = useRoute()
const studio = useStudioStore()
const { isMobile } = useStudioBreakpoint()
const datasets = useStudioDatasetsStore()
const { saveNow } = useStudioAutosave()
const {
  isOpen: publishOpen,
  isPublishing,
  mode: publishMode,
  nextVersion: publishNextVersion,
  documentId: publishDocumentId,
  open: openPublish,
  close: closePublish,
  confirm: confirmPublish,
} = useStudioPublish(saveNow)
const { fail } = useStudioDocumentGuard()
const meta = useStudioMetaStore()

// Canevas = la page telle que publiée : blocs habillés comme sur le site public.
provideBlockSkin('tranches')
useStudioShortcuts(saveNow)

onMounted(async () => {
  const documentId = route.params.slug as string | undefined
  const routeType = (route.params.type as ContentType | undefined) ?? 'statsdata'
  datasets.loadDatasets()

  if (documentId) {
    try {
      const doc = await fetchStatsDataDocument(documentId)
      meta.init(doc)
      studio.initPage(
        {
          id: doc.id,
          type: doc.type ?? routeType,
          survey_kind: doc.survey_kind,
          title: doc.title,
          status: doc.status as 'draft' | 'published',
          categories: doc.categories ?? [],
          slug: doc.slug,
          published_version: doc.published_version ?? null,
          first_published_at: doc.first_published_at ?? null,
          last_published_at: doc.last_published_at ?? null,
          updated_at: doc.updated_at ?? null,
          published_as: doc.published_as ?? null,
          channel_id: doc.channel_id ?? null,
          access: doc.access,
        },
        doc.sections,
        doc.blocks,
        doc.pages,
        { seedEmptySection: true },
      )
    } catch (e) {
      fail(getHttpErrorStatus(e, 404))
    }
  } else {
    meta.init(null)
    studio.initPage({ id: 'demo', type: routeType, title: 'Mon dashboard' })
  }
})

onBeforeUnmount(() => {
  if (studio.isDirty) saveNow()
  void meta.flush()
})
</script>

<template>
  <div class="st-app flex h-screen w-screen flex-col overflow-hidden" :class="studio.isPreview ? 'st-preview' : 'st-edit'">
    <StudioHeader :publishing="isPublishing" @save="saveNow" @publish="openPublish" />
    <StudioPublishModal
      v-if="publishOpen"
      :mode="publishMode"
      :next-version="publishNextVersion"
      :publishing="isPublishing"
      :document-id="publishDocumentId"
      @close="closePublish"
      @confirm="confirmPublish"
    />

    <!-- Barre de mise en forme du texte : flottante, au-dessus du canevas -->
    <div v-if="!studio.isPreview" class="relative z-30 h-0">
      <div class="pointer-events-none absolute top-14 flex w-full justify-center">
        <div class="pointer-events-auto">
          <TextFormatToolbar />
        </div>
      </div>
    </div>

    <!-- Corps : rail · panneau · canevas · inspecteur -->
    <div v-if="!isMobile" class="flex min-h-0 flex-1 overflow-hidden">
      <StudioSidebarLeft v-if="!studio.isPreview" />
      <main class="st-canvas flex-1" :class="{ 'st-show-tags': studio.showBlockTags }" @click.self="studio.selectBlock(null)">
        <CanvasBar />
        <CanvasGrid />
      </main>
      <StudioSidebarRight v-if="!studio.isPreview" />
    </div>

    <!-- Corps (mobile) : canevas plein écran + barre d'onglets et tiroir en bas -->
    <div v-else class="flex min-h-0 flex-1 overflow-hidden">
      <main
        class="st-canvas flex-1"
        :class="[{ 'st-show-tags': studio.showBlockTags }, !studio.isPreview && 'pb-16']"
        @click.self="studio.selectBlock(null)"
      >
        <CanvasBar />
        <CanvasGrid />
      </main>
      <template v-if="!studio.isPreview">
        <StudioBottomTabBar />
        <StudioBottomSheet>
          <StudioMobileSheetContent />
        </StudioBottomSheet>
      </template>
    </div>

    <StudioToast />
  </div>
</template>
