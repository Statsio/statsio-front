import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { AudienceApiResponse } from '@/types/tv-audiences'

export async function fetchTvAudiences(): Promise<AudienceApiResponse> {
  const { data } = await apiHttp.get<AudienceApiResponse>(STATSIO_API.tv.audiences)
  return data
}
