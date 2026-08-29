import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { fetchUserStudioContents, type StatsDataDocument } from '@/api/studio'
import type { Channel } from '@/api/channels'
import { CONTENT_TYPE_META, contentPropertiesPath, getStatusMeta, publicContentPath } from '@/lib/content-display'
import { formatShortDate, getNameInitials } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'
import type { ContentType } from '@/types/content-creation'
import type { DisplayContent } from '@/composables/useMyStudioContents'

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
 * "Contenus récents" de la vue d'ensemble.
 */
export function useChannelContents(channelId: Ref<number>, channel: Ref<Channel | null>) {
  // Liste partagée (shell + pages) mise en cache par chaîne ; `filter` reste local
  // à chaque écran.
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

  function toDisplay(doc: StatsDataDocument): DisplayContent {
    const type = doc.type ?? 'statsdata'
    const typeMeta = CONTENT_TYPE_META[type]
    const status = getStatusMeta(doc.status, doc.visibility)
    const name = channel.value?.profile?.name ?? 'Chaîne'
    const colors = resolveChannelColors(
      String(channel.value?.id ?? name),
      channel.value?.profile?.custom_color_primary,
      channel.value?.profile?.custom_color_secondary,
    )

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
      ownerKind: 'chaine',
      ownerLabel: name,
      avatarInitials: getNameInitials(name),
      avatarLogoUrl: channel.value?.profile?.logo_url ?? null,
      avatarBg: channelBannerStyle(colors.primary, colors.secondary).background,
      avatarShape: 'square',
      date: formatShortDate(doc.updated_at ?? doc.created_at),
      viewsCount: doc.views_count ?? 0,
      studioPath: `/studio/${type}/${doc.slug ?? doc.id}`,
      propertiesPath: contentPropertiesPath(type, doc.slug),
      publicPath: status.live && doc.slug ? publicContentPath(type, doc.slug) : null,
    }
  }

  const displayContents = computed(() => docs.value.map(toDisplay))

  const filteredContents = computed(() =>
    filter.value === 'all'
      ? displayContents.value
      : displayContents.value.filter((c) => c.type === filter.value),
  )

  const isEmpty = computed(() => docs.value.length === 0)
  const isFilteredEmpty = computed(() => !loading.value && filteredContents.value.length === 0)

  return {
    loading,
    filter,
    filterOptions: CONTENT_TYPE_FILTER_OPTIONS,
    displayContents,
    filteredContents,
    isEmpty,
    isFilteredEmpty,
    reload: () => load(true),
  }
}
