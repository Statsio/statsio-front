import { computed, onMounted, ref } from 'vue'
import { fetchUserStudioContents, type StatsDataDocument } from '@/api/studio'
import { useMyChannels } from '@/composables/useMyChannels'
import { useAuthStore } from '@/stores/auth'
import { catalogItemFromDocument, catalogPublisherFromChannelOrAuthor } from '@/lib/content-card'
import { contentManageMeta } from '@/lib/content-manage'
import type { ContentCardEntry } from '@/types/content-card'

export type OwnerFilter = 'all' | 'perso' | 'chaine'

export const OWNER_FILTER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'perso', label: 'Personnels' },
  { value: 'chaine', label: 'De mes chaînes' },
]

function ownerKindOf(doc: StatsDataDocument): 'perso' | 'chaine' {
  return doc.published_as === 'channel' ? 'chaine' : 'perso'
}

/** Contenus studio du membre connecté (perso + chaînes) → cartes créateur (`ContentManageCard`). */
export function useMyStudioContents() {
  const auth = useAuthStore()
  const { channels, fetch: fetchChannels } = useMyChannels()

  const docs = ref<StatsDataDocument[]>([])
  const loading = ref(true)
  const filter = ref<OwnerFilter>('all')

  onMounted(async () => {
    loading.value = true
    try {
      const [contents] = await Promise.all([fetchUserStudioContents(), fetchChannels()])
      docs.value = contents
    } finally {
      loading.value = false
    }
  })

  function channelOf(doc: StatsDataDocument) {
    return channels.value.find((c) => c.id === doc.channel_id)
  }

  function ownerLabel(doc: StatsDataDocument): string {
    if (ownerKindOf(doc) === 'chaine') {
      return `${channelOf(doc)?.profile?.name ?? `Chaîne #${doc.channel_id ?? '?'}`} · Chaîne`
    }
    return `${auth.displayName} · Perso`
  }

  function toEntry(doc: StatsDataDocument): ContentCardEntry {
    let publisher
    if (ownerKindOf(doc) === 'chaine') {
      const channel = channelOf(doc)
      publisher = catalogPublisherFromChannelOrAuthor(
        {
          id: doc.channel_id,
          name: channel?.profile?.name ?? `Chaîne #${doc.channel_id ?? '?'}`,
          handle: channel?.profile?.handle,
          logo_url: channel?.profile?.logo_url,
        },
        null,
      )
    } else {
      publisher = catalogPublisherFromChannelOrAuthor(null, { name: auth.displayName })
    }

    return {
      item: catalogItemFromDocument(doc, publisher),
      manage: contentManageMeta(doc, {
        resolveOwner: (d) => ({ kind: ownerKindOf(d), label: ownerLabel(d) }),
      }),
    }
  }

  const entries = computed<ContentCardEntry[]>(() => docs.value.map(toEntry))

  const filteredContents = computed(() =>
    filter.value === 'all'
      ? entries.value
      : entries.value.filter((e) => e.manage?.ownerKind === filter.value),
  )

  const isEmpty = computed(() => docs.value.length === 0)
  const isFilteredEmpty = computed(() => !loading.value && filteredContents.value.length === 0)

  return {
    loading,
    filter,
    filterOptions: OWNER_FILTER_OPTIONS,
    filteredContents,
    isEmpty,
    isFilteredEmpty,
  }
}
