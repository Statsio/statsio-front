import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { channelCategoryLabels, getMyChannels, type ChannelCategory } from '@/api/channels'
import type { ChannelEntry } from '@/data/channels'
import { fetchChannelByHandle } from '@/lib/channels-api'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { fetchChannelContents, useChannelCatalog, type ChannelContents } from '@/composables/useChannelCatalog'
import { useContentDomain } from '@/composables/useContentDomain'

export type ChannelProfileTab = 'featured' | 'articles' | 'statsdata' | 'sondages' | 'apropos'

const TABS: { key: ChannelProfileTab; label: string }[] = [
  { key: 'featured', label: 'Aperçu' },
  { key: 'articles', label: 'Articles' },
  { key: 'statsdata', label: 'StatsData' },
  { key: 'sondages', label: 'Sondages' },
  { key: 'apropos', label: 'À propos' },
]

export function useChannelProfile() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const domain = useContentDomain()
  const handle = String(route.params.handle ?? '')

  // Chaîne + premier lot de contenus chargés côté serveur (SSR) : Google reçoit
  // nom, description, h1 et les liens vers les contenus de la chaîne.
  const asyncData = useAsyncData(`channel-${handle}-${domain.value ?? ''}`, async () => {
    let currentChannel: ChannelEntry | undefined
    try {
      currentChannel = await fetchChannelByHandle(handle)
    } catch (e) {
      throw createError({ statusCode: getHttpErrorStatus(e, 500), statusMessage: 'Erreur lors du chargement de la chaîne' })
    }
    if (!currentChannel) throw createError({ statusCode: 404, statusMessage: 'Chaîne non trouvée' })
    let contents: ChannelContents | null = null
    try {
      contents = await fetchChannelContents(Number(currentChannel.slug), domain.value)
    } catch { /* les onglets rechargeront côté client */ }
    return { channel: currentChannel, contents }
  })
  const { data, error, status } = asyncData

  const channel = computed<ChannelEntry | null>(() => data.value?.channel ?? null)
  const loading = computed(() => status.value === 'pending')
  const isFollowing = ref(false)
  const isOwner = ref(false)
  const activeTab = ref<ChannelProfileTab>('featured')

  const channelId = computed(() => (channel.value ? Number(channel.value.slug) : undefined))
  const { loading: contentLoading, ...catalog } = useChannelCatalog(
    channelId,
    computed(() => data.value?.contents),
  )

  /** À attendre dans le `<script setup>` : rejette (page d'erreur) si la chaîne est introuvable. */
  const ready = asyncData.then(() => {
    if (error.value || !data.value) {
      throw createError({
        statusCode: error.value?.statusCode ?? 404,
        statusMessage: error.value?.statusMessage ?? 'Chaîne non trouvée',
        fatal: true,
      })
    }
  })

  // Propriété de la chaîne : dépend de la session, connue seulement dans le navigateur.
  onMounted(async () => {
    const current = channel.value
    if (!current || !auth.isAuthenticated) return
    try {
      const myChannels = await getMyChannels()
      isOwner.value = myChannels.some((c) => String(c.id) === current.slug)
    } catch {
      /* impossible de déterminer la propriété, on garde le bouton Suivre par défaut */
    }
  })

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

  const isVerified = computed(() => Boolean(channel.value?.badges?.includes('verified')))

  const createdAtLabel = computed(() => {
    const iso = channel.value?.createdAt
    if (!iso) return null
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  })

  const createdAtYear = computed(() => {
    const iso = channel.value?.createdAt
    return iso ? String(new Date(iso).getFullYear()) : null
  })

  return {
    channel,
    loading,
    isFollowing,
    isOwner,
    isVerified,
    toggleFollow,
    tabs: TABS,
    activeTab,
    categoryLabels,
    createdAtLabel,
    createdAtYear,
    contentLoading,
    ready,
    ...catalog,
  }
}
