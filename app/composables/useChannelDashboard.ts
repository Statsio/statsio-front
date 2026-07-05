import { computed } from 'vue'
import {
  getChannel,
  getChannelCategories,
  type Channel,
  type ChannelCategoryItem,
} from '@/api/channels'

/**
 * État partagé du dashboard d'une chaîne : la chaîne courante et les
 * catégories disponibles sont chargées une seule fois puis partagées entre
 * le layout (sidebar) et les pages de section.
 */
export function useChannelDashboard() {
  const channel = useState<Channel | null>('channel-dashboard:channel', () => null)
  const availableCategories = useState<ChannelCategoryItem[]>('channel-dashboard:categories', () => [])
  const isLoading = useState('channel-dashboard:loading', () => false)
  const loadError = useState('channel-dashboard:error', () => '')
  const loadedChannelId = useState<number | null>('channel-dashboard:id', () => null)

  const channelInitials = computed(() =>
    (channel.value?.profile?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase() || 'CH'
  )

  const getCategoryLabel = (slug: string) =>
    availableCategories.value.find((c: ChannelCategoryItem) => c.slug === slug)?.label ?? slug

  async function ensureLoaded(channelId: number) {
    if (loadedChannelId.value === channelId && channel.value) return
    isLoading.value = true
    loadError.value = ''
    channel.value = null
    loadedChannelId.value = channelId
    try {
      const [data, cats] = await Promise.all([
        getChannel(channelId),
        availableCategories.value.length
          ? Promise.resolve(availableCategories.value)
          : getChannelCategories(),
      ])
      availableCategories.value = cats
      if (!data.profile) {
        loadError.value = 'Cette chaîne n\'a pas de profil configuré.'
        return
      }
      channel.value = data
    } catch {
      loadError.value = 'Impossible de charger la chaîne.'
    } finally {
      isLoading.value = false
    }
  }

  async function reload() {
    if (loadedChannelId.value === null) return
    const data = await getChannel(loadedChannelId.value)
    channel.value = data
  }

  return {
    channel,
    availableCategories,
    isLoading,
    loadError,
    channelInitials,
    getCategoryLabel,
    ensureLoaded,
    reload,
  }
}
