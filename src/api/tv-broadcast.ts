import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

export type BroadcastDetail = {
  id: number
  channelId: string
  startAt: string
  endAt: string
  startTime: string
  endTime: string
  date: string
  durationMin: number
  program: {
    id: number
    title: string
    type: string | null
    description: string | null
  }
  audience: {
    viewers: number
    willWatch: number
    pda: number | null
    rank: number | null
  }
  userViewType: 'watched' | 'will_watch' | null
}

export type ToggleViewResponse = {
  userViewType: 'watched' | 'will_watch' | null
  viewers: number
  willWatch: number
}

export async function fetchBroadcast(id: number): Promise<BroadcastDetail> {
  const { data } = await apiHttp.get<BroadcastDetail>(STATSIO_API.tv.broadcast(id))
  return data
}

export async function toggleBroadcastView(
  id: number,
  type: 'watched' | 'will_watch',
): Promise<ToggleViewResponse> {
  const { data } = await apiHttp.post<ToggleViewResponse>(STATSIO_API.tv.broadcastView(id), {
    type,
  })
  return data
}
