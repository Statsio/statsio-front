import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { SoinsIndicatorKey, SoinsListResponse } from '@/types/soins'

export async function fetchSoinsList(indicator?: SoinsIndicatorKey): Promise<SoinsListResponse> {
  const { data } = await publicHttp.get<SoinsListResponse>(STATSIO_API.soins.list(indicator))
  return data
}
