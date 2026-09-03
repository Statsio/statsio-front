<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardShell from '@/components/layout/DashboardShell.vue'
import ContentSidebar from '@/components/contents/dashboard/ContentSidebar.vue'
import ContentTopbar from '@/components/contents/dashboard/ContentTopbar.vue'
import StudioPublishModal from '@/components/studio/StudioPublishModal.vue'
import { useContentDashboard } from '@/composables/useContentDashboard'

usePageSeo({ title: 'Propriétés du contenu', robots: 'noindex,nofollow' })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const {
  content, isLoading, loadError, ensureLoaded, slugOrId,
  publishModalOpen, publishMode, publishNextVersion, isPublishing, confirmPublish,
} = useContentDashboard()

onMounted(() => ensureLoaded(slug.value))
watch(slug, (value) => ensureLoaded(value))
</script>

<template>
  <DashboardShell>
    <template #sidebar="{ close }">
      <ContentSidebar @navigate="close" />
    </template>

    <template #topbar>
      <ContentTopbar />
    </template>

    <div class="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 md:px-10">
      <template v-if="isLoading">
        <div class="h-9 w-64 animate-pulse rounded-2xl bg-slate-200" />
        <div class="mt-6 space-y-4">
          <div v-for="i in 3" :key="i" class="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </template>

      <p
        v-else-if="loadError"
        class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
      >
        {{ loadError }}
      </p>

      <slot v-else-if="content" />
    </div>

    <StudioPublishModal
      v-if="publishModalOpen"
      :mode="publishMode"
      :next-version="publishNextVersion"
      :publishing="isPublishing"
      :document-id="String(slugOrId)"
      @close="publishModalOpen = false"
      @confirm="confirmPublish"
    />
  </DashboardShell>
</template>
