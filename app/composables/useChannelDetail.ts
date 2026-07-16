import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchChannelDetail,
  fetchChannelPopularProgrammes,
  toggleChannelFollow,
  type ChannelDetail,
  type PopularProgramme,
} from '@/api/tv-channel'
import { fetchChannelSchedules } from '@/api/tv-schedule'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import { useAuthStore } from '@/stores/auth'
import { getHttpErrorStatus } from '@/lib/http-errors'
import type { ChannelSchedule } from '@/types/tv-schedule'

export type ChannelTab = 'now' | 'grid' | 'popular'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useChannelDetail() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const slug = computed(() => String(route.params.slug))

  const detail = ref<ChannelDetail | null>(null)
  const schedule = ref<ChannelSchedule | null>(null)
  const popularProgrammes = ref<PopularProgramme[]>([])
  const isLoading = ref(true)
  const isToggling = ref(false)
  const tab = ref<ChannelTab>('now')

  const staticChannel = computed(() => TNT_CHANNELS.find((c) => c.id === slug.value) ?? null)

  const logoUrl = computed(() => detail.value?.logoUrl ?? staticChannel.value?.logoUrl ?? null)

  const now = ref(new Date())
  const referenceMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

  async function load() {
    isLoading.value = true
    try {
      const [channelDetail, schedules, popular] = await Promise.all([
        fetchChannelDetail(slug.value),
        fetchChannelSchedules(toDateStr(new Date())),
        fetchChannelPopularProgrammes(slug.value),
      ])
      detail.value = channelDetail
      schedule.value = schedules.find((s) => s.channel.id === slug.value) ?? null
      popularProgrammes.value = popular
    } catch (e) {
      showError(
        createError({
          statusCode: getHttpErrorStatus(e, 404),
          statusMessage: 'Cette chaîne est introuvable.',
          fatal: true,
        }),
      )
    } finally {
      isLoading.value = false
    }
  }

  async function toggleFollow() {
    if (!auth.isAuthenticated) { router.push({ name: 'login' }); return }
    if (isToggling.value || !detail.value) return
    isToggling.value = true
    try {
      const res = await toggleChannelFollow(slug.value)
      detail.value.isFollowing = res.isFollowing
      detail.value.followersCount = res.followersCount
    } finally {
      isToggling.value = false
    }
  }

  return {
    auth,
    slug,
    detail,
    schedule,
    popularProgrammes,
    isLoading,
    isToggling,
    tab,
    staticChannel,
    logoUrl,
    now,
    referenceMinutes,
    load,
    toggleFollow,
  }
}
