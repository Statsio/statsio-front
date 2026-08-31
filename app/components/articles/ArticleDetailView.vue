<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ArticleSubHeader from '@/components/articles/ArticleSubHeader.vue'
import ArticleHero from '@/components/articles/ArticleHero.vue'
import ArticleToc from '@/components/articles/ArticleToc.vue'
import ArticleBody from '@/components/articles/ArticleBody.vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import StatsDataUsefulBar from '@/components/statsdata/detail/StatsDataUsefulBar.vue'
import StatsDataEmbedModal from '@/components/statsdata/detail/StatsDataEmbedModal.vue'
import { fetchPublicArticles, fetchPublicStatsDataDocument, type StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { useStatsDataChrome } from '@/composables/useStatsDataChrome'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { isFormBlock, isTextBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { publicContentListPath } from '@/lib/content-display'

const props = withDefaults(defineProps<{ categories?: string[]; embed?: boolean }>(), { embed: false })

const route = useRoute()
const studio = useStudioStore()
const basePath = useContentBasePath()

const slug = computed(() => String(route.params.slug ?? ''))

const article = ref<StatsDataDocument | null>(null)
const relatedArticles = ref<StatsDataDocument[]>([])
const loading = ref(true)

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
} = useStatsDataChrome(article, { contentType: 'article' })

const showEmbedModal = ref(false)

usePageSeo({
  title: computed(() => article.value?.title),
  description: computed(() => article.value?.description ?? undefined),
  image: computed(() => article.value?.thumbnail_url ?? undefined),
  canonical: computed(() => route.path),
  robots: computed(() => (props.embed ? 'noindex,follow' : undefined)),
  type: 'article',
})

// ─── Blocs dérivés ───────────────────────────────────────────────────────────

function stripHtml(html?: string) {
  return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const contentBlocks = computed<StudioBlock[]>(() =>
  (studio.blocks ?? []).filter((b) => !isFormBlock(b.type)),
)

const readingMinutes = computed(() => {
  let words = 0
  for (const block of contentBlocks.value) {
    words += isTextBlock(block.type) ? stripHtml(block.config.content).split(' ').filter(Boolean).length : 60
  }
  return Math.max(1, Math.round(words / 200))
})

// Sommaire : en-têtes de section (titre + ancre) dans l'ordre, + blocs `heading`
// avec du contenu (articles édités « à la main »).
const tocEntries = computed(() => {
  const out: { id: string; label: string }[] = []
  for (const section of studio.currentPageSections) {
    if (section.title && section.anchorId) {
      out.push({ id: section.anchorId, label: section.title })
    }
    const zones = Object.keys(studio.blocksByZone).filter((z) => z.startsWith(`${section.id}-`))
    for (const zone of zones) {
      for (const b of studio.blocksByZone[zone] ?? []) {
        if (b.type !== 'heading') continue
        const label = stripHtml(b.config.content)
        if (label) out.push({ id: `block-${b.id}`, label })
      }
    }
  }
  return out
})

const linkedStatsData = computed(() =>
  contentBlocks.value
    .filter((b) => b.type === 'sd-embed' && b.config.sourceBlockId)
    .map((b) => ({ id: `block-${b.id}`, title: b.config.sourceDocTitle || b.config.sourceSlug || 'Statsdata' })),
)

const editHref = computed(() =>
  article.value?.can_edit ? `/studio/article/${article.value.slug ?? slug.value}` : null,
)

const listPath = computed(() => publicContentListPath('article', basePath.value))

onMounted(async () => {
  try {
    const [doc, articles] = await Promise.all([
      fetchPublicStatsDataDocument(slug.value),
      props.embed ? Promise.resolve([] as StatsDataDocument[]) : fetchPublicArticles(props.categories),
    ])

    article.value = doc
    relatedArticles.value = articles.filter((item) => item.slug !== doc.slug).slice(0, 2)

    studio.initPage(
      { id: doc.id, type: 'article', title: doc.title, status: doc.status as 'draft' | 'published', slug: slug.value },
      doc.sections,
      doc.blocks,
      doc.pages,
    )
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Cet article est introuvable ou non publié.',
        fatal: true,
      }),
    )
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[var(--studio-wash)] font-sans text-[var(--studio-ink)]">
    <div v-if="loading" class="flex items-center justify-center py-40">
      <svg class="h-8 w-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <template v-else-if="article">
      <!-- Embed : corps seul -->
      <template v-if="embed">
        <main class="mx-auto max-w-[820px] px-4 py-6 sm:px-6">
          <article class="rounded-[18px] bg-[var(--studio-surface)] p-6 shadow-[var(--studio-shadow-card)] sm:p-9">
            <ArticleBody />
          </article>
          <a
            :href="shareUrl"
            target="_blank"
            rel="noopener"
            class="mt-4 block text-center text-[11px] font-semibold text-[var(--studio-faint)] hover:text-[var(--studio-muted)]"
          >Réalisé avec Statsio →</a>
        </main>
      </template>

      <!-- Page publique complète -->
      <template v-else>
        <ArticleSubHeader
          :title="article.title"
          :edit-href="editHref"
          :is-favorite="isFavorite"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          :can-edit="article.can_edit ?? false"
          :share-url="shareUrl"
          :can-web-share="canWebShare"
          :share-targets="shareTargets"
          @toggle-favorite="toggleFavoriteAction"
          @toggle-follow="toggleFollowAction"
          @native-share="nativeShare"
          @open-embed="showEmbedModal = true"
        />

        <ArticleHero
          :doc="article"
          :reading-minutes="readingMinutes"
          :linked-count="linkedStatsData.length"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          @toggle-follow="toggleFollowAction"
        />

        <div class="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div
            v-if="article.thumbnail_url"
            class="mt-8 overflow-hidden rounded-[18px] border border-[var(--studio-line)] bg-white"
          >
            <img :src="article.thumbnail_url" :alt="article.title" class="h-[240px] w-full object-cover sm:h-[320px] lg:h-[380px]" />
          </div>

          <div class="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[212px_minmax(0,1fr)] lg:items-start">
            <div class="lg:sticky lg:top-40">
              <ArticleToc :entries="tocEntries" :linked="linkedStatsData" />
            </div>

            <main class="flex min-w-0 flex-col gap-4 pb-20">
              <article class="rounded-[18px] bg-[var(--studio-surface)] p-6 shadow-[var(--studio-shadow-card)] sm:p-[38px_44px]">
                <ArticleBody />
              </article>

              <StatsDataUsefulBar
                :is-favorite="isFavorite"
                :is-following="isFollowing"
                :can-follow="canFollowChannel"
                :can-edit="article.can_edit ?? false"
                :share-url="shareUrl"
                :can-web-share="canWebShare"
                :share-targets="shareTargets"
                @toggle-favorite="toggleFavoriteAction"
                @toggle-follow="toggleFollowAction"
                @native-share="nativeShare"
                @open-embed="showEmbedModal = true"
              />

              <section v-if="relatedArticles.length" class="mt-8 flex flex-col gap-5">
                <p class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">À lire aussi</p>
                <div class="grid gap-5 sm:grid-cols-2">
                  <ArticleTeaserCard v-for="item in relatedArticles" :key="item.slug" :article="item" />
                </div>
                <RouterLink :to="listPath" class="text-[13px] font-semibold text-[var(--color-primary)]">
                  Tous les articles →
                </RouterLink>
              </section>
            </main>
          </div>
        </div>

        <StatsDataEmbedModal v-model:open="showEmbedModal" :snippet="embedSnippet" :preview-url="embedUrl" />
      </template>
    </template>
  </div>
</template>
