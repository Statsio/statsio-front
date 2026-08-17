import { apiHttp } from '@/lib/http'
import type { ChannelOrganization } from '@/api/channels'

// ---- Users ----

export type AdminUser = {
  id: number
  email: string
  status: string
  is_admin: boolean
  deleted_at: string | null
  created_at: string
  profile: { first_name: string | null; last_name: string | null } | null
}

export type PaginatedUsers = {
  data: AdminUser[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListUsers(
  params: { page?: number; search?: string; status?: string } = {},
): Promise<PaginatedUsers> {
  const { data } = await apiHttp.get<PaginatedUsers>('/admin/users', { params })
  return data
}

export async function adminUpdateUser(
  id: number,
  payload: { is_admin?: boolean; status?: string },
): Promise<AdminUser> {
  const { data } = await apiHttp.patch<AdminUser>(`/admin/users/${id}`, payload)
  return data
}

export async function adminDeleteUser(id: number): Promise<void> {
  await apiHttp.delete(`/admin/users/${id}`)
}

export async function adminRestoreUser(id: number): Promise<AdminUser> {
  const { data } = await apiHttp.post<AdminUser>(`/admin/users/${id}/restore`)
  return data
}

// ---- Channels ----

export type AdminChannel = {
  id: number
  slug: string
  number: number
  display_name: string
  epg_channel_id: string | null
  logo_url: string | null
  is_active: boolean
  broadcasts_count?: number
  created_at: string
  updated_at: string
}

export type PaginatedChannels = {
  data: AdminChannel[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListChannels(
  params: { page?: number; search?: string; active?: string } = {},
): Promise<PaginatedChannels> {
  const { data } = await apiHttp.get<PaginatedChannels>('/admin/tv/channels', { params })
  return data
}

export async function adminGetChannel(id: number): Promise<AdminChannel> {
  const { data } = await apiHttp.get<AdminChannel>(`/admin/tv/channels/${id}`)
  return data
}

export async function adminCreateChannel(
  payload: Omit<AdminChannel, 'id' | 'broadcasts_count' | 'created_at' | 'updated_at'>,
): Promise<AdminChannel> {
  const { data } = await apiHttp.post<AdminChannel>('/admin/tv/channels', payload)
  return data
}

export async function adminUpdateChannel(
  id: number,
  payload: Partial<AdminChannel>,
): Promise<AdminChannel> {
  const { data } = await apiHttp.patch<AdminChannel>(`/admin/tv/channels/${id}`, payload)
  return data
}

export async function adminUploadChannelLogo(id: number, file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('logo', file)
  const { data } = await apiHttp.post<{ url: string }>(`/admin/tv/channels/${id}/logo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function adminDeleteChannel(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/channels/${id}`)
}

// ---- Chaînes éditoriales (Channel/ChannelProfile — distinct des chaînes TV ci-dessus) ----

export type AdminEditorialChannelOwner = {
  id: number
  email: string
  profile: { first_name: string | null; last_name: string | null } | null
}

export type AdminEditorialChannel = {
  id: number
  status: 'active' | 'suspended' | 'banned' | 'anonymized'
  suspended_until: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  profile: {
    name: string
    handle: string
    logo_url: string | null
    subscriber_count: number
  } | null
  owners: AdminEditorialChannelOwner[]
  subscribers_count: number
  badges: string[]
  organization: ChannelOrganization | null
}

export type PaginatedEditorialChannels = {
  data: AdminEditorialChannel[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListEditorialChannels(
  params: { page?: number; search?: string; status?: string } = {},
): Promise<PaginatedEditorialChannels> {
  const { data } = await apiHttp.get<PaginatedEditorialChannels>('/admin/channels', { params })
  return data
}

export type AdminEditorialChannelMember = {
  id: number
  email: string
  profile: { first_name: string | null; last_name: string | null } | null
  pivot: { role: 'owner' | 'admin' | 'redactor' | 'guest' | 'subscriber' }
}

export type AdminEditorialChannelDetail = {
  id: number
  status: 'active' | 'suspended' | 'banned' | 'anonymized'
  suspended_until: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  subscribers_count: number
  profile: {
    id: number
    name: string
    handle: string
    description: string | null
    logo_url: string | null
    banner_url: string | null
    custom_color_primary: string | null
    custom_color_secondary: string | null
    country: string | null
    categories: string[]
    subscriber_count: number
    view_count: number
  } | null
  management_team: AdminEditorialChannelMember[]
  badges: string[]
  organization: ChannelOrganization | null
}

export async function adminGetEditorialChannel(id: number): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.get<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}`)
  return data.data
}

export type UpdateAdminEditorialChannelPayload = {
  name?: string
  handle?: string
  description?: string | null
  categories?: string[]
  custom_color_primary?: string | null
  custom_color_secondary?: string | null
  country?: string | null
}

export async function adminUpdateEditorialChannel(
  id: number,
  payload: UpdateAdminEditorialChannelPayload,
): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.patch<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}`, payload)
  return data.data
}

// Les 4 actions de modération renvoient toutes la même forme que show()/update()
// (voir AdminEditorialChannelController::detail() côté API) : profil + équipe complète.
export async function adminSuspendEditorialChannel(id: number): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.post<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}/suspend`)
  return data.data
}

export async function adminBanEditorialChannel(id: number): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.post<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}/ban`)
  return data.data
}

