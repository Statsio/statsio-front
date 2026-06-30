import { ref, readonly } from 'vue'
import { getMyChannels, type Channel } from '@/api/channels'

export function useMyChannels() {
  const channels = ref<Channel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      channels.value = await getMyChannels()
    } catch {
      error.value = 'Impossible de charger vos chaînes.'
    } finally {
      loading.value = false
    }
  }

  return {
    channels: readonly(channels),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
  }
}
