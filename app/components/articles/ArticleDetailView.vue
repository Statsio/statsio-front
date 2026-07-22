<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import { fetchPublicArticles, fetchPublicStatsDataDocument, type StatsDataDocument } from '@/api/studio'
import { toggleChannelSubscription } from '@/api/channels'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'
import { getNameInitials } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'
import { publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  categories?: string[]
}>()

const route = useRoute()
const router = useRouter()
const studio = useStudioStore()
const auth = useAuthStore()
const basePath = useContentBasePath()

const slug = computed(() => String(route.params.slug ?? ''))

const article = ref<StatsDataDocument | null>(null)
const relatedArticles = ref<StatsDataDocument[]>([])
const loading = ref(true)

usePageSeo({
  title: computed(() => article.value?.title),
  description: computed(() => article.value?.description ?? undefined),
  image: computed(() => article.value?.thumbnail_url ?? undefined),
  type: 'article',
})

const category = computed(() => {
  const first = article.value?.categories?.[0]
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Article'
})
const categoryClass = computed(() => getCategoryColorClass(article.value?.categories?.[0] ?? 'article'))

const otherBlocks = computed(() => (studio.blocks ?? []).filter((block: StudioBlock) => !isFormBlock(block.type)))

const TEXT_BLOCK_TYPES = new Set(['heading', 'paragraph', 'quote', 'callout'])
const BLOCKS_WITH_OWN_TITLE = new Set(['kpi', 'checkboxes', 'choice', 'dropdown', 'rating', 'scale'])
function isTextBlock(block: StudioBlock) {
  return TEXT_BLOCK_TYPES.has(block.type)
}
function showsExternalTitle(block: StudioBlock) {
  return !!block.config.title && !BLOCKS_WITH_OWN_TITLE.has(block.type)
}