export async function adminActivateEditorialChannel(id: number): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.post<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}/activate`)
  return data.data
}

export async function adminAnonymizeEditorialChannel(id: number): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.post<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}/anonymize`)
  return data.data
}

export async function adminSyncEditorialChannelBadges(id: number, badges: string[]): Promise<AdminEditorialChannelDetail> {
  const { data } = await apiHttp.post<{ data: AdminEditorialChannelDetail }>(`/admin/channels/${id}/badges`, { badges })
  return data.data
}

export async function adminDeleteEditorialChannel(id: number): Promise<void> {
  await apiHttp.delete(`/admin/channels/${id}`)
}

// ---- Review Questions ----

export type AdminReviewQuestion = {
  id: number
  label: string
  description: string | null
  category_slugs: string[] | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function adminListReviewQuestions(): Promise<AdminReviewQuestion[]> {
  const { data } = await apiHttp.get<AdminReviewQuestion[]>('/admin/tv/review-questions')
  return data
}

export async function adminCreateReviewQuestion(payload: {
  label: string
  description?: string | null
  category_slugs?: string[] | null
  is_active?: boolean
  sort_order?: number
}): Promise<AdminReviewQuestion> {
  const { data } = await apiHttp.post<AdminReviewQuestion>('/admin/tv/review-questions', payload)
  return data
}

export async function adminUpdateReviewQuestion(
  id: number,
  payload: {
    label?: string
    description?: string | null
    category_slugs?: string[] | null
    is_active?: boolean
    sort_order?: number
  },
): Promise<AdminReviewQuestion> {
  const { data } = await apiHttp.patch<AdminReviewQuestion>(
    `/admin/tv/review-questions/${id}`,
    payload,
  )
  return data
}

export async function adminDeleteReviewQuestion(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/review-questions/${id}`)
}

// ---- Categories ----

export type AdminCategory = {
  id: number
  name: string
  slug: string
  color: string | null
  programs_count?: number
  created_at: string
  updated_at: string
}

export async function adminListCategories(): Promise<AdminCategory[]> {
  const { data } = await apiHttp.get<AdminCategory[]>('/admin/tv/categories')
  return data
}

export async function adminCreateCategory(payload: {
  name: string
  color?: string | null
}): Promise<AdminCategory> {
  const { data } = await apiHttp.post<AdminCategory>('/admin/tv/categories', payload)
  return data
}

export async function adminUpdateCategory(
  id: number,
  payload: { name?: string; color?: string | null },
): Promise<AdminCategory> {
  const { data } = await apiHttp.patch<AdminCategory>(`/admin/tv/categories/${id}`, payload)
  return data
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/categories/${id}`)
}

// ---- Source provenances ----

export type AdminSourceProvenance = {
  id: number
  name: string
  slug: string
  position: number
  data_sources_count?: number
  created_at: string
  updated_at: string
}

export async function adminListSourceProvenances(): Promise<AdminSourceProvenance[]> {
  const { data } = await apiHttp.get<AdminSourceProvenance[]>('/admin/source-provenances')
  return data
}

export async function adminCreateSourceProvenance(payload: {
  name: string
}): Promise<AdminSourceProvenance> {
  const { data } = await apiHttp.post<AdminSourceProvenance>('/admin/source-provenances', payload)
  return data
}

export async function adminUpdateSourceProvenance(
  id: number,
  payload: { name?: string },
): Promise<AdminSourceProvenance> {
  const { data } = await apiHttp.patch<AdminSourceProvenance>(
    `/admin/source-provenances/${id}`,
    payload,
  )
  return data
}

export async function adminDeleteSourceProvenance(id: number): Promise<void> {
  await apiHttp.delete(`/admin/source-provenances/${id}`)
}

// ---- Programs ----

export type AdminProgram = {
  id: number
  title: string
  tv_channel_id: string
  type: string | null
  description: string | null
  image_url: string | null
  youtube_url: string | null
  is_tvstats_pick: boolean
  categories: AdminCategory[]
  broadcasts_count: number
  created_at: string
  updated_at: string
}

