<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicStatsDataDocument, fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { publicContentPath, publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  categories?: string[]
}>()

const route = useRoute()
const studio = useStudioStore()
const basePath = useContentBasePath()

const slug = computed(() => String(route.params.slug ?? ''))

const poll = ref<StatsDataDocument | null>(null)
const relatedPolls = ref<StatsDataDocument[]>([])
const loading = ref(true)

usePageSeo({
  title: computed(() => poll.value?.title),
  description: computed(() => poll.value?.description ?? undefined),
  type: 'article',
})

const category = computed(() => {
  const first = poll.value?.categories?.[0]
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Sondage'
})

const questionBlocks = computed(() => (studio.blocks ?? []).filter((block: StudioBlock) => isFormBlock(block.type)))
const otherBlocks = computed(() => (studio.blocks ?? []).filter((block: StudioBlock) => !isFormBlock(block.type)))

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const listPath = computed(() => publicContentListPath('survey', basePath.value))
function relatedPath(itemSlug?: string) {
  return publicContentPath('survey', itemSlug ?? '', basePath.value)
}

onMounted(async () => {
  try {
    const [doc, surveys] = await Promise.all([
      fetchPublicStatsDataDocument(slug.value),
      fetchPublicSurveys(props.categories),
    ])

    poll.value = doc
    relatedPolls.value = surveys.filter((item) => item.slug !== doc.slug).slice(0, 2)

    studio.initPage(
      { id: doc.id, type: 'survey', title: doc.title, status: doc.status as 'draft' | 'published', slug: slug.value },
      doc.sections,
      doc.blocks,
      doc.pages,
    )
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Ce sondage est introuvable ou non publié.',
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

    <template v-else-if="poll">
      <section class="section pb-10">
        <div class="container flex flex-col gap-10">
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap items-center gap-3">
              <p class="eyebrow text-primary">{{ category }}</p>
              <span class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Ouvert
              </span>
            </div>

            <div class="flex max-w-5xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ poll.title }}
              </h1>
              <p v-if="poll.description" class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ poll.description }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ poll.author?.name ?? 'Anonyme' }}</span>
              <span v-if="formatDate(poll.updated_at)">Mis à jour le {{ formatDate(poll.updated_at) }}</span>
            </div>
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

              <section
                v-for="block in questionBlocks"
                :key="block.id"
                class="rounded-[2rem] border border-slate-200 bg-white p-2 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:p-3"
              >
                <BlockRenderer :block="block" :readonly="true" />
              </section>

              <div
                v-if="questionBlocks.length === 0 && otherBlocks.length === 0"
                class="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-slate-400"
              >
                <p class="text-sm">Ce sondage ne contient aucune question pour le moment.</p>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)]">
                <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Participation</p>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      Chaque question peut être répondue indépendamment et les résultats se mettent à jour en direct.
                    </p>
                  </div>
                  <AppButton as="router-link" :to="listPath" variant="secondary" size="md">
                    Retour au listing
                  </AppButton>
                </div>
              </div>
            </div>

            <aside class="flex flex-col gap-5">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="grid gap-3">
                  <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Questions</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">{{ questionBlocks.length }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">À retenir</p>
                <ul class="mt-5 flex flex-col gap-3 text-sm leading-7 text-slate-300">
                  <li class="flex items-start gap-3">
                    <span class="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                    <span>Les réponses sont anonymes et rattachées à un identifiant visiteur.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                    <span>Vous pouvez modifier votre réponse tant que le sondage reste publié.</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section v-if="relatedPolls.length > 0" class="section pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="eyebrow">À consulter aussi</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres sondages</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedPolls"
              :key="item.slug"
              :to="relatedPath(item.slug)"
              class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.categories?.[0] ?? 'Sondage' }}
                </span>
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <span class="text-sm font-semibold text-primary">Voir et répondre</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
