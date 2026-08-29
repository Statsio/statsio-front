import { onMounted, watch, type Ref } from 'vue'
import { getChannelStats, type ChannelStats } from '@/api/channels'

/**
 * Statistiques de la chaîne (vues 30j, croissance abonnés, équipe) partagées
 * entre le shell (compteurs de la sidebar) et les pages de section — chargées
 * une seule fois par chaîne puis mises en cache via `useState`.
 */
export function useChannelStats(channelId: Ref<number>) {
  const stats = useState<ChannelStats | null>('channel-dashboard:stats', () => null)
  const loading = useState('channel-dashboard:stats:loading', () => true)
  const error = useState('channel-dashboard:stats:error', () => '')
  const loadedId = useState<number | null>('channel-dashboard:stats:id', () => null)
  const fetchingId = useState<number | null>('channel-dashboard:stats:fetching', () => null)

  async function load(force = false) {
    if (!channelId.value) return
    if (!force && (loadedId.value === channelId.value || fetchingId.value === channelId.value)) return
    fetchingId.value = channelId.value
    loading.value = true
    error.value = ''
    try {
      stats.value = await getChannelStats(channelId.value)
      loadedId.value = channelId.value
    } catch {
      error.value = 'Impossible de charger les statistiques.'
    } finally {
      loading.value = false
      if (fetchingId.value === channelId.value) fetchingId.value = null
    }
  }

  onMounted(() => load())
  watch(channelId, () => load())

  return { stats, loading, error, reload: () => load(true) }
}
