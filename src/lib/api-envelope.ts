import type { AxiosResponse } from 'axios'

/**
 * Déballage des réponses Laravel / Statsio alignées sur la collection Postman :
 * corps JSON `{ success?: boolean, data: T }` (axios place ce corps dans `response.data`).
 */
export function unwrapStatsioResponseData<T>(response: AxiosResponse<unknown>): T {
  const body = response.data
  if (typeof body !== 'object' || body === null) {
    throw new Error('Réponse API invalide')
  }
  const record = body as Record<string, unknown>
  if (!('data' in record)) {
    throw new Error('Réponse API sans champ data')
  }
  return record.data as T
}