export type AdminProgramDetail = AdminProgram & {
  broadcasts: AdminBroadcast[]
}

export type PaginatedPrograms = {
  data: AdminProgram[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListPrograms(
  params: { page?: number; search?: string; channel?: string; type?: string } = {},
): Promise<PaginatedPrograms> {
  const { data } = await apiHttp.get<PaginatedPrograms>('/admin/tv/programs', { params })
  return data
}

export async function adminGetProgram(id: number): Promise<AdminProgramDetail> {
  const { data } = await apiHttp.get<AdminProgramDetail>(`/admin/tv/programs/${id}`)
  return data
}

export async function adminUpdateProgram(
  id: number,
  payload: {
    title?: string
    type?: string | null
    description?: string | null
    image_url?: string | null
    youtube_url?: string | null
    is_tvstats_pick?: boolean
    category_ids?: number[]
  },
): Promise<AdminProgram> {
  const { data } = await apiHttp.patch<AdminProgram>(`/admin/tv/programs/${id}`, payload)
  return data
}

export async function adminDeleteProgram(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/programs/${id}`)
}

// ---- Broadcasts ----

export const BROADCAST_TYPES = [
  { value: 'inedit', label: 'Inédit' },
  { value: 'rediffusion', label: 'Rediffusion' },
  { value: 'direct', label: 'Direct' },
  { value: 'replay', label: 'Replay' },
  { value: 'exclusivite', label: 'Exclusivité' },
] as const

export type BroadcastType = (typeof BROADCAST_TYPES)[number]['value']

export type AdminBroadcast = {
  id: number
  tv_channel_id: string
  program_id: number
  start_at: string
  end_at: string
  season: number | null
  episode: number | null
  broadcast_type: BroadcastType | null
  program: { id: number; title: string; type: string | null } | null
  audience: {
    viewers: number | null
    pda: number | null
    rank: number | null
    mediametrie_viewers: number | null
  } | null
  created_at: string
}

export type PaginatedBroadcasts = {
  data: AdminBroadcast[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListBroadcasts(
  params: {
    page?: number
    search?: string
    channel?: string
    date?: string
    date_from?: string
    date_to?: string
  } = {},
): Promise<PaginatedBroadcasts> {
  const { data } = await apiHttp.get<PaginatedBroadcasts>('/admin/tv/broadcasts', { params })
  return data
}

export async function adminGetBroadcast(id: number): Promise<AdminBroadcast> {
  const { data } = await apiHttp.get<AdminBroadcast>(`/admin/tv/broadcasts/${id}`)
  return data
}

export async function adminUpdateBroadcast(
  id: number,
  payload: {
    season?: number | null
    episode?: number | null
    broadcast_type?: BroadcastType | null
  },
): Promise<AdminBroadcast> {
  const { data } = await apiHttp.patch<AdminBroadcast>(`/admin/tv/broadcasts/${id}`, payload)
  return data
}

export async function adminUpdateBroadcastAudience(
  id: number,
  payload: { pda?: number | null; rank?: number | null; mediametrie_viewers?: number | null },
): Promise<AdminBroadcast> {
  const { data } = await apiHttp.patch<AdminBroadcast>(
    `/admin/tv/broadcasts/${id}/audience`,
    payload,
  )
  return data
}

export async function adminDeleteBroadcast(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/broadcasts/${id}`)
}

// ---- Contact messages ----

export type ContactMessageReason = 'general' | 'partenariat' | 'presse' | 'commercial'
export type ContactMessageStatus = 'new' | 'in_progress' | 'resolved'

export type AdminContactMessage = {
  id: number
  reason: ContactMessageReason
  name: string
  email: string
  company: string | null
  message: string
  status: ContactMessageStatus
  created_at: string
  updated_at: string
}

export type PaginatedContactMessages = {
  data: AdminContactMessage[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function adminListContactMessages(
  params: { page?: number; search?: string; reason?: string; status?: string } = {},
): Promise<PaginatedContactMessages> {
  const { data } = await apiHttp.get<PaginatedContactMessages>('/admin/contact-messages', {
    params,
  })
  return data
}

export async function adminUpdateContactMessageStatus(
  id: number,
  status: ContactMessageStatus,
): Promise<AdminContactMessage> {
  const { data } = await apiHttp.patch<{ data: AdminContactMessage }>(
    `/admin/contact-messages/${id}`,
    { status },
  )
  return data.data
}

export async function adminDeleteContactMessage(id: number): Promise<void> {
  await apiHttp.delete(`/admin/contact-messages/${id}`)
}
