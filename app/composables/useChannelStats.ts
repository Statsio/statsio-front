import { onMounted, ref, watch, type Ref } from 'vue'
import { getChannelStats, type ChannelStats } from '@/api/channels'

export function useChannelStats(channelId: Ref<number>) {
  const stats = ref<ChannelStats | null>(null)
  const loading = ref(true)
  const error = ref('')

  async function load() {
    if (!channelId.value) return
    loading.value = true
    error.value = ''
    try {
      stats.value = await getChannelStats(channelId.value)
    } catch {
      error.value = 'Impossible de charger les statistiques.'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  watch(channelId, load)

  return { stats, loading, error, reload: load }
}
