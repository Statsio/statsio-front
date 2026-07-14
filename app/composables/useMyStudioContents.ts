import { computed, onMounted, ref } from 'vue'
import { fetchUserStudioContents, type StatsDataDocument } from '@/api/studio'
import { useMyChannels } from '@/composables/useMyChannels'
import { useAuthStore } from '@/stores/auth'
import { CONTENT_TYPE_META, getStatusMeta, publicContentPath } from '@/lib/content-display'
import { formatShortDate, getNameInitials, getUserInitials } from '@/lib/format'
import type { ContentType } from '@/types/content-creation'

export type OwnerFilter = 'all' | 'perso' | 'chaine'

export const OWNER_FILTER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'perso', label: 'Personnels' },
  { value: 'chaine', label: 'De mes chaînes' },
]

export interface DisplayContent {
  id: string
  title: string
  type: ContentType
  typeLabel: string
  typeColor: string
  typeBg: string
  statusLabel: string
  statusBg: string
  statusColor: string
  live: boolean
  ownerKind: 'perso' | 'chaine'
  ownerLabel: string
  avatarInitials: string
  avatarBg: string
  avatarShape: 'circle' | 'square'
  date: string
  studioPath: string
  propertiesPath: string | null
  publicPath: string | null
}

function ownerKindOf(doc: StatsDataDocument): 'perso' | 'chaine' {
  return doc.published_as === 'channel' ? 'chaine' : 'perso'
}

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

  function toDisplay(doc: StatsDataDocument): DisplayContent {
    const type = doc.type ?? 'statsdata'
    const typeMeta = CONTENT_TYPE_META[type]
    const status = getStatusMeta(doc.status, doc.visibility)
    const ownerKind = ownerKindOf(doc)

    let ownerLabel: string
    let avatarInitials: string
    let avatarBg: string
    let avatarShape: 'circle' | 'square'

    if (ownerKind === 'chaine') {
      const channel = channels.value.find((c) => c.id === doc.channel_id)
      const name = channel?.profile?.name ?? `Chaîne #${doc.channel_id ?? '?'}`
      ownerLabel = `${name} · Chaîne`
      avatarInitials = getNameInitials(name)
      avatarBg = channel?.profile?.custom_color_primary || '#166534'
      avatarShape = 'square'
    } else {
      ownerLabel = `${auth.displayName} · Perso`
      avatarInitials = getUserInitials(auth.user?.profile?.first_name, auth.user?.profile?.last_name, auth.displayName[0] ?? '?')
      avatarBg = 'linear-gradient(135deg,#8b5cf6,#3b82f6)'
      avatarShape = 'circle'
    }

    return {
      id: doc.id,
      title: doc.title,
      type,
      typeLabel: typeMeta.label,
      typeColor: typeMeta.color,
      typeBg: typeMeta.bg,
      statusLabel: status.label,
      statusBg: status.bg,
      statusColor: status.color,
      live: status.live,
      ownerKind,
      ownerLabel,
      avatarInitials,
      avatarBg,
      avatarShape,
      date: formatShortDate(doc.updated_at ?? doc.created_at),
      studioPath: `/studio/${type}/${doc.slug ?? doc.id}`,
      propertiesPath: type === 'statsdata' && doc.slug ? `/statsdata/${doc.slug}/proprietes` : null,
      publicPath: status.live && doc.slug ? publicContentPath(type, doc.slug) : null,
    }
  }

  const displayContents = computed(() => docs.value.map(toDisplay))

  const filteredContents = computed(() =>
    filter.value === 'all'
      ? displayContents.value
      : displayContents.value.filter((c) => c.ownerKind === filter.value),
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