function stripHtml(html?: string) {
  return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const readingMinutes = computed(() => {
  let words = 0
  for (const block of otherBlocks.value) {
    words += isTextBlock(block) ? stripHtml(block.config.content).split(' ').filter(Boolean).length : 70
  }
  return Math.max(1, Math.round(words / 200))
})

const tocItems = computed(() =>
  otherBlocks.value
    .filter((block) => block.type === 'heading')
    .map((block) => ({ id: block.id, label: stripHtml(block.config.content) }))
    .filter((item) => item.label.length > 0),
)

const channel = computed(() => article.value?.channel ?? null)
const isChannelAuthored = computed(() => article.value?.published_as === 'channel' && !!channel.value)
const authorName = computed(() => channel.value?.name ?? article.value?.author?.name ?? 'Anonyme')
const authorInitials = computed(() => getNameInitials(authorName.value))
const authorColor = computed(() =>
  channel.value
    ? resolveChannelColors(String(channel.value.id), channel.value.custom_color_primary, channel.value.custom_color_secondary).primary
    : 'var(--color-primary)',
)
const authorLogoUrl = computed(() => channel.value?.logo_url ?? null)
const authorAvatarBg = computed(() => {
  if (!channel.value) return 'var(--color-primary)'
  const colors = resolveChannelColors(String(channel.value.id), channel.value.custom_color_primary, channel.value.custom_color_secondary)
  return channelBannerStyle(colors.primary, colors.secondary).background
})
const channelPath = computed(() => (channel.value?.handle ? `/channels/${encodeURIComponent(channel.value.handle)}` : null))

const following = ref(false)
const followBusy = ref(false)
async function toggleFollow() {
  if (!channel.value) return
  if (!auth.isAuthenticated) {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
      localStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
    } catch {
      /* stockage indisponible */
    }
    router.push('/login')
    return
  }
  const channelId = channel.value.id
  following.value = !following.value
  followBusy.value = true
  try {
    const result = await toggleChannelSubscription(channelId)
    following.value = result.isFollowing
  } catch {
    following.value = !following.value
  } finally {
    followBusy.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const listPath = computed(() => publicContentListPath('article', basePath.value))

onMounted(async () => {
  try {
    const [doc, articles] = await Promise.all([
      fetchPublicStatsDataDocument(slug.value),
      fetchPublicArticles(props.categories),
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
  <main class="pb-24 pt-4">
    <!-- Loading -->
    <section v-if="loading" class="section">
      <div class="container flex items-center justify-center py-40">
        <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </section>

    <template v-else-if="article">
      <section class="pb-16">
        <div class="container flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div class="min-w-0 flex-1 lg:max-w-[720px]">
            <RouterLink :to="listPath" class="mb-4 inline-block text-[13px] text-slate-400 transition hover:text-slate-600">
              &larr; Retour aux articles
            </RouterLink>

            <p class="eyebrow tracking-[0.05em]" :class="categoryClass">{{ category }}</p>

            <h1 class="mt-3.5 text-[28px] font-bold leading-[1.15] tracking-tight text-slate-950 sm:text-[34px] lg:text-[38px]">
              {{ article.title }}
            </h1>

            <div class="mt-5 flex flex-wrap items-center gap-2.5">
              <RouterLink v-if="channelPath" :to="channelPath" class="flex items-center gap-2.5">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-xs font-bold text-white"
                  :style="authorLogoUrl ? undefined : { background: authorAvatarBg }"
                >
                  <img v-if="authorLogoUrl" :src="authorLogoUrl" :alt="authorName" class="h-full w-full object-cover" />
                  <template v-else>{{ authorInitials }}</template>
                </span>
                <span class="text-[13.5px] font-semibold text-slate-950">{{ authorName }}</span>
              </RouterLink>
              <template v-else>
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-xs font-bold text-white"
                  :style="authorLogoUrl ? undefined : { background: authorAvatarBg }"
                >
                  <img v-if="authorLogoUrl" :src="authorLogoUrl" :alt="authorName" class="h-full w-full object-cover" />
                  <template v-else>{{ authorInitials }}</template>
                </span>
                <span class="text-[13.5px] font-semibold text-slate-950">{{ authorName }}</span>
              </template>
              <span class="text-[12.5px] text-slate-400">
                &middot; {{ readingMinutes }} min de lecture
                <template v-if="formatDate(article.updated_at)"> &middot; {{ formatDate(article.updated_at) }}</template>
              </span>
            </div>

            <div v-if="article.thumbnail_url" class="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img :src="article.thumbnail_url" :alt="article.title" class="h-[220px] w-full object-cover sm:h-[280px] lg:h-[320px]" />
            </div>

            <p v-if="article.description" class="mt-7 text-base leading-8 text-slate-700">
              {{ article.description }}
            </p>

            <div class="mt-7 flex flex-col gap-7">
              <div v-for="block in otherBlocks" :id="`block-${block.id}`" :key="block.id" class="scroll-mt-40 lg:scroll-mt-32">
                <template v-if="isTextBlock(block)">
                  <BlockRenderer :block="block" :readonly="true" />
                </template>
                <div v-else class="card p-5">
                  <p v-if="showsExternalTitle(block)" class="mb-3.5 text-[13px] font-bold text-slate-950">{{ block.config.title }}</p>
                  <BlockRenderer :block="block" :readonly="true" />
                </div>
              </div>

              <div v-if="otherBlocks.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-slate-400">
                <p class="text-sm">Cet article ne contient aucun contenu pour le moment.</p>
              </div>
            </div>

            <div v-if="isChannelAuthored" class="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <RouterLink v-if="channelPath" :to="channelPath" class="flex items-center gap-2.5">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-xs font-bold text-white"
                  :style="authorLogoUrl ? undefined : { background: authorAvatarBg }"
                >
                  <img v-if="authorLogoUrl" :src="authorLogoUrl" :alt="authorName" class="h-full w-full object-cover" />
                  <template v-else>{{ authorInitials }}</template>
                </span>
                <span class="text-[13.5px] font-semibold text-slate-950">{{ authorName }}</span>
              </RouterLink>
              <button
                type="button"
                class="shrink-0 rounded-[10px] border px-5 py-2.5 text-[13.5px] font-bold transition disabled:opacity-60"
                :style="following ? { background: authorColor, borderColor: authorColor, color: '#fff' } : { borderColor: authorColor, color: authorColor }"
                :disabled="followBusy"
                @click="toggleFollow"
              >
                {{ following ? 'Abonné' : 'Suivre' }}
              </button>
            </div>
          </div>

          <aside class="w-full lg:w-[280px] lg:shrink-0">
            <div class="card sticky top-28 p-5">
              <p class="eyebrow mb-3.5">Sommaire</p>
              <nav v-if="tocItems.length > 0" class="flex flex-col gap-2.5 text-[13.5px]">
                <a
                  v-for="item in tocItems"
                  :key="item.id"
                  :href="`#block-${item.id}`"
                  class="text-slate-600 transition hover:text-[var(--color-primary)]"
                >
                  {{ item.label }}
                </a>
              </nav>
              <RouterLink v-else :to="listPath" class="inline-block text-[13.5px] font-semibold text-[var(--color-primary)]">
                Revenir aux articles
              </RouterLink>
            </div>
          </aside>
        </div>
      </section>

      <section v-if="relatedArticles.length > 0" class="pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="eyebrow">À lire aussi</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres articles liés</h2>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <ArticleTeaserCard v-for="item in relatedArticles" :key="item.slug" :article="item" />
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
