<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchBroadcast,
  toggleBroadcastView,
  fetchProgrammeSchedule,
  fetchBroadcastReviews,
  type BroadcastDetail,
  type ProgrammeSchedule,
  type ReviewsResponse,
} from '@/api/tv-broadcast'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import { useAuthStore } from '@/stores/auth'
import { apiHttp } from '@/lib/http'
import { getHttpErrorStatus } from '@/lib/http-errors'
import TvReviewModal from '@/components/tv/TvReviewModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const broadcast = ref<BroadcastDetail | null>(null)
const schedule = ref<ProgrammeSchedule | null>(null)
const reviewsData = ref<ReviewsResponse | null>(null)
const isLoading = ref(true)
const isToggling = ref(false)
const dbLogoMap = ref<Map<string, string>>(new Map())
const showReviewModal = ref(false)

usePageSeo({
  title: computed(() => broadcast.value?.program?.title),
  description: computed(() => broadcast.value?.program?.description),
})

const broadcastId = computed(() => Number(route.params.id))

const channel = computed(() =>
  broadcast.value ? TNT_CHANNELS.find((c) => c.id === broadcast.value!.channelId) ?? null : null,
)

const channelLogoUrl = computed(() => {
  if (!channel.value) return null
  return dbLogoMap.value.get(channel.value.id) ?? channel.value.logoUrl
})

const isPast = computed(() => {
  if (!broadcast.value) return false
  return new Date(broadcast.value.endAt) < new Date()
})

