import { onMounted, ref, watch, type Ref } from 'vue'
import { fetchPublicArticles, fetchPublicStatsDataCatalog, fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'

/**
 * Vrais contenus publiés d'une chaîne, pour la page publique Détail Chaîne (onglets
 * Articles/StatsData/Sondages). Le contenu "à la une" n'est pas chargé ici : il est déjà
 * porté par `channel.featured` (voir useChannelProfile), pas besoin d'un second appel réseau.
 */
export function useChannelPublicContent(channelId: Ref<number | undefined>) {
  const articles = ref<StatsDataDocument[]>([])
  const statsData = ref<StatsDataDocument[]>([])
  const polls = ref<StatsDataDocument[]>([])
  const loading = ref(true)

  async function load() {
    if (!channelId.value) return
    loading.value = true
    try {
      const [a, s, p] = await Promise.all([
        fetchPublicArticles(undefined, channelId.value),
        fetchPublicStatsDataCatalog(undefined, channelId.value),
        fetchPublicSurveys(undefined, channelId.value),
      ])
      articles.value = a
      statsData.value = s
      polls.value = p
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  watch(channelId, load)

  return { articles, statsData, polls, loading, reload: load }
}
