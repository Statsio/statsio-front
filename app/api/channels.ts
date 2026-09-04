import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import type { ChannelCatalogQuery, ChannelCatalogResponse } from '@/types/channel-catalog'
import type { CategorySubBrand, SubBrand } from '@/types/sub-brand'

export type ChannelKind = 'redaction' | 'institution' | 'independant'

export type ChannelCategory =
  | 'sport'
  | 'actualite'
  | 'actus_medias'
  | 'actus_people'
  | 'editos'
  | 'science'
  | 'technologie'
  | 'culture'
  | 'economie'
  | 'politique'

export type CreateChannelPayload = {
  name: string
  handle: string
  description?: string
  categories?: ChannelCategory[]
  sub_brand?: SubBrand
  logo?: File
  banner?: File
  custom_color_primary?: string
  custom_color_secondary?: string
}

export type ChannelProfile = {
  id: number
  channel_id: number
  name: string
  handle: string
  kind: ChannelKind
  description: string | null
  is_private: boolean
  logo: string | null
  banner: string | null
  logo_url: string | null
  banner_url: string | null
  categories: ChannelCategory[]
  tags: string[]
  country: string | null
  /** Sous-marque de rattachement de la chaîne (« domaine »). Défaut `statsio`. */
  sub_brand: CategorySubBrand
  is_featured: boolean
  subscriber_count: number
  view_count: number
  custom_color_primary: string | null
  custom_color_secondary: string | null
  is_following: boolean
  created_at: string
  updated_at: string
}

export type ChannelOrganization = {
  id: number
  name: string
  principal_channel_id: number
  principal_channel?: {
    id: number
    profile?: { name: string; handle: string; logo_url: string | null } | null
  } | null
}

export type Channel = {
  id: number
  status: string
  suspended_until: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  profile: ChannelProfile
  badges: string[]
  organization: ChannelOrganization | null
}

/** Libellés des badges de chaîne — mirror du hardcodage déjà fait pour channelCategoryLabels. */
export const CHANNEL_BADGE_LABELS: Record<string, string> = {
  verified: 'Chaîne vérifiée',
}

export async function createChannel(payload: CreateChannelPayload): Promise<Channel> {
  const formData = new FormData()

  formData.append('name', payload.name)
  formData.append('handle', payload.handle)

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.categories && payload.categories.length > 0) {
    payload.categories.forEach((category, index) => {
      formData.append(`categories[${index}]`, category)
    })
  }

  if (payload.logo) {
    formData.append('logo', payload.logo)
  }

  if (payload.banner) {
    formData.append('banner', payload.banner)
  }

  if (payload.custom_color_primary) {
    formData.append('custom_color_primary', payload.custom_color_primary)
  }

  if (payload.custom_color_secondary) {
    formData.append('custom_color_secondary', payload.custom_color_secondary)
  }

  if (payload.sub_brand) {
    formData.append('sub_brand', payload.sub_brand)
  }

  const response = await apiHttp.post<{ success: boolean; data: Channel; message: string }>(
    '/channels',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data.data
}

export type ChannelCategoryItem = {
  id: number
  slug: string
  label: string
  /** Sous-marque de rattachement (`all` = disponible partout). */
  sub_brand?: CategorySubBrand
}

export async function getChannelCategories(subBrand?: SubBrand): Promise<ChannelCategoryItem[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelCategoryItem[] }>('/channels/categories', {
    params: subBrand ? { sub_brand: subBrand } : {},
  })
  return response.data.data
}

export async function getMyChannels(): Promise<Channel[]> {
  const response = await apiHttp.get<{ success: boolean; data: { data: Channel[] } }>('/channels/my')
  // Filtrer les chaînes sans profil (données corrompues)
  return response.data.data.data.filter((c: Channel) => c.profile !== null)
}

export async function getChannels(): Promise<Channel[]> {
  const response = await apiHttp.get<{ success: boolean; data: Channel[] }>('/channels')
  return response.data.data
}

export type ChannelSort = 'popular' | 'views' | 'name' | 'recent'

export type ChannelsListParams = {
  search?: string
  category?: ChannelCategory | ''
  sort?: ChannelSort
  page?: number
  perPage?: number
}