const formattedDate = computed(() => {
  if (!broadcast.value) return ''
  return new Date(broadcast.value.startAt).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

const durationLabel = computed(() => {
  if (!broadcast.value) return ''
  const m = broadcast.value.durationMin
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`
})

const youtubeEmbedUrl = computed(() => {
  const url = broadcast.value?.program.youtubeUrl
  if (!url) return null
  // Extract YouTube ID from various formats
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/)
  if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`
  // Plain 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return `https://www.youtube-nocookie.com/embed/${url}`
  return null
})

const BROADCAST_TYPE_LABELS: Record<string, { label: string; class: string }> = {
  inedit:      { label: 'Inédit',      class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rediffusion: { label: 'Rediffusion', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  direct:      { label: 'Direct',      class: 'bg-red-100 text-red-700 border-red-200' },
  replay:      { label: 'Replay',      class: 'bg-blue-100 text-blue-700 border-blue-200' },
  exclusivite: { label: 'Exclusivité', class: 'bg-violet-100 text-violet-700 border-violet-200' },
}

const COLOR_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  lime: 'bg-lime-100 text-lime-700',
  green: 'bg-green-100 text-green-700',
  teal: 'bg-teal-100 text-teal-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  sky: 'bg-sky-100 text-sky-700',
}

function fmtScheduleDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtRelative(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 30) return `Il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

async function load() {
  isLoading.value = true
  try {
    const [detail, channels, sched, rev] = await Promise.all([
      fetchBroadcast(broadcastId.value),
      apiHttp.get<{ slug: string; logo_url: string | null }[]>('/tv/channels').catch(() => ({ data: [] })),
      fetchProgrammeSchedule(broadcastId.value),
      fetchBroadcastReviews(broadcastId.value),
    ])
    broadcast.value = detail
    dbLogoMap.value = new Map(channels.data.filter((c: { slug: string; logo_url: string | null }) => c.logo_url).map((c: { slug: string; logo_url: string | null }) => [c.slug, c.logo_url as string]))
    schedule.value = sched
    reviewsData.value = rev
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Ce programme est introuvable.',
        fatal: true,
      }),
    )
  } finally {
    isLoading.value = false
  }
}

async function toggle(type: 'watched' | 'will_watch') {
  if (!auth.isAuthenticated) { router.push({ name: 'login' }); return }
  if (isToggling.value || !broadcast.value) return
  isToggling.value = true
  try {
    const res = await toggleBroadcastView(broadcastId.value, type)
    broadcast.value.userViewType = res.userViewType
    broadcast.value.audience.viewers = res.viewers
    broadcast.value.audience.willWatch = res.willWatch
    // Show review modal after marking as watched (if broadcast is past and not yet reviewed)
    if (res.userViewType === 'watched' && isPast.value && !broadcast.value.userHasReviewed) {
      showReviewModal.value = true
    }
  } finally {
    isToggling.value = false
  }
}

function onReviewSubmitted(reviews: ReviewsResponse) {
  reviewsData.value = reviews
  showReviewModal.value = false
  if (broadcast.value) broadcast.value.userHasReviewed = true
}

onMounted(() => load())
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-tvstats-primary border-t-transparent" />
    </div>

    <!-- Content -->
    <template v-else-if="broadcast">
      <div class="mx-auto max-w-6xl px-4 py-6 lg:py-8">

        <!-- Back -->
        <button
          class="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          @click="router.back()"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          <!-- ══════════ LEFT / MAIN ══════════ -->
          <div class="min-w-0 space-y-5">

            <!-- Hero card -->
            <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <!-- Programme image -->
              <div v-if="broadcast.program.imageUrl" class="relative h-48 sm:h-64 bg-slate-100 overflow-hidden">
                <img
                  :src="broadcast.program.imageUrl"
                  :alt="broadcast.program.title"
                  class="h-full w-full object-cover"
                  @error="($event.target as HTMLImageElement).parentElement!.style.display='none'"
                />
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <!-- TvStats pick badge over image -->
                <div v-if="broadcast.program.isTvstatsPick" class="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg">
                  <!-- Heart SVG logo -->
                  <svg class="h-4 w-4 text-tvstats-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    <path d="M12 8.5L13.5 12 17 12.5 14.5 15l.5 3.5L12 17l-3 1.5.5-3.5L7 12.5 10.5 12z" fill="white" opacity="0.7" transform="scale(0.5) translate(12,12)"/>
                  </svg>
                  <span class="text-[11px] font-bold text-tvstats-primary tracking-wide">Coup de cœur</span>
                </div>
              </div>

              <div class="p-5 sm:p-6">
                <!-- Channel + date row -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                  <div v-if="channel" class="flex items-center gap-1.5">
                    <div class="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <img :src="channelLogoUrl ?? undefined" :alt="channel.displayName" class="h-full w-full object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
                    </div>
                    <span class="font-medium text-slate-600">{{ channel.displayName }}</span>
                  </div>
                  <span class="text-slate-300">·</span>
                  <span>{{ formattedDate }}</span>
                  <span class="text-slate-300">·</span>
                  <span>{{ broadcast.startTime }}–{{ broadcast.endTime }}</span>
                  <span class="text-slate-300">·</span>
                  <span>{{ durationLabel }}</span>
                </div>

                <!-- Title -->
                <h1 class="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {{ broadcast.program.title }}
                </h1>

                <!-- Metadata row -->
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <!-- TvStats pick (no image case) -->
                  <div
                    v-if="broadcast.program.isTvstatsPick && !broadcast.program.imageUrl"
                    class="flex items-center gap-1.5 rounded-full bg-tvstats-soft/40 border border-tvstats-primary/20 px-2.5 py-1"
                  >
                    <svg class="h-3.5 w-3.5 text-tvstats-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span class="text-[11px] font-bold text-tvstats-primary">Coup de cœur TvStats</span>
                  </div>
                  <!-- Type -->
                  <span v-if="broadcast.program.type" class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {{ broadcast.program.type }}
                  </span>
                  <!-- Categories -->
                  <span
                    v-for="cat in broadcast.program.categories"
                    :key="cat.id"
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    :class="COLOR_CLASS[cat.color ?? ''] ?? 'bg-slate-100 text-slate-700'"
                  >
                    {{ cat.name }}
                  </span>
                </div>

                <!-- Description -->
                <p v-if="broadcast.program.description" class="mt-4 text-sm leading-relaxed text-slate-600">
                  {{ broadcast.program.description }}
                </p>
              </div>
            </div>

            <!-- YouTube video -->
            <div v-if="youtubeEmbedUrl" class="overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-sm">
              <div class="relative pt-[56.25%]">
                <iframe
                  :src="youtubeEmbedUrl"
                  class="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  title="Bande-annonce"
                />
              </div>
            </div>

            <!-- Scores breakdown (when there are votes) -->
            <div v-if="broadcast.scores.length > 0" class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Scores téléspectateurs</h2>
              <div class="space-y-3">
                <div v-for="s in broadcast.scores" :key="s.questionId" class="flex items-center gap-3">
                  <p class="flex-1 min-w-0 text-sm text-slate-700 truncate" :title="s.label">{{ s.label }}</p>
                  <div class="flex items-center gap-2 shrink-0">
                    <!-- 5-dot bar -->
                    <div class="flex gap-0.5">
                      <div
                        v-for="i in 5"
                        :key="i"
                        class="h-2 w-2 rounded-full transition-colors"
                        :class="i <= Math.round(s.avgScore) ? 'bg-tvstats-primary' : 'bg-slate-200'"
                      />
                    </div>
                    <span class="text-sm font-bold text-slate-900 w-6 text-right">{{ s.avgScore }}</span>
                    <span class="text-xs text-slate-400">({{ s.voteCount }})</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Diffusions -->
            <div
              v-if="schedule && (schedule.past.length > 0 || schedule.upcoming.length > 0)"
              class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <!-- Upcoming -->
              <div v-if="schedule.upcoming.length > 0" class="mb-5">
                <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Prochaines diffusions</h2>
                <div class="space-y-2">
                  <RouterLink
                    v-for="b in schedule.upcoming"
                    :key="b.id"
                    :to="`/tvstats/emission/${b.id}`"
                    class="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
                  >
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <img v-if="dbLogoMap.get(b.channelId)" :src="dbLogoMap.get(b.channelId)" class="h-full object-contain" :alt="b.channelId" />
                      <span v-else class="text-[9px] font-bold uppercase text-slate-400">{{ b.channelId }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-800">{{ fmtScheduleDate(b.startAt) }}</p>
                      <p class="text-xs text-slate-500">{{ b.startTime }}–{{ b.endTime }}</p>
                    </div>
                    <span
                      v-if="b.broadcastType"
                      class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      :class="BROADCAST_TYPE_LABELS[b.broadcastType]?.class ?? 'bg-slate-100 text-slate-600 border-slate-200'"
                    >
                      {{ BROADCAST_TYPE_LABELS[b.broadcastType]?.label ?? b.broadcastType }}
                    </span>
                  </RouterLink>
                </div>
              </div>

              <!-- Past -->
              <div v-if="schedule.past.length > 0">
                <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Diffusions passées</h2>
                <div class="space-y-2">
                  <RouterLink
                    v-for="b in schedule.past"
                    :key="b.id"
                    :to="`/tvstats/emission/${b.id}`"
                    class="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
                  >
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <img v-if="dbLogoMap.get(b.channelId)" :src="dbLogoMap.get(b.channelId)" class="h-full object-contain" :alt="b.channelId" />
                      <span v-else class="text-[9px] font-bold uppercase text-slate-400">{{ b.channelId }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-700">{{ fmtScheduleDate(b.startAt) }}</p>
                      <p class="text-xs text-slate-500">{{ b.startTime }}–{{ b.endTime }}</p>
                    </div>
                    <span v-if="b.viewers > 0" class="shrink-0 text-xs text-slate-400">
                      {{ b.viewers.toLocaleString('fr-FR') }} vues
                    </span>
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Reviews -->
            <div class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <h2 class="text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Avis téléspectateurs</h2>
                  <div v-if="reviewsData?.avgRating" class="flex items-center gap-1">
                    <svg class="h-4 w-4 fill-amber-400" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span class="text-sm font-bold text-slate-800">{{ reviewsData.avgRating }}</span>
                    <span class="text-xs text-slate-400">({{ reviewsData.totalCount }})</span>
                  </div>
                </div>
                <!-- Add review button (shown when past + auth + not yet reviewed) -->
                <button
                  v-if="isPast && auth.isAuthenticated && !broadcast.userHasReviewed"
                  class="rounded-xl border border-tvstats-primary/30 bg-tvstats-soft/20 px-3 py-1.5 text-xs font-semibold text-tvstats-primary hover:bg-tvstats-soft/40 transition"
                  @click="showReviewModal = true"
                >
                  + Donner mon avis
                </button>
                <RouterLink
                  v-else-if="isPast && !auth.isAuthenticated"
                  to="/login"
                  class="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Connectez-vous pour noter
                </RouterLink>
              </div>

              <!-- Reviews list -->
              <div v-if="!reviewsData || reviewsData.reviews.length === 0" class="py-6 text-center text-sm text-slate-400">
                <p>Aucun avis pour le moment.</p>
                <p v-if="isPast" class="mt-1 text-xs">Soyez le premier à donner votre avis !</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="review in reviewsData.reviews" :key="review.id" class="flex gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {{ review.initials }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <div v-if="review.rating" class="flex items-center gap-0.5">
                        <svg v-for="s in 5" :key="s" class="h-3.5 w-3.5" :class="s <= review.rating ? 'fill-amber-400' : 'fill-slate-200'" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <span class="text-xs text-slate-400">{{ fmtRelative(review.createdAt) }}</span>
                    </div>
                    <p v-if="review.comment" class="text-sm text-slate-700 leading-relaxed">{{ review.comment }}</p>
                    <p v-else class="text-xs italic text-slate-400">Avis sans commentaire.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════ RIGHT SIDEBAR ══════════ -->
          <div class="space-y-4">

            <!-- Broadcast type card -->
            <div v-if="broadcast.broadcastType" class="rounded-2xl border shadow-sm p-5" :class="BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.class?.replace('bg-', 'bg-').replace('border-', 'border-') ?? 'bg-white border-slate-200'">
              <p class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Type de diffusion</p>
              <p class="text-lg font-extrabold">{{ BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.label ?? broadcast.broadcastType }}</p>
            </div>

            <!-- Action card -->
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <template v-if="isPast">
                <!-- Past: "J'ai regardé" -->
                <button
                  class="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  :class="broadcast.userViewType === 'watched'
                    ? 'bg-tvstats-primary text-white shadow-sm hover:bg-tvstats-dark'
                    : 'border border-slate-200 text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'"
                  :disabled="isToggling"
                  @click="toggle('watched')"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {{ broadcast.userViewType === 'watched' ? 'J\'ai regardé ✓' : 'J\'ai regardé' }}
                </button>
                <!-- After watching, offer to leave review if not done -->
                <button
                  v-if="broadcast.userViewType === 'watched' && !broadcast.userHasReviewed"
                  class="mt-2 w-full rounded-xl border border-tvstats-primary/20 bg-tvstats-soft/20 px-3 py-2 text-xs font-semibold text-tvstats-primary hover:bg-tvstats-soft/40 transition"
                  @click="showReviewModal = true"
                >
                  Donner mon avis →
                </button>
                <p v-if="broadcast.userHasReviewed" class="mt-2 text-center text-xs text-tvstats-primary font-medium">Avis déposé ✓</p>
              </template>
              <template v-else>
                <!-- Future: "Je vais regarder" -->
                <button
                  class="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  :class="broadcast.userViewType === 'will_watch'
                    ? 'bg-tvstats-primary text-white shadow-sm hover:bg-tvstats-dark'
                    : 'border border-slate-200 text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'"
                  :disabled="isToggling"
                  @click="toggle('will_watch')"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ broadcast.userViewType === 'will_watch' ? 'Je vais regarder ✓' : 'Je vais regarder' }}
                </button>
              </template>
              <p v-if="!auth.isAuthenticated" class="mt-2 text-center text-xs text-slate-400">
                <RouterLink to="/login" class="underline hover:text-slate-600">Connectez-vous</RouterLink> pour enregistrer.
              </p>
            </div>

            <!-- Audience card -->
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {{ isPast ? 'Audience' : 'Intentions' }}
              </h2>

              <div class="space-y-3">
                <!-- Viewers / Will watch -->
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ isPast ? 'Ont regardé' : 'Vont regarder' }}</span>
                  <span class="text-base font-bold text-slate-900">
                    {{ (isPast ? broadcast.audience.viewers : broadcast.audience.willWatch).toLocaleString('fr-FR') }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ isPast ? 'Prévoient de revoir' : 'Ont déjà vu' }}</span>
                  <span class="text-base font-bold text-slate-900">
                    {{ (isPast ? broadcast.audience.willWatch : broadcast.audience.viewers).toLocaleString('fr-FR') }}
                  </span>
                </div>

                <!-- Médiamétrie -->
                <template v-if="broadcast.audience.mediametrieViewers">
                  <div class="border-t border-slate-100 pt-3 space-y-2">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Médiamétrie</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-slate-500">Spectateurs</span>
                      <span class="text-base font-bold text-slate-900">
                        {{ (broadcast.audience.mediametrieViewers / 1_000_000).toFixed(1) }}M
                      </span>
                    </div>
                    <div v-if="broadcast.audience.pda" class="flex items-center justify-between">
                      <span class="text-xs text-slate-500">Part d'audience</span>
                      <span class="text-base font-bold text-slate-900">{{ broadcast.audience.pda }}%</span>
                    </div>
                    <div v-if="broadcast.audience.rank" class="flex items-center justify-between">
                      <span class="text-xs text-slate-500">Classement</span>
                      <span class="text-base font-bold text-slate-900">#{{ broadcast.audience.rank }}</span>
                    </div>
                  </div>
                </template>
                <template v-else-if="broadcast.audience.pda">
                  <div class="border-t border-slate-100 pt-3 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-slate-500">Part d'audience</span>
                      <span class="text-base font-bold text-slate-900">{{ broadcast.audience.pda }}%</span>
                    </div>
                    <div v-if="broadcast.audience.rank" class="flex items-center justify-between">
                      <span class="text-xs text-slate-500">Classement</span>
                      <span class="text-base font-bold text-slate-900">#{{ broadcast.audience.rank }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Programme info (channel + timeslot) -->
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Diffusion</h2>
              <div class="flex items-center gap-3">
                <div v-if="channel" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                  <img :src="channelLogoUrl ?? undefined" :alt="channel.displayName" class="h-full w-full object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ channel?.displayName ?? broadcast.channelId }}</p>
                  <p class="text-xs text-slate-500">{{ formattedDate }}</p>
                  <p class="text-xs text-slate-500">{{ broadcast.startTime }} – {{ broadcast.endTime }} · {{ durationLabel }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </template>

    <!-- Review modal -->
    <TvReviewModal
      v-if="showReviewModal && broadcast"
      :broadcast-id="broadcastId"
      :program-title="broadcast.program.title"
      @close="showReviewModal = false"
      @submitted="onReviewSubmitted"
    />
  </div>
</template>
