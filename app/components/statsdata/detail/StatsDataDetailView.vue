<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStatsDataDetail } from '@/composables/useStatsDataDetail'
import { publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import StatsDataBreadcrumb from './StatsDataBreadcrumb.vue'
import StatsDataHeader from './StatsDataHeader.vue'
import StatsDataCover from './StatsDataCover.vue'
import StatsDataPageTabs from './StatsDataPageTabs.vue'

import StatsDataContent from './StatsDataContent.vue'
import StatsDataSidebar from './StatsDataSidebar.vue'

const {
  docSlug,
  doc,
  loading,
  error,
  activePage,
  allPages,
  pageSections,
  resolveToken,
} = useStatsDataDetail()

usePageSeo({
  title: computed(() => (doc.value?.title ? resolveToken(doc.value.title) : undefined)),
  description: computed(() => doc.value?.description ?? undefined),
})

const pageTitle = computed(() => resolveToken(doc.value?.title ?? ''))

const basePath = useContentBasePath()
const listPath = computed(() => publicContentListPath('statsdata', basePath.value))

const propertiesPath = computed(() => (doc.value?.slug ? `/statsdata/${doc.value.slug}/proprietes` : null))
const studioPath = computed(() => (doc.value ? `/studio/${doc.value.type ?? 'statsdata'}/${doc.value.slug ?? doc.value.id}` : null))

const profileEditPath = computed(() =>
  doc.value?.published_as === 'channel' && doc.value.channel?.id
    ? `/channels/${doc.value.channel.id}/dashboard/profil`
    : '/user',
)

const accentColor = computed(() => doc.value?.channel?.custom_color_primary ?? null)
const category = computed(() => doc.value?.categories?.[0] ?? null)

const isFavorite = ref(false)
const isFollowing = ref(false)
</script>

<template>
  <main class="overflow-x-hidden pb-24 pt-4">
    <section class="py-6 sm:py-8">
      <div class="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 sm:gap-6 sm:px-6">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-40">
          <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-24 text-center text-slate-500">
          <p class="text-lg font-medium">{{ error }}</p>
          <RouterLink :to="listPath" class="mt-4 inline-block text-sm text-primary underline">← Retour au catalogue</RouterLink>
        </div>

        <template v-else-if="doc">
          <StatsDataBreadcrumb
            :doc-title="doc.title"
            :doc-slug="docSlug"
            :category="category"
            :accent-color="accentColor"
          />

          <StatsDataHeader
            :title="pageTitle"
            :description="doc.description"
            :is-favorite="isFavorite"
            :can-edit="doc.can_edit ?? false"
            :properties-path="propertiesPath"
            :studio-path="studioPath"
            @toggle-favorite="isFavorite = !isFavorite"
          />

          <StatsDataCover :categories="doc.categories" :emoji="doc.emoji" :thumbnail-url="doc.thumbnail_url" />

          <StatsDataPageTabs
            v-if="allPages.length > 0"
            :doc-slug="docSlug"
            :pages="allPages"
            :active-page-id="activePage?.id"
            :accent-color="accentColor"
          />



          <!-- 2/3 + 1/3 layout -->
          <div class="grid w-full grid-cols-1 gap-6 overflow-x-hidden lg:items-start lg:grid-cols-[minmax(0,3fr)_minmax(260px,380px)]">
            <div class="flex min-w-0 flex-col gap-4">
              <StatsDataContent :sections="pageSections" :resolve-token="resolveToken" :is-template="activePage?.isTemplate" />
            </div>

            <StatsDataSidebar
              :author-name="doc.author?.name"
              :created-at="doc.created_at"
              :updated-at="doc.updated_at"
              :is-following="isFollowing"
              :can-edit="doc.can_edit ?? false"
              :profile-edit-path="profileEditPath"
              :datasets="doc.datasets ?? []"
              :slug="doc.slug"
              @toggle-follow="isFollowing = !isFollowing"
            />
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
