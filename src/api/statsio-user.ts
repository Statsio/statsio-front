import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'

/** Postman « Auth → Auth Me » : `GET {{base_url}}/api/auth/me`. */
export async function fetchStatsioAuthMe(): Promise<unknown> {
  const res = await apiHttp.get(STATSIO_API.auth.me)
  return unwrapStatsioResponseData(res)
}

/** Postman « User → Me » : `GET {{base_url}}/api/me`. */
export async function fetchStatsioMe(): Promise<unknown> {
  const res = await apiHttp.get(STATSIO_API.me)
  return unwrapStatsioResponseData(res)
}