export type PaginatedChannels = {
  channels: Channel[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

/**
 * Annuaire public des chaînes (page /chaines) : channels actifs uniquement,
 * avec recherche, filtre catégorie, tri et pagination côté serveur.
 */
export async function getPublicChannels(params: ChannelsListParams = {}): Promise<PaginatedChannels> {
  const response = await apiHttp.get<{
    success: boolean
    data: {
      data: Channel[]
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }>('/channels', {
    params: {
      search: params.search || undefined,
      category: params.category || undefined,
      sort: params.sort ?? 'popular',
      page: params.page ?? 1,
      per_page: params.perPage ?? 12,
    },
  })

  const page = response.data.data

  return {
    channels: page.data.filter((channel) => channel.profile !== null),
    currentPage: page.current_page,
    lastPage: page.last_page,
    perPage: page.per_page,
    total: page.total,
  }
}

export async function getChannel(id: number): Promise<Channel> {
  const response = await apiHttp.get<{ success: boolean; data: Channel }>(`/channels/${id}`)
  return response.data.data
}

const EMPTY_CATALOG: ChannelCatalogResponse = {
  data: [],
  meta: { total: 0, shown: 0, per_page: 9, has_more: false },
  facets: { kinds: [], themes: [], paces: [] },
  stats: { active: 0, verified: 0, publications_month: 0, last_channel_at: null },
  featured: null,
}

/**
 * Annuaire « v2 » des chaînes (page /chaines) : recherche, facettes type / thème /
 * rythme, tri, chaîne du mois et stats. Réponse alignée sur le catalogue
 * articles/statsdata. `apiHttp` envoie le token si l'utilisateur est connecté
 * (pour `is_following` et le filtre « mes abonnements »), sinon appel public.
 */
export async function fetchChannelCatalog(query: ChannelCatalogQuery = {}): Promise<ChannelCatalogResponse> {
  const { data } = await apiHttp.get<{ success: boolean; data: Partial<ChannelCatalogResponse> }>(
    STATSIO_API.channels.catalog,
    {
      params: {
        ...(query.q ? { q: query.q } : {}),
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.pace ? { pace: query.pace } : {}),
        ...(query.sort ? { sort: query.sort } : {}),
        ...(query.sub_brand ? { sub_brand: query.sub_brand } : {}),
        ...(query.verified ? { verified: 1 } : {}),
        ...(query.followed ? { followed: 1 } : {}),
        ...(query.per_page ? { per_page: query.per_page } : {}),
      },
    },
  )

  return {
    data: data.data?.data ?? EMPTY_CATALOG.data,
    meta: data.data?.meta ?? { ...EMPTY_CATALOG.meta, per_page: query.per_page ?? 9 },
    facets: data.data?.facets ?? EMPTY_CATALOG.facets,
    stats: data.data?.stats ?? EMPTY_CATALOG.stats,
    featured: data.data?.featured ?? null,
  }
}

export type ChannelStats = {
  views: {
    total: number
    growthPercent: number
    series: { date: string; views: number }[]
  }
  subscribers: {
    total: number
    growth: { newCount: number; growthPercent: number }
  }
  teamMemberCount: number
  lifetimeViews: number
}

export async function getChannelStats(id: number): Promise<ChannelStats> {
  const response = await apiHttp.get<{
    success: boolean
    data: {
      views: { total: number; growth_percent: number; series: { date: string; views: number }[] }
      subscribers: { total: number; growth: { new_count: number; growth_percent: number } }
      team_member_count: number
      lifetime_views: number
    }
  }>(`/channels/${id}/stats`)
  const raw = response.data.data

  return {
    views: {
      total: raw.views.total,
      growthPercent: raw.views.growth_percent,
      series: raw.views.series,
    },
    subscribers: {
      total: raw.subscribers.total,
      growth: {
        newCount: raw.subscribers.growth.new_count,
        growthPercent: raw.subscribers.growth.growth_percent,
      },
    },
    teamMemberCount: raw.team_member_count,
    lifetimeViews: raw.lifetime_views,
  }
}

export type ChannelDataSourceUsage = {
  id: string
  title: string
  type: string
  slug: string | null
}

export type ChannelDataSource = {
  id: string
  name: string
  type: string | null
  sourceKind: string | null
  origin: string | null
  rowCount: number
  status: 'ready' | 'failed' | 'pending'
  lastRefreshedAt: string | null
  nextRefreshAt: string | null
  refreshFrequency: string | null
  usedByCount: number
  usedBy: ChannelDataSourceUsage[]
}

type RawChannelDataSource = {
  id: string
  name: string
  type: string | null
  source_kind: string | null
  origin: string | null
  row_count: number
  status: ChannelDataSource['status']
  last_refreshed_at: string | null
  next_refresh_at: string | null
  refresh_frequency: string | null
  used_by_count: number
  used_by: ChannelDataSourceUsage[]
}

export async function getChannelDataSources(id: number): Promise<ChannelDataSource[]> {
  const response = await apiHttp.get<{ success: boolean; data: RawChannelDataSource[] }>(
    `/channels/${id}/data-sources`,
  )
  return response.data.data.map((raw) => ({
    id: raw.id,
    name: raw.name,
    type: raw.type,
    sourceKind: raw.source_kind,
    origin: raw.origin,
    rowCount: raw.row_count,
    status: raw.status,
    lastRefreshedAt: raw.last_refreshed_at,
    nextRefreshAt: raw.next_refresh_at,
    refreshFrequency: raw.refresh_frequency,
    usedByCount: raw.used_by_count,
    usedBy: raw.used_by,
  }))
}

export type ToggleSubscriptionResponse = {
  isFollowing: boolean
  followersCount: number
}

export async function toggleChannelSubscription(id: number): Promise<ToggleSubscriptionResponse> {
  const response = await apiHttp.post<{ success: boolean; data: ToggleSubscriptionResponse }>(
    `/channels/${id}/follow`,
  )
  return response.data.data
}

export async function updateChannel(id: number, payload: Partial<CreateChannelPayload>): Promise<Channel> {
  const formData = new FormData()

  if (payload.name) {
    formData.append('name', payload.name)
  }

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.categories && payload.categories.length > 0) {
    payload.categories.forEach((category, index) => {
      formData.append(`categories[${index}]`, category)
    })
  }

  if (payload.logo) {
    formData.append('logo', payload.logo)
  }

  if (payload.banner) {
    formData.append('banner', payload.banner)
  }

  if (payload.custom_color_primary) {
    formData.append('custom_color_primary', payload.custom_color_primary)
  }

  if (payload.custom_color_secondary) {
    formData.append('custom_color_secondary', payload.custom_color_secondary)
  }

  const response = await apiHttp.post<{ success: boolean; data: Channel; message: string }>(
    `/channels/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data.data
}

export type ChannelRole = 'owner' | 'admin' | 'redactor' | 'guest' | 'subscriber'

export const INVITABLE_ROLES: ChannelRole[] = ['owner', 'admin', 'redactor', 'guest']

export const channelRoleLabels: Record<ChannelRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  redactor: 'Rédacteur',
  guest: 'Invité',
  subscriber: 'Abonné',
}

export type ChannelPermission = { key: string; label: string }
export type ChannelPermissionCategory = { category: string; permissions: ChannelPermission[] }

export type ChannelMember = {
  id: number
  email: string
  name: string
  avatar: string | null
  role: ChannelRole
  permissions: string[]
  joined_at: string
}

export type ChannelInvitation = {
  id: number
  email: string
  role: ChannelRole
  permissions: string[]
  invited_by_name: string | null
  created_at: string
  expires_at: string
}

export type ChannelSubscriber = {
  id: number
  email: string
  name: string
  avatar: string | null
  subscribed_at: string
}

export type UpdateChannelPayload = {
  name?: string
  handle?: string
  kind?: ChannelKind
  description?: string
  is_private?: boolean
  categories?: ChannelCategory[]
  sub_brand?: SubBrand
  logo?: File
  banner?: File
  custom_color_primary?: string
  custom_color_secondary?: string
  country?: string
  tags?: string[]
}

export async function updateChannelProfile(id: number, payload: UpdateChannelPayload): Promise<Channel> {
  const formData = new FormData()
  // PHP ne parse jamais un corps multipart/form-data pour une requête PUT (seul POST est
  // supporté nativement) : $request->all() serait vide côté Laravel et la mise à jour
  // no-op silencieusement (200 OK sans rien persister). On envoie donc en POST avec le
  // spoofing de méthode Laravel (_method=PUT), qui route toujours vers PUT /channels/{id}
  // tout en laissant PHP parser correctement le corps multipart.
  formData.append('_method', 'PUT')
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.handle !== undefined) formData.append('handle', payload.handle)
  if (payload.kind !== undefined) formData.append('kind', payload.kind)
  if (payload.sub_brand !== undefined) formData.append('sub_brand', payload.sub_brand)
  if (payload.description !== undefined) formData.append('description', payload.description)
  if (payload.is_private !== undefined) formData.append('is_private', payload.is_private ? '1' : '0')
  if (payload.categories?.length) {
    payload.categories.forEach((c, i) => formData.append(`categories[${i}]`, c))
  }
  if (payload.logo) formData.append('logo', payload.logo)
  if (payload.banner) formData.append('banner', payload.banner)
  if (payload.custom_color_primary) formData.append('custom_color_primary', payload.custom_color_primary)
  if (payload.custom_color_secondary) formData.append('custom_color_secondary', payload.custom_color_secondary)
  if (payload.country !== undefined) formData.append('country', payload.country)
  if (payload.tags?.length) {
    payload.tags.forEach((t, i) => formData.append(`tags[${i}]`, t))
  }

  const response = await apiHttp.post<{ success: boolean; data: Channel; message: string }>(
    `/channels/${id}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data.data
}

export async function updateChannelMedia(
  id: number,
  payload: { logoMediaId?: number | null; bannerMediaId?: number | null },
): Promise<Channel> {
  const body: Record<string, number> = {}
  if (payload.logoMediaId != null) body.logo_media_id = payload.logoMediaId
  if (payload.bannerMediaId != null) body.banner_media_id = payload.bannerMediaId

  const response = await apiHttp.post<{ success: boolean; data: Channel }>(`/channels/${id}/media`, body)
  return response.data.data
}

export async function getChannelMembers(id: number): Promise<ChannelMember[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelMember[] }>(`/channels/${id}/members`)
  return response.data.data
}

export async function getChannelPermissionsCatalog(): Promise<ChannelPermissionCategory[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelPermissionCategory[] }>('/channels/permissions')
  return response.data.data
}

