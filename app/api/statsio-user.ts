import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import type { ProfileLookupOption } from '@/types/auth'

export interface ProfileReferenceData {
  genders: ProfileLookupOption[]
  age_ranges: ProfileLookupOption[]
  socio_professional_categories: ProfileLookupOption[]
  marital_statuses: ProfileLookupOption[]
}

export interface UpdateProfilePayload {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  birthday?: string | null
  birth_year?: number | null
  country?: string | null
  region?: string | null
  city?: string | null
  zip_code?: string | null
  gender_id?: number | null
  age_range_id?: number | null
  socio_professional_category_id?: number | null
  education_level_id?: number | null
  employment_status_id?: number | null
  marital_status_id?: number | null
}

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

/** `PATCH /me` — met à jour le profil de l'utilisateur connecté. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<unknown> {
  const res = await apiHttp.patch(STATSIO_API.me, payload)
  return unwrapStatsioResponseData(res)
}

/** `GET /reference-data/profile` — listes de référence pour le formulaire "compléter mon profil". */
export async function fetchProfileReferenceData(): Promise<ProfileReferenceData> {
  const res = await apiHttp.get(STATSIO_API.referenceData.profile)
  return unwrapStatsioResponseData<ProfileReferenceData>(res)
}

/** `POST /account/anonymize` — anonymise et supprime définitivement le compte de l'utilisateur connecté. */
export async function anonymizeAccount(): Promise<unknown> {
  const res = await apiHttp.post(STATSIO_API.account.anonymize)
  return unwrapStatsioResponseData(res)
}
