import { apiHttp } from '@/lib/http'

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
  description: string | null
  logo: string | null
  banner: string | null
  logo_url: string | null
  banner_url: string | null
  categories: ChannelCategory[]
  tags: string[]
  country: string | null
  is_featured: boolean
  subscriber_count: number
  view_count: number
  custom_color_primary: string | null
  custom_color_secondary: string | null
  age_restriction: number
  created_at: string
  updated_at: string
}

export type Channel = {
  id: number
  status: string
  suspended_until: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
  profile: ChannelProfile
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
}

export async function getChannelCategories(): Promise<ChannelCategoryItem[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelCategoryItem[] }>('/channels/categories')
  return response.data.data
}

export async function getMyChannels(): Promise<Channel[]> {
  const response = await apiHttp.get<{ success: boolean; data: { data: Channel[] } }>('/channels/my')
  // Filtrer les chaînes sans profil (données corrompues)
  return response.data.data.data.filter((c) => c.profile !== null)
}

export async function getChannels(): Promise<Channel[]> {
  const response = await apiHttp.get<{ success: boolean; data: Channel[] }>('/channels')
  return response.data.data
}

export async function getChannel(id: number): Promise<Channel> {
  const response = await apiHttp.get<{ success: boolean; data: Channel }>(`/channels/${id}`)
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

export type ChannelMember = {
  id: number
  email: string
  name: string
  avatar: string | null
  role: string
  joined_at: string
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
  description?: string
  categories?: ChannelCategory[]
  logo?: File
  banner?: File
  custom_color_primary?: string
  custom_color_secondary?: string
  age_restriction?: number
  country?: string
  tags?: string[]
}

export async function updateChannelProfile(id: number, payload: UpdateChannelPayload): Promise<Channel> {
  const formData = new FormData()
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.handle !== undefined) formData.append('handle', payload.handle)
  if (payload.description !== undefined) formData.append('description', payload.description)
  if (payload.categories?.length) {
    payload.categories.forEach((c, i) => formData.append(`categories[${i}]`, c))
  }
  if (payload.logo) formData.append('logo', payload.logo)
  if (payload.banner) formData.append('banner', payload.banner)
  if (payload.custom_color_primary !== undefined) formData.append('custom_color_primary', payload.custom_color_primary)
  if (payload.custom_color_secondary !== undefined) formData.append('custom_color_secondary', payload.custom_color_secondary)
  if (payload.age_restriction !== undefined) formData.append('age_restriction', String(payload.age_restriction))
  if (payload.country !== undefined) formData.append('country', payload.country)
  if (payload.tags?.length) {
    payload.tags.forEach((t, i) => formData.append(`tags[${i}]`, t))
  }

  const response = await apiHttp.put<{ success: boolean; data: Channel; message: string }>(
    `/channels/${id}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data.data
}

export async function updateChannelMedia(id: number, payload: { logo?: File; banner?: File }): Promise<Channel> {
  const formData = new FormData()
  if (payload.logo) formData.append('logo', payload.logo)
  if (payload.banner) formData.append('banner', payload.banner)

  const response = await apiHttp.post<{ success: boolean; data: Channel }>(
    `/channels/${id}/media`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data.data
}

export async function getChannelMembers(id: number): Promise<ChannelMember[]> {
  const response = await apiHttp.get<{ success: boolean; data: ChannelMember[] }>(`/channels/${id}/members`)
  return response.data.data
}

export async function getChannelSubscribers(id: number, page = 1): Promise<{ data: ChannelSubscriber[]; total: number; last_page: number }> {
  const response = await apiHttp.get<{ success: boolean; data: { data: ChannelSubscriber[]; total: number; last_page: number } }>(`/channels/${id}/subscribers?page=${page}`)
  return response.data.data
}


export async function deleteChannel(id: number): Promise<void> {
  await apiHttp.delete(`/channels/${id}`)
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