export type InviteChannelMembersPayload = {
  emails: string[]
  role: ChannelRole
  permissions: string[]
}

export type InviteChannelMembersResult = {
  created: string[]
  resent: string[]
  skipped: { email: string; reason: string }[]
}

export async function inviteChannelMembers(id: number, payload: InviteChannelMembersPayload): Promise<InviteChannelMembersResult> {
  const response = await apiHttp.post<{ success: boolean; data: InviteChannelMembersResult }>(`/channels/${id}/invitations`, payload)
  return response.data.data
}

export async function getChannelInvitations(id: number): Promise<ChannelInvitation[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelInvitation[] }>(`/channels/${id}/invitations`)
  return response.data.data
}

export async function revokeChannelInvitation(id: number, invitationId: number): Promise<void> {
  await apiHttp.delete(`/channels/${id}/invitations/${invitationId}`)
}

export type InvitationDetails = {
  channel_id: number
  channel_name: string | null
  channel_logo: string | null
  role: ChannelRole
  role_label: string
  email: string
  status: string
  expired: boolean
}

export async function getInvitationByToken(token: string): Promise<InvitationDetails> {
  const response = await apiHttp.get<{ success: boolean; data: InvitationDetails }>(`/channels/invitations/${token}`)
  return response.data.data
}

