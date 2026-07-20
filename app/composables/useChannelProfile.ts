import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { channelCategoryLabels, getMyChannels, type ChannelCategory } from '@/api/channels'
import type { ChannelEntry } from '@/data/channels'
import { fetchChannelByHandle } from '@/lib/channels-api'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { useChannelPublicContent } from '@/composables/useChannelPublicContent'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useRespondentToken } from '@/composables/useRespondentToken'
import { enrichPoll, type EnrichedPoll } from '@/lib/poll-enrich'

export type ChannelProfileTab = 'featured' | 'articles' | 'statsdata' | 'sondages' | 'apropos'

const TABS: { key: ChannelProfileTab; label: string }[] = [
  { key: 'featured', label: 'À la une' },
  { key: 'articles', label: 'Articles' },
  { key: 'statsdata', label: 'StatsData' },
  { key: 'sondages', label: 'Sondages' },
  { key: 'apropos', label: 'À propos' },
]

export function useChannelProfile() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const basePath = useContentBasePath()
  const respondentToken = useRespondentToken()

  const channel = ref<ChannelEntry | null>(null)
  const loading = ref(true)
  const isFollowing = ref(false)
  const isOwner = ref(false)
  const activeTab = ref<ChannelProfileTab>('featured')

  const channelId = computed(() => (channel.value ? Number(channel.value.slug) : undefined))
  const { articles, statsData, polls, loading: contentLoading } = useChannelPublicContent(channelId)

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

  const featured = computed(() => channel.value?.featured ?? null)

  // Les pourcentages/votes d'un sondage ne sont jamais stockés sur le document : chaque
  // sondage réel (liste + featured) doit être enrichi via un appel réseau dédié.
  const enrichedPolls = ref<EnrichedPoll[]>([])
  const featuredEnrichedSurvey = ref<EnrichedPoll | null>(null)

  watch(
    polls,
    async (list) => {
      enrichedPolls.value = await Promise.all(list.map((p) => enrichPoll(p, basePath.value, respondentToken.value)))
    },
    { immediate: true },
  )

  watch(
    featured,
    async (f) => {
      featuredEnrichedSurvey.value = f?.survey ? await enrichPoll(f.survey, basePath.value, respondentToken.value) : null
    },
    { immediate: true },
  )

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
    articles,
    statsData,
    contentLoading,
    featured,
    enrichedPolls,
    featuredEnrichedSurvey,
  }
}
