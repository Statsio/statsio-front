import { apiHttp } from '@/lib/http'
import type { ChannelEntry } from '@/data/channels'

interface ApiChannelProfile {
  id: number
  channel_id: number
  name: string
  handle: string
  description: string | null
  logo: string | null
  banner: string | null
  tags: string[] | null
  country: string | null
  is_featured: boolean
  view_count: number
  custom_color_primary: string | null
  custom_color_secondary: string | null
  age_restriction: string | null
  subscriber_count: number
  categories: string[]
  logo_url: string | null
  banner_url: string | null
  created_at: string
  updated_at: string
}

interface ApiChannel {
  id: number
  status: string
  suspended_until: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  profile: ApiChannelProfile | null
}

interface ApiPaginatedResponse<T> {
  current_page: number
  last_page: number
  per_page: number
  total: number
  data: T[]
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

function mapApiChannelToEntry(apiChannel: ApiChannel): ChannelEntry {
  const profile = apiChannel.profile
  const name = profile?.name || 'Chaîne sans nom'
  // Le handle stocké en base ne contient généralement pas le @, on l'ajoute pour l'affichage
  const rawHandle = profile?.handle || ''
  const handle = rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Pour les thèmes, on utilise les categories (slugs)
  const themes = profile?.categories || []

  // Pour les articles/statsData/polls, non disponibles via l'API Channels,
  // on renvoie des tableaux vides (à remplir par d'autres endpoints si besoin)
  return {
    slug: String(apiChannel.id),
    name,
    handle,
    initials,
    isOfficial: false, // Pas de champ dans l'API, à déterminer autrement
    description: profile?.description || '',
    longDescription: profile?.description || '',
    themes,
    subscriptions: 0, // Pas de distinction payant/gratuit dans l'API actuelle
    followers: profile?.subscriber_count || 0,
    articles: [],
    statsData: [],
    polls: [],
    tone: 'primary' as const, // Par défaut, à adapter si l'API fournit cette info
    hasPaidSubscription: false, // Non exposé dans l'API
    subscriptionPrice: undefined,
    logoUrl: profile?.logo_url || null,
    bannerUrl: profile?.banner_url || null,
    ageRestriction: profile?.age_restriction ? Number(profile.age_restriction) || undefined : undefined,
    createdAt: apiChannel.created_at,
    country: profile?.country || null,
    viewCount: profile?.view_count || 0,
  }
}

export async function fetchAllChannels(): Promise<ChannelEntry[]> {
  const envelope = await apiHttp.get<ApiEnvelope<ApiPaginatedResponse<ApiChannel>>>('/channels', {
    params: { per_page: 100 },
  })
  return envelope.data.data.data.map(mapApiChannelToEntry)
}

export async function fetchChannelByHandle(handle: string): Promise<ChannelEntry | undefined> {
  const channels = await fetchAllChannels()
  const normalized = handle.startsWith('@') ? handle : '@' + handle
  return channels.find((c) => c.handle === normalized)
}

export async function fetchChannelById(id: string | number): Promise<ChannelEntry | undefined> {
  const envelope = await apiHttp.get<ApiEnvelope<ApiChannel>>(`/channels/${id}`)
  if (envelope.data.success) {
    return mapApiChannelToEntry(envelope.data.data)
  }
  return undefined
}
