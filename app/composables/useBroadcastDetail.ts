import { ref, computed } from 'vue'
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

export function fmtScheduleDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtRelative(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 30) return `Il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function useBroadcastDetail() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const broadcast = ref<BroadcastDetail | null>(null)
  const schedule = ref<ProgrammeSchedule | null>(null)
  const reviewsData = ref<ReviewsResponse | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const isToggling = ref(false)
  const dbLogoMap = ref<Map<string, string>>(new Map())
  const showReviewModal = ref(false)

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
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/)
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return `https://www.youtube-nocookie.com/embed/${url}`
    return null
  })

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const [detail, channels, sched, rev] = await Promise.all([
        fetchBroadcast(broadcastId.value),
        apiHttp.get<{ slug: string; logo_url: string | null }[]>('/tv/channels').catch(() => ({ data: [] })),
        fetchProgrammeSchedule(broadcastId.value),
        fetchBroadcastReviews(broadcastId.value),
      ])
      broadcast.value = detail
      dbLogoMap.value = new Map(
        channels.data
          .filter((c: { slug: string; logo_url: string | null }) => c.logo_url)
          .map((c: { slug: string; logo_url: string | null }) => [c.slug, c.logo_url as string]),
      )
      schedule.value = sched
      reviewsData.value = rev
    } catch {
      error.value = 'Programme introuvable.'
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

  return {
    auth,
    broadcast,
    schedule,
    reviewsData,
    isLoading,
    error,
    isToggling,
    dbLogoMap,
    showReviewModal,
    broadcastId,
    channel,
    channelLogoUrl,
    isPast,
    formattedDate,
    durationLabel,
    youtubeEmbedUrl,
    load,
    toggle,
    onReviewSubmitted,
  }
}
