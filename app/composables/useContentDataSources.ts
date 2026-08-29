import { computed, onMounted, watch, type Ref } from 'vue'
import { fetchContentDataSources } from '@/api/studio'
import type { ChannelDataSource } from '@/api/channels'

/**
 * Jeux de données référencés par les blocs d'un contenu — alimente l'onglet
 * « Sources de données » du dashboard du contenu. Mis en cache par slug via
 * `useState`.
 */
export function useContentDataSources(slug: Ref<string>) {
  const sources = useState<ChannelDataSource[]>('content-dashboard:data-sources', () => [])
  const loading = useState('content-dashboard:data-sources:loading', () => true)
  const error = useState('content-dashboard:data-sources:error', () => '')
  const loadedSlug = useState<string | null>('content-dashboard:data-sources:slug', () => null)
  const fetchingSlug = useState<string | null>(
    'content-dashboard:data-sources:fetching',
    () => null,
  )

  async function load(force = false) {
    if (!slug.value) return
    if (!force && (loadedSlug.value === slug.value || fetchingSlug.value === slug.value)) return
    fetchingSlug.value = slug.value
    loading.value = true
    error.value = ''
    try {
      sources.value = await fetchContentDataSources(slug.value)
      loadedSlug.value = slug.value
    } catch {
      error.value = 'Impossible de charger les sources de données.'
    } finally {
      loading.value = false
      if (fetchingSlug.value === slug.value) fetchingSlug.value = null
    }
  }

  onMounted(() => load())
  watch(slug, () => load())

  const count = computed(() => sources.value.length)

  return { sources, loading, error, count, reload: () => load(true) }
}
