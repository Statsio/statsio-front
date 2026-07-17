<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicArticles, fetchPublicStatsDataDocument, type StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'
import { publicContentPath, publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  categories?: string[]
}>()

const route = useRoute()
const studio = useStudioStore()
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

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const listPath = computed(() => publicContentListPath('article', basePath.value))
function relatedPath(itemSlug?: string) {
  return publicContentPath('article', itemSlug ?? '', basePath.value)
}

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
      <section class="section pb-10">
        <div class="container flex flex-col gap-10">
          <div class="flex flex-col gap-5">
            <p class="eyebrow" :class="categoryClass">{{ category }}</p>
            <div class="flex max-w-5xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ article.title }}
              </h1>
              <p v-if="article.description" class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ article.description }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ article.author?.name ?? 'Anonyme' }}</span>
              <span v-if="formatDate(article.updated_at)">Mis à jour le {{ formatDate(article.updated_at) }}</span>
            </div>
          </div>

          <div
            v-if="article.thumbnail_url"
            class="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_36px_110px_-62px_rgba(15,23,42,0.45)]"
          >
            <img :src="article.thumbnail_url" :alt="article.title" class="h-[280px] w-full object-cover sm:h-[360px] lg:h-[460px]" />
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div class="flex flex-col gap-6">
              <div
                v-for="block in otherBlocks"
                :key="block.id"
                class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)]"
              >
                <BlockRenderer :block="block" :readonly="true" />
              </div>

              <div
                v-if="otherBlocks.length === 0"
                class="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-slate-400"
              >
                <p class="text-sm">Cet article ne contient aucun contenu pour le moment.</p>
              </div>
            </div>

            <aside class="flex flex-col gap-5">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Suite</p>
                  <AppButton as="router-link" :to="listPath" variant="secondary" size="md">
                    Revenir aux articles
                  </AppButton>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section v-if="relatedArticles.length > 0" class="section pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="eyebrow">À lire aussi</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres articles liés</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedArticles"
              :key="item.slug"
              :to="relatedPath(item.slug)"
              class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.categories?.[0] ?? 'Article' }}
                </span>
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <span class="text-sm font-semibold text-primary">Lire l’article</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
