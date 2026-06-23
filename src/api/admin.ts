import { apiHttp } from '@/lib/http'

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

export async function adminListUsers(params: { page?: number; search?: string; status?: string } = {}): Promise<PaginatedUsers> {
  const { data } = await apiHttp.get<PaginatedUsers>('/admin/users', { params })
  return data
}

export async function adminUpdateUser(id: number, payload: { is_admin?: boolean; status?: string }): Promise<AdminUser> {
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

export async function adminListChannels(params: { page?: number; search?: string; active?: string } = {}): Promise<PaginatedChannels> {
  const { data } = await apiHttp.get<PaginatedChannels>('/admin/tv/channels', { params })
  return data
}

export async function adminGetChannel(id: number): Promise<AdminChannel> {
  const { data } = await apiHttp.get<AdminChannel>(`/admin/tv/channels/${id}`)
  return data
}

export async function adminCreateChannel(payload: Omit<AdminChannel, 'id' | 'broadcasts_count' | 'created_at' | 'updated_at'>): Promise<AdminChannel> {
  const { data } = await apiHttp.post<AdminChannel>('/admin/tv/channels', payload)
  return data
}

export async function adminUpdateChannel(id: number, payload: Partial<AdminChannel>): Promise<AdminChannel> {
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

export async function adminCreateCategory(payload: { name: string; color?: string | null }): Promise<AdminCategory> {
  const { data } = await apiHttp.post<AdminCategory>('/admin/tv/categories', payload)
  return data
}

export async function adminUpdateCategory(id: number, payload: { name?: string; color?: string | null }): Promise<AdminCategory> {
  const { data } = await apiHttp.patch<AdminCategory>(`/admin/tv/categories/${id}`, payload)
  return data
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/categories/${id}`)
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

export async function adminListPrograms(params: { page?: number; search?: string; channel?: string; type?: string } = {}): Promise<PaginatedPrograms> {
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
  { value: 'inedit',      label: 'Inédit' },
  { value: 'rediffusion', label: 'Rediffusion' },
  { value: 'direct',      label: 'Direct' },
  { value: 'replay',      label: 'Replay' },
  { value: 'exclusivite', label: 'Exclusivité' },
] as const

export type BroadcastType = typeof BROADCAST_TYPES[number]['value']

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

export async function adminListBroadcasts(params: { page?: number; search?: string; channel?: string; date?: string; date_from?: string; date_to?: string } = {}): Promise<PaginatedBroadcasts> {
  const { data } = await apiHttp.get<PaginatedBroadcasts>('/admin/tv/broadcasts', { params })
  return data
}

export async function adminGetBroadcast(id: number): Promise<AdminBroadcast> {
  const { data } = await apiHttp.get<AdminBroadcast>(`/admin/tv/broadcasts/${id}`)
  return data
}

export async function adminUpdateBroadcast(
  id: number,
  payload: { season?: number | null; episode?: number | null; broadcast_type?: BroadcastType | null },
): Promise<AdminBroadcast> {
  const { data } = await apiHttp.patch<AdminBroadcast>(`/admin/tv/broadcasts/${id}`, payload)
  return data
}

export async function adminUpdateBroadcastAudience(
  id: number,
  payload: { pda?: number | null; rank?: number | null; mediametrie_viewers?: number | null },
): Promise<AdminBroadcast> {
  const { data } = await apiHttp.patch<AdminBroadcast>(`/admin/tv/broadcasts/${id}/audience`, payload)
  return data
}

export async function adminDeleteBroadcast(id: number): Promise<void> {
  await apiHttp.delete(`/admin/tv/broadcasts/${id}`)
}
