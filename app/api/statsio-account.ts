import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import type { AuthUser } from '@/types/auth'
import type {
  AccountFavorite,
  AccountHistoryGroup,
  AccountInProgressItem,
  AccountSearchResults,
  AccountSubscription,
} from '@/types/account'

/* ───────── Avatar ───────── */

/** `POST /me/avatar` (multipart) — met à jour la photo de profil, renvoie le user rafraîchi. */
export async function uploadAvatar(file: File): Promise<{ avatar: string; user: AuthUser }> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiHttp.post(STATSIO_API.account.avatar, form)
  return unwrapStatsioResponseData<{ avatar: string; user: AuthUser }>(res)
}

/** `POST /me/avatar` — met à jour la photo de profil à partir d'une image de la bibliothèque de médias. */
export async function updateAvatarFromMedia(mediaId: number): Promise<{ avatar: string; user: AuthUser }> {
  const res = await apiHttp.post(STATSIO_API.account.avatar, { media_id: mediaId })
  return unwrapStatsioResponseData<{ avatar: string; user: AuthUser }>(res)
}

/** `DELETE /me/avatar` — retire la photo de profil. */
export async function deleteAvatar(): Promise<{ user: AuthUser }> {
  const res = await apiHttp.delete(STATSIO_API.account.avatar)
  return unwrapStatsioResponseData<{ user: AuthUser }>(res)
}

/* ───────── Favoris ───────── */

export async function fetchFavorites(): Promise<AccountFavorite[]> {
  const res = await apiHttp.get(STATSIO_API.account.favorites)
  return unwrapStatsioResponseData<AccountFavorite[]>(res)
}

/** Bascule un contenu dans/hors des favoris. Renvoie l'état résultant. */
export async function toggleFavorite(contentId: string | number): Promise<boolean> {
  const res = await apiHttp.post(STATSIO_API.account.favorites, { type: 'content', id: contentId })
  return unwrapStatsioResponseData<{ favorited: boolean }>(res).favorited
}

export async function removeFavorite(contentId: string | number): Promise<void> {
  await apiHttp.delete(STATSIO_API.account.favorite(contentId))
}

/* ───────── Historique ───────── */

export async function fetchHistory(): Promise<AccountHistoryGroup[]> {
  const res = await apiHttp.get(STATSIO_API.account.history)
  return unwrapStatsioResponseData<{ groups: AccountHistoryGroup[] }>(res).groups
}

export async function fetchInProgress(): Promise<AccountInProgressItem[]> {
  const res = await apiHttp.get(STATSIO_API.account.historyInProgress)
  return unwrapStatsioResponseData<AccountInProgressItem[]>(res)
}

/** Enregistre la consultation d'un contenu (appelé depuis les pages publiques). */
export async function recordContentView(slug: string, progress?: number): Promise<void> {
  await apiHttp.post(STATSIO_API.account.history, progress !== undefined ? { slug, progress } : { slug })
}

export async function clearHistory(): Promise<void> {
  await apiHttp.delete(STATSIO_API.account.history)
}

/* ───────── Abonnements ───────── */

export async function fetchSubscriptions(): Promise<AccountSubscription[]> {
  const res = await apiHttp.get(STATSIO_API.account.subscriptions)
  return unwrapStatsioResponseData<AccountSubscription[]>(res)
}

/* ───────── Recherche ───────── */

export async function searchAccount(q: string): Promise<AccountSearchResults> {
  const res = await apiHttp.get(STATSIO_API.account.search, { params: { q } })
  return unwrapStatsioResponseData<AccountSearchResults>(res)
}