export async function acceptChannelInvitation(token: string): Promise<{ channel_id: number }> {
  const response = await apiHttp.post<{ success: boolean; data: { channel_id: number } }>(`/channels/invitations/${token}/accept`)
  return response.data.data
}

export async function getChannelSubscribers(id: number, page = 1): Promise<{ data: ChannelSubscriber[]; total: number; last_page: number }> {
  const response = await apiHttp.get<{ success: boolean; data: { data: ChannelSubscriber[]; total: number; last_page: number } }>(`/channels/${id}/subscribers?page=${page}`)
  return response.data.data
}


export async function deleteChannel(id: number): Promise<void> {
  await apiHttp.delete(`/channels/${id}`)
}

/** Organisations que l'utilisateur connecté peut lier à cette chaîne (celles dont il possède déjà la chaîne principale). */
export async function getJoinableOrganizations(channelId: number): Promise<ChannelOrganization[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelOrganization[] }>(`/channels/${channelId}/organization/joinable`)
  return response.data.data
}

/** Crée une organisation à partir de cette chaîne, qui en devient la chaîne principale. */
export async function createOrganization(channelId: number, name: string): Promise<ChannelOrganization> {
  const response = await apiHttp.post<{ success: boolean; data: ChannelOrganization }>(`/channels/${channelId}/organization`, { name })
  return response.data.data
}

/** Lie cette chaîne à une organisation existante que l'utilisateur possède déjà. */
export async function joinOrganization(channelId: number, organizationId: number): Promise<ChannelOrganization> {
  const response = await apiHttp.put<{ success: boolean; data: ChannelOrganization }>(`/channels/${channelId}/organization`, { organization_id: organizationId })
  return response.data.data
}

/** Quitte l'organisation (la dissout si cette chaîne en est la chaîne principale). */
export async function leaveOrganization(channelId: number): Promise<void> {
  await apiHttp.delete(`/channels/${channelId}/organization`)
}

export const channelCategoryLabels: Record<ChannelCategory, string> = {
  sport: 'Sport',
  actualite: 'Actualité',
  actus_medias: 'Actus Médias',
  actus_people: 'Actus People',
  editos: 'Éditos',
  science: 'Science',
  technologie: 'Technologie',
  culture: 'Culture',
  economie: 'Économie',
  politique: 'Politique',
}
