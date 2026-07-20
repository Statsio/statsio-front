<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import AppLockedPanel from '@/components/ui/AppLockedPanel.vue'
import { fetchPublicStatsDataDocument, fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'
import { fetchBlockResponse, type BlockResponseAggregate } from '@/api/studio-responses'
import { getChannel, toggleChannelSubscription, type Channel } from '@/api/channels'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'
import { isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { publicContentPath, publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useRespondentToken } from '@/composables/useRespondentToken'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { getPollStatus } from '@/lib/poll-status'
import { profileLabel } from '@/lib/profile-labels'

const props = defineProps<{
  categories?: string[]
}>()

const route = useRoute()
const router = useRouter()
const studio = useStudioStore()
const auth = useAuthStore()
const basePath = useContentBasePath()
const respondentToken = useRespondentToken()

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

const status = computed(() => getPollStatus(poll.value ?? {}))
const statusTone = computed(() => {
  if (status.value.closed) return { bg: 'rgba(24,24,31,0.08)', color: 'rgba(24,24,31,0.55)' }
  if (status.value.urgent) return { bg: 'rgba(245,158,11,0.16)', color: '#b45309' }
  return { bg: 'rgba(16,185,129,0.14)', color: '#10b981' }
})

const authorLabel = computed(() => poll.value?.channel?.name ?? poll.value?.author?.name ?? 'Anonyme')

/* ───────── Chaîne éditrice + suivi (si le sondage est publié via une chaîne) ───────── */

const channelName = computed(() => poll.value?.channel?.name ?? null)
const channelColor = computed(() => poll.value?.channel?.custom_color_primary || '#8b5cf6')
const channelInitials = computed(() =>
  (channelName.value ?? '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const channel = ref<Channel | null>(null)
const isFollowingChannel = ref(false)
const isTogglingFollow = ref(false)

async function loadChannel() {
  const channelId = poll.value?.channel_id
  if (poll.value?.published_as !== 'channel' || !channelId) return
  try {
    channel.value = await getChannel(channelId)
    isFollowingChannel.value = channel.value.profile?.is_following ?? false
  } catch {
    channel.value = null
  }
}

async function onToggleFollow() {
  if (isTogglingFollow.value || !poll.value?.channel_id) return

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

  isTogglingFollow.value = true
  try {
    const result = await toggleChannelSubscription(poll.value.channel_id)
    isFollowingChannel.value = result.isFollowing
  } finally {
    isTogglingFollow.value = false
  }
}

/* ───────── Questions + résultats en direct (bloc principal) ───────── */

const questionBlocks = computed(() => (studio.blocks ?? []).filter((block: StudioBlock) => isFormBlock(block.type)))
const otherBlocks = computed(() => (studio.blocks ?? []).filter((block: StudioBlock) => !isFormBlock(block.type)))
const primaryBlock = computed(() => questionBlocks.value[0])

const primaryAggregate = ref<BlockResponseAggregate | null>(null)
const primaryLoaded = ref(false)
let pollTimer: ReturnType<typeof setInterval> | undefined

const primaryTotal = computed(() => primaryAggregate.value?.totalResponses ?? 0)
/** undefined tant que non chargé, null si le back a explicitement omis les données (profil visiteur incomplet ou non connecté). */
const demographics = computed(() => primaryAggregate.value?.demographics ?? null)

async function loadPrimaryResults() {
  const block = primaryBlock.value
  if (!block || !poll.value?.slug) {
    primaryLoaded.value = true
    return
  }
  try {
    const state = await fetchBlockResponse(poll.value.slug, block.id, respondentToken.value)
    primaryAggregate.value = state.aggregate
  } catch {
    primaryAggregate.value = null
  } finally {
    primaryLoaded.value = true
  }
}

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

    await Promise.all([loadPrimaryResults(), loadChannel()])
    // Les résultats (votes + démographie) se mettent à jour en direct.
    pollTimer = setInterval(loadPrimaryResults, 6000)
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

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
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
          <div class="flex flex-col gap-4">
            <RouterLink
              :to="listPath"
              class="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[#18181f]/45 transition-colors hover:text-primary"
            >
              &larr; Retour aux sondages
            </RouterLink>

            <div class="flex flex-wrap items-center gap-3">
              <span class="inline-flex rounded-full bg-[#f2ecfd] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {{ category }}
              </span>
              <span
                class="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                :style="{ background: statusTone.bg, color: statusTone.color }"
              >
                {{ status.label }}
              </span>
            </div>

            <div class="flex max-w-4xl flex-col gap-3">
              <h1 class="text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#18181f] sm:text-[34px]">
                {{ poll.title }}
              </h1>
              <p v-if="poll.description" class="max-w-3xl text-[15px] leading-7 text-[#18181f]/60">
                {{ poll.description }}
              </p>
            </div>

            <div v-if="channelName" class="flex flex-wrap items-center gap-2.5">
              <div
                class="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-xs font-bold text-white"
                :style="{ background: channelColor }"
              >
                {{ channelInitials }}
              </div>
              <span class="text-[13.5px] font-semibold text-[#18181f]">{{ channelName }}</span>
              <span class="text-[12.5px] text-[#18181f]/45">
                · {{ primaryTotal }} répondant<span v-if="primaryTotal > 1">s</span> · {{ status.label.toLowerCase() }}
              </span>
            </div>
            <div v-else class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#18181f]/45">
              <span>Publié par <strong class="font-semibold text-[#18181f]/70">{{ authorLabel }}</strong></span>
              <span v-if="primaryLoaded && primaryTotal > 0">· {{ primaryTotal }} vote<span v-if="primaryTotal > 1">s</span></span>
              <span v-if="formatDate(poll.updated_at)">· Mis à jour le {{ formatDate(poll.updated_at) }}</span>
            </div>
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div class="flex flex-col gap-6">
              <div
                v-for="block in otherBlocks"
                :key="block.id"
                class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)]"
              >
                <BlockRenderer :block="block" :readonly="true" />
              </div>

              <section
                v-for="block in questionBlocks"
                :key="block.id"
                class="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:p-3"
              >
                <BlockRenderer :block="block" :readonly="true" />
              </section>

              <div
                v-if="questionBlocks.length === 0 && otherBlocks.length === 0"
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-[#18181f]/35"
              >
                <p class="text-sm">Ce sondage ne contient aucune question pour le moment.</p>
              </div>

              <div v-if="channelName" class="flex items-center justify-between border-t border-[#18181f]/[0.08] pt-5">
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-xs font-bold text-white"
                    :style="{ background: channelColor }"
                  >
                    {{ channelInitials }}
                  </div>
                  <span class="text-[13.5px] font-semibold text-[#18181f]">{{ channelName }}</span>
                </div>
                <button
                  type="button"
                  :disabled="isTogglingFollow"
                  class="rounded-[10px] px-5 py-2.5 text-[13.5px] font-bold transition disabled:opacity-60"
                  :class="isFollowingChannel ? 'border-[1.5px] border-primary bg-transparent text-primary' : 'border-[1.5px] border-primary bg-primary text-white'"
                  @click="onToggleFollow"
                >
                  {{ isFollowingChannel ? 'Abonné' : 'Suivre' }}
                </button>
              </div>
            </div>

            <aside class="flex flex-col gap-4 lg:sticky lg:top-24">
              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <p class="mb-4 text-[12px] font-bold uppercase tracking-wide text-[#18181f]/45">Répartition par âge</p>
                <AppLockedPanel :locked="primaryLoaded && !demographics?.age">
                  <div v-if="demographics?.age && demographics.age.length > 0" class="flex flex-col gap-2.5">
                    <div v-for="row in demographics.age" :key="row.key" class="flex items-center gap-2.5">
                      <span class="w-14 flex-none truncate text-[12px] text-[#18181f]/70">{{ profileLabel(row.key, row.label) }}</span>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#eae7f4]">
                        <div class="h-full rounded-full bg-primary" :style="{ width: `${row.percent}%` }" />
                      </div>
                    </div>
                  </div>
                  <div v-else-if="demographics?.age" class="text-[12px] text-[#18181f]/40">Pas encore assez de données.</div>
                  <div v-else class="flex flex-col gap-2.5">
                    <div v-for="w in [52, 71, 44, 33]" :key="w" class="h-2 w-full overflow-hidden rounded-full bg-[#eae7f4]">
                      <div class="h-full rounded-full bg-primary" :style="{ width: `${w}%` }" />
                    </div>
                  </div>
                </AppLockedPanel>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <p class="mb-4 text-[12px] font-bold uppercase tracking-wide text-[#18181f]/45">Répartition par sexe</p>
                <AppLockedPanel :locked="primaryLoaded && !demographics?.gender">
                  <div v-if="demographics?.gender && demographics.gender.length > 0" class="flex flex-col gap-2.5">
                    <div v-for="row in demographics.gender" :key="row.key" class="flex items-center gap-2.5">
                      <span class="w-14 flex-none truncate text-[12px] text-[#18181f]/70">{{ profileLabel(row.key, row.label) }}</span>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#eae7f4]">
                        <div class="h-full rounded-full bg-accent" :style="{ width: `${row.percent}%` }" />
                      </div>
                      <span class="w-8 flex-none text-right font-mono text-[11px] text-[#18181f]/50">{{ row.percent }}%</span>
                    </div>
                  </div>
                  <div v-else-if="demographics?.gender" class="text-[12px] text-[#18181f]/40">Pas encore assez de données.</div>
                  <div v-else class="flex flex-col gap-2.5">
                    <div v-for="w in [58, 40, 2]" :key="w" class="h-2 w-full overflow-hidden rounded-full bg-[#eae7f4]">
                      <div class="h-full rounded-full bg-accent" :style="{ width: `${w}%` }" />
                    </div>
                  </div>
                </AppLockedPanel>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <p class="mb-4 text-[12px] font-bold uppercase tracking-wide text-[#18181f]/45">Répartition par profession</p>
                <AppLockedPanel :locked="primaryLoaded && !demographics?.profession">
                  <div v-if="demographics?.profession && demographics.profession.length > 0" class="flex flex-col gap-2.5">
                    <div v-for="row in demographics.profession" :key="row.key" class="flex items-center gap-2.5">
                      <span class="w-24 flex-none truncate text-[12px] text-[#18181f]/70">{{ profileLabel(row.key, row.label) }}</span>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#eae7f4]">
                        <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${row.percent}%` }" />
                      </div>
                      <span class="w-8 flex-none text-right font-mono text-[11px] text-[#18181f]/50">{{ row.percent }}%</span>
                    </div>
                  </div>
                  <div v-else-if="demographics?.profession" class="text-[12px] text-[#18181f]/40">Pas encore assez de données.</div>
                  <div v-else class="flex flex-col gap-2.5">
                    <div v-for="w in [47, 29, 14, 6, 4]" :key="w" class="h-2 w-full overflow-hidden rounded-full bg-[#eae7f4]">
                      <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${w}%` }" />
                    </div>
                  </div>
                </AppLockedPanel>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <p class="mb-4 text-[12px] font-bold uppercase tracking-wide text-[#18181f]/45">Répartition par région</p>
                <AppLockedPanel :locked="primaryLoaded && !demographics?.region">
                  <div v-if="demographics?.region && demographics.region.length > 0" class="flex flex-col gap-2.5">
                    <div v-for="row in demographics.region" :key="row.key" class="flex items-center gap-2.5">
                      <span class="w-24 flex-none truncate text-[12px] text-[#18181f]/70">{{ row.label }}</span>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#eae7f4]">
                        <div class="h-full rounded-full bg-amber-500" :style="{ width: `${row.percent}%` }" />
                      </div>
                      <span class="w-8 flex-none text-right font-mono text-[11px] text-[#18181f]/50">{{ row.percent }}%</span>
                    </div>
                  </div>
                  <div v-else-if="demographics?.region" class="text-[12px] text-[#18181f]/40">Pas encore assez de données.</div>
                  <div v-else class="flex flex-col gap-2.5">
                    <div v-for="w in [31, 18, 51]" :key="w" class="h-2 w-full overflow-hidden rounded-full bg-[#eae7f4]">
                      <div class="h-full rounded-full bg-amber-500" :style="{ width: `${w}%` }" />
                    </div>
                  </div>
                </AppLockedPanel>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section v-if="relatedPolls.length > 0" class="section pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="text-[11px] font-bold uppercase tracking-wide text-primary">À consulter aussi</p>
            <h2 class="text-2xl font-bold tracking-[-0.02em] text-[#18181f]">Autres sondages</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedPolls"
              :key="item.slug"
              :to="relatedPath(item.slug)"
              class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-[#f2ecfd] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  {{ item.categories?.[0] ?? 'Sondage' }}
                </span>
                <h3 class="text-xl font-bold leading-tight tracking-[-0.02em] text-[#18181f]">
                  {{ item.title }}
                </h3>
                <span class="text-[13px] font-semibold text-primary">Voir et répondre</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
