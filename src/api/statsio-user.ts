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

/** `PATCH /me` — update profile (first_name, last_name). */
export async function updateProfile(payload: { first_name?: string; last_name?: string }): Promise<unknown> {
  const res = await apiHttp.patch(STATSIO_API.me, payload)
  return unwrapStatsioResponseData(res)
}
