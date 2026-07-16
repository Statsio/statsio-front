import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { IndicatorKey, PaysDetail, PaysListResponse } from '@/types/pays'

export async function fetchPaysList(indicator?: IndicatorKey): Promise<PaysListResponse> {
  const { data } = await publicHttp.get<PaysListResponse>(STATSIO_API.pays.list(indicator))
  return data
}

export async function fetchPaysDetail(iso3: string): Promise<PaysDetail> {
  const { data } = await publicHttp.get<PaysDetail>(STATSIO_API.pays.one(iso3))
  return data
}
