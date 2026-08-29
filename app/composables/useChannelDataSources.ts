import { computed, onMounted, watch, type Ref } from 'vue'
import { getChannelDataSources, type ChannelDataSource } from '@/api/channels'

/**
 * Jeux de données rattachés aux contenus publiés au nom de la chaîne — alimente
 * l'onglet « Sources de données » du dashboard et le compteur de la sidebar.
 * Mis en cache par chaîne via `useState`.
 */
export function useChannelDataSources(channelId: Ref<number>) {
  const sources = useState<ChannelDataSource[]>('channel-dashboard:data-sources', () => [])
  const loading = useState('channel-dashboard:data-sources:loading', () => true)
  const error = useState('channel-dashboard:data-sources:error', () => '')
  const loadedId = useState<number | null>('channel-dashboard:data-sources:id', () => null)
  const fetchingId = useState<number | null>('channel-dashboard:data-sources:fetching', () => null)

  async function load(force = false) {
    if (!channelId.value) return
    if (!force && (loadedId.value === channelId.value || fetchingId.value === channelId.value)) return
    fetchingId.value = channelId.value
    loading.value = true
    error.value = ''
    try {
      sources.value = await getChannelDataSources(channelId.value)
      loadedId.value = channelId.value
    } catch {
      error.value = 'Impossible de charger les sources de données.'
    } finally {
      loading.value = false
      if (fetchingId.value === channelId.value) fetchingId.value = null
    }
  }

  onMounted(() => load())
  watch(channelId, () => load())

  const count = computed(() => sources.value.length)

  return { sources, loading, error, count, reload: () => load(true) }
}
