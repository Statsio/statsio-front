import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

export type ChannelDetail = {
  slug: string
  displayName: string
  number: number
  logoUrl: string | null
  description: string | null
  avgScore: number | null
  weekProgramCount: number
  followersCount: number
  isFollowing: boolean
}

export type PopularProgramme = {
  broadcastId: number
  programId: number
  title: string
  category: string | null
  categoryColor: string | null
  imageUrl: string | null
  score: number
  rating: number | null
}

export type ToggleFollowResponse = {
  isFollowing: boolean
  followersCount: number
}

export async function fetchChannelDetail(slug: string): Promise<ChannelDetail> {
  const { data } = await apiHttp.get<ChannelDetail>(STATSIO_API.tv.channelDetail(slug))
  return data
}

export async function fetchChannelPopularProgrammes(slug: string): Promise<PopularProgramme[]> {
  const { data } = await apiHttp.get<PopularProgramme[]>(STATSIO_API.tv.channelPopular(slug))
  return data
}

export async function toggleChannelFollow(slug: string): Promise<ToggleFollowResponse> {
  const { data } = await apiHttp.post<ToggleFollowResponse>(STATSIO_API.tv.channelFollow(slug))
  return data
}
