import { ref, watch, type Ref } from 'vue'
import { getPublicChannels, type Channel, type ChannelCategory } from '@/api/channels'
import type { ChannelEntry } from '@/data/channels'

const LIMIT = 10

function shuffle<T>(list: T[]): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/**
 * Chaînes similaires à une chaîne donnée : d'abord toutes les autres chaînes de la
 * même organisation (si elle en a une), puis des chaînes des mêmes catégories, avec
 * repli sur des chaînes aléatoires quand rien de tout ça n'est trouvé.
 */
export function useSimilarChannels(channel: Ref<ChannelEntry | null>) {
  const channels = ref<Channel[]>([])
  const loading = ref(false)

  async function load(current: ChannelEntry) {
    loading.value = true
    try {
      const currentId = Number(current.slug)
      const found: Channel[] = []

      const organizationId = current.organization?.id
      if (organizationId) {
        const page = await getPublicChannels({ sort: 'popular', perPage: 50 })
        for (const candidate of page.channels) {
          if (candidate.id === currentId) continue
          if (candidate.organization?.id !== organizationId) continue
          found.push(candidate)
        }
      }

      for (const theme of current.themes) {
        if (found.length >= LIMIT) break
        const page = await getPublicChannels({ category: theme as ChannelCategory, perPage: LIMIT + 1 })
        for (const candidate of page.channels) {
          if (candidate.id === currentId) continue
          if (found.some((c) => c.id === candidate.id)) continue
          found.push(candidate)
        }
      }

      if (found.length > 0) {
        channels.value = found
        return
      }

      const fallbackPage = await getPublicChannels({ sort: 'popular', perPage: 30 })
      const pool = fallbackPage.channels.filter((c) => c.id !== currentId)
      channels.value = shuffle(pool).slice(0, LIMIT)
    } finally {
      loading.value = false
    }
  }

  watch(
    channel,
    (next) => {
      if (next) void load(next)
      else channels.value = []
    },
    { immediate: true },
  )

  return { channels, loading }
}
