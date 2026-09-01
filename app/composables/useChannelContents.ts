import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { fetchUserStudioContents, type StatsDataDocument } from '@/api/studio'
import type { Channel } from '@/api/channels'
import { catalogItemFromDocument, catalogPublisherFromChannelOrAuthor } from '@/lib/content-card'
import { contentManageMeta } from '@/lib/content-manage'
import type { ContentType } from '@/types/content-creation'
import type { ContentCardEntry } from '@/types/content-card'

export type ContentTypeFilter = 'all' | ContentType

export const CONTENT_TYPE_FILTER_OPTIONS: { value: ContentTypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'article', label: 'Articles' },
  { value: 'statsdata', label: 'StatsData' },
  { value: 'survey', label: 'Sondages' },
]

/**
 * Tous les contenus publiés au nom d'une chaîne (pas seulement ceux du membre
 * connecté) — alimente l'onglet "Contenus" du dashboard chaîne et le récap
 * "Contenus récents" de la vue d'ensemble. Rend des `ContentCardEntry`.
 */
export function useChannelContents(channelId: Ref<number>, channel: Ref<Channel | null>) {
  const docs = useState<StatsDataDocument[]>('channel-dashboard:contents', () => [])
  const loading = useState('channel-dashboard:contents:loading', () => true)
  const loadedId = useState<number | null>('channel-dashboard:contents:id', () => null)
  const fetchingId = useState<number | null>('channel-dashboard:contents:fetching', () => null)
  const filter = ref<ContentTypeFilter>('all')

  async function load(force = false) {
    if (!channelId.value) return
    if (!force && (loadedId.value === channelId.value || fetchingId.value === channelId.value)) return
    fetchingId.value = channelId.value
    loading.value = true
    try {
      docs.value = await fetchUserStudioContents(undefined, channelId.value)
      loadedId.value = channelId.value
    } finally {
      loading.value = false
      if (fetchingId.value === channelId.value) fetchingId.value = null
    }
  }

  onMounted(() => load())
  watch(channelId, () => load())

  function toEntry(doc: StatsDataDocument): ContentCardEntry {
    const name = channel.value?.profile?.name ?? 'Chaîne'
    const publisher = catalogPublisherFromChannelOrAuthor(
      {
        id: channel.value?.id ?? doc.channel_id,
        name,
        handle: channel.value?.profile?.handle,
        logo_url: channel.value?.profile?.logo_url,
      },
      null,
    )

    return {
      item: catalogItemFromDocument(doc, publisher),
      manage: contentManageMeta(doc, {
        resolveOwner: () => ({ kind: 'chaine', label: name }),
      }),
    }
  }

  const entries = computed<ContentCardEntry[]>(() => docs.value.map(toEntry))

  const filteredContents = computed(() =>
    filter.value === 'all' ? entries.value : entries.value.filter((e) => e.item.type === filter.value),
  )

  const isEmpty = computed(() => docs.value.length === 0)
  const isFilteredEmpty = computed(() => !loading.value && filteredContents.value.length === 0)

  return {
    loading,
    filter,
    filterOptions: CONTENT_TYPE_FILTER_OPTIONS,
    entries,
    filteredContents,
    isEmpty,
    isFilteredEmpty,
    reload: () => load(true),
  }
}
