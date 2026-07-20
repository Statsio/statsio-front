import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { channelCategoryLabels, getMyChannels, type ChannelCategory } from '@/api/channels'
import type { ChannelEntry } from '@/data/channels'
import { fetchChannelByHandle } from '@/lib/channels-api'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { getHttpErrorStatus } from '@/lib/http-errors'

export type ChannelProfileTab = 'articles' | 'statsdata' | 'sondages' | 'apropos'
export type FeedItem = { title: string; meta?: string }

const TABS: { key: ChannelProfileTab; label: string }[] = [
  { key: 'articles', label: 'Articles' },
  { key: 'statsdata', label: 'StatsData' },
  { key: 'sondages', label: 'Sondages' },
  { key: 'apropos', label: 'À propos' },
]

export function useChannelProfile() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const channel = ref<ChannelEntry | null>(null)
  const loading = ref(true)
  const isFollowing = ref(false)
  const isOwner = ref(false)
  const activeTab = ref<ChannelProfileTab>('articles')

  async function load() {
    loading.value = true
    try {
      const handle = String(route.params.handle ?? '')
      const currentChannel = await fetchChannelByHandle(handle)

      if (currentChannel) {
        channel.value = currentChannel

        if (auth.isAuthenticated) {
          try {
            const myChannels = await getMyChannels()
            isOwner.value = myChannels.some((c) => String(c.id) === currentChannel.slug)
          } catch {
            /* impossible de déterminer la propriété, on garde le bouton Suivre par défaut */
          }
        }
      } else {
        showError(createError({ statusCode: 404, statusMessage: 'Chaîne non trouvée', fatal: true }))
      }
    } catch (e) {
      showError(
        createError({
          statusCode: getHttpErrorStatus(e, 500),
          statusMessage: 'Erreur lors du chargement de la chaîne',
          fatal: true,
        }),
      )
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  function toggleFollow() {
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
    isFollowing.value = !isFollowing.value
  }

  const categoryLabels = computed(() =>
    (channel.value?.themes ?? []).map((slug: string) => channelCategoryLabels[slug as ChannelCategory] ?? slug),
  )

  const createdAtLabel = computed(() => {
    const iso = channel.value?.createdAt
    if (!iso) return null
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  })

  const articleFeedItems = computed<FeedItem[]>(
    () => channel.value?.articles.map((title) => ({ title })) ?? [],
  )
  const statsDataFeedItems = computed<FeedItem[]>(
    () => channel.value?.statsData.map((title) => ({ title })) ?? [],
  )

  const pollFeedItems = computed<FeedItem[]>(() => channel.value?.polls.map((title) => ({ title })) ?? [])

  return {
    channel,
    loading,
    isFollowing,
    isOwner,
    toggleFollow,
    tabs: TABS,
    activeTab,
    categoryLabels,
    createdAtLabel,
    articleFeedItems,
    statsDataFeedItems,
    pollFeedItems,
  }
}
