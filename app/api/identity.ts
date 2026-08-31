import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'

/** État de la vérification d'identité Didit du compte connecté. */
export interface IdentityStatus {
  /** Libellé Didit brut (« Approved », « In Review », …) ou null si jamais démarrée. */
  status: string | null
  verified: boolean
  verified_at: string | null
}

export interface IdentityStartResult {
  /** URL hébergée par Didit vers laquelle rediriger, ou null si déjà vérifié. */
  url: string | null
  status: string
  verified: boolean
}

/**
 * Démarre (ou reprend) une session Didit. `returnPath` doit être un chemin
 * relatif interne (ex. `/sondages/mon-sondage`) — l'utilisateur y revient après
 * la vérification.
 */
export async function startIdentityVerification(returnPath?: string): Promise<IdentityStartResult> {
  const { data } = await apiHttp.post(STATSIO_API.identity.verificationStart, {
    return_path: returnPath ?? null,
  })
  return data.data as IdentityStartResult
}

export async function fetchIdentityStatus(): Promise<IdentityStatus> {
  const { data } = await apiHttp.get(STATSIO_API.identity.verificationStatus)
  return data.data as IdentityStatus
}
