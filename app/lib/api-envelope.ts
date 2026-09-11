import type { HttpResponse } from '@/lib/http'

/**
 * Déballage des réponses Laravel / Statsio alignées sur la collection Postman :
 * corps JSON `{ success?: boolean, data: T }` (placé dans `response.data`).
 */
export function unwrapStatsioResponseData<T>(response: Pick<HttpResponse<unknown>, 'data'>): T {
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
