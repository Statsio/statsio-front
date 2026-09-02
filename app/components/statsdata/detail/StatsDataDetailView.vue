<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useStatsDataDetail } from '@/composables/useStatsDataDetail'
import { useStatsDataChrome } from '@/composables/useStatsDataChrome'
import { publicContentListPath } from '@/lib/content-display'
import { sectionAnchorId } from '@/lib/slug'
import { useContentBasePath } from '@/composables/useContentBasePath'
import StatsDataHero from './StatsDataHero.vue'
import StatsDataSubHeader from './StatsDataSubHeader.vue'
import StatsDataToc from './StatsDataToc.vue'
import StatsDataUsefulBar from './StatsDataUsefulBar.vue'
import StatsDataEmbedModal from './StatsDataEmbedModal.vue'
import StatsDataContent from './StatsDataContent.vue'

const props = withDefaults(defineProps<{ embed?: boolean }>(), { embed: false })

const {
  docSlug,
  doc,
  loading,
  error,
  activePage,
  allPages,
  pageSections,
  canvasItems,
  resolveToken,
} = useStatsDataDetail()

const route = useRoute()
const studio = useStudioStore()

const {
  isFavorite,
  isFollowing,
  canFollowChannel,
  toggleFavoriteAction,
  toggleFollowAction,
  shareUrl,
  embedUrl,
  embedSnippet,
  canWebShare,
  nativeShare,
  shareTargets,
} = useStatsDataChrome(doc)

const showEmbedModal = ref(false)

// Page fan-out atteinte sans valeur (clic d'onglet, URL nue) : contenu « vide »,
// on la sort de l'index — seules les vraies pages par valeur doivent être indexées.
const emptyFanOutPage = computed(() => {
  const param = activePage.value?.params?.find((p) => p.fanOut && p.name)
  if (!param) return false
  const key = param.slugColumn || param.column || param.name
  return !studio.pageParams[key] && !studio.pageParams[param.name]
})

usePageSeo({
  title: computed(() => (doc.value?.title ? resolveToken(doc.value.title) : undefined)),
  description: computed(() => (doc.value?.description ? resolveToken(doc.value.description) : undefined)),
  canonical: computed(() => route.path),
  robots: computed(() => (props.embed || emptyFanOutPage.value ? 'noindex,follow' : undefined)),
})

const pageTitle = computed(() => resolveToken(doc.value?.title ?? ''))

const basePath = useContentBasePath()
const listPath = computed(() => publicContentListPath('statsdata', basePath.value))

// Ancre de la 1re section qui contient un bloc recherche → CTA « chercher ma commune ».
const searchAnchor = computed(() => {
  for (const section of pageSections.value) {
    const zones = Object.keys(studio.blocksByZone).filter((z) => z.startsWith(`${section.id}-`))
    const hasSearch = zones.some((z) => (studio.blocksByZone[z] ?? []).some((b) => b.type === 'search'))
    const anchor = sectionAnchorId(section)
    if (hasSearch && anchor) return anchor
  }
  return null
})
</script>

<template>
  <div class="min-h-screen bg-[var(--studio-wash)] font-sans text-[var(--studio-ink)]">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-40">
      <svg class="h-8 w-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-24 text-center text-[var(--studio-muted)]">
      <p class="text-lg font-medium">{{ error }}</p>
      <RouterLink :to="listPath" class="mt-4 inline-block text-sm text-[var(--color-primary)] underline">← Retour au catalogue</RouterLink>
    </div>

    <template v-else-if="doc">
      <!-- Embed : contenu seul -->
      <template v-if="embed">
        <main class="mx-auto flex max-w-[1180px] flex-col gap-4 px-3 py-4 sm:px-5">
          <StatsDataContent :items="canvasItems" />
          <a
            :href="shareUrl"
            target="_blank"
            rel="noopener"
            class="block text-center text-[11px] font-semibold text-[var(--studio-faint)] hover:text-[var(--studio-muted)]"
          >Réalisé avec Statsio →</a>
        </main>
      </template>

      <!-- Page publique complète -->
      <template v-else>
        <StatsDataSubHeader
          :title="pageTitle"
          :doc-slug="docSlug"
          :pages="allPages"
          :active-page-id="activePage?.id"
          :accent-color="doc.channel?.custom_color_primary ?? null"
          :is-favorite="isFavorite"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          :can-edit="doc.can_edit ?? false"
          :share-url="shareUrl"
          :can-web-share="canWebShare"
          :share-targets="shareTargets"
          @toggle-favorite="toggleFavoriteAction"
          @toggle-follow="toggleFollowAction"
          @native-share="nativeShare"
          @open-embed="showEmbedModal = true"
        />

        <StatsDataHero
          :doc="doc"
          :title="pageTitle"
          :is-favorite="isFavorite"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          :search-anchor="searchAnchor"
          @toggle-favorite="toggleFavoriteAction"
          @toggle-follow="toggleFollowAction"
        />

        <div class="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div class="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[184px_minmax(0,1fr)] lg:items-start">
            <div class="lg:sticky lg:top-40">
              <StatsDataToc />
            </div>

            <main class="flex min-w-0 flex-col gap-4 pb-24">
              <StatsDataContent :items="canvasItems" />

              <StatsDataUsefulBar
                :is-favorite="isFavorite"
                :is-following="isFollowing"
                :can-follow="canFollowChannel"
                :can-edit="doc.can_edit ?? false"
                :share-url="shareUrl"
                :can-web-share="canWebShare"
                :share-targets="shareTargets"
                @toggle-favorite="toggleFavoriteAction"
                @toggle-follow="toggleFollowAction"
                @native-share="nativeShare"
                @open-embed="showEmbedModal = true"
              />
            </main>
          </div>
        </div>

        <StatsDataEmbedModal v-model:open="showEmbedModal" :snippet="embedSnippet" :preview-url="embedUrl" />
      </template>
    </template>
  </div>
</template>
