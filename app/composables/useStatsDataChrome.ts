import { computed, ref, watch, type Ref } from 'vue'
import { navigateTo } from '#app'
import { toggleFavorite } from '@/api/statsio-account'
import { toggleChannelSubscription } from '@/api/channels'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import type { StatsDataDocument } from '@/api/studio'

/**
 * Actions du bandeau d'une page StatsData publique : favori, suivi de la chaîne
 * éditrice, partage (Web Share / réseaux) et extrait d'intégration `<iframe>`.
 * Les mutations sont optimistes ; un visiteur non connecté est renvoyé au login
 * avec retour sur la page courante.
 */
export function useStatsDataChrome(doc: Ref<StatsDataDocument | null>) {
  const auth = useAuthStore()

  const isFavorite = ref(false)
  const isFollowing = ref(false)
  const favoritePending = ref(false)
  const followPending = ref(false)

  watch(doc, (d) => {
    isFavorite.value = d?.is_favorited ?? false
    isFollowing.value = d?.channel?.is_following ?? false
  }, { immediate: true })

  const channelId = computed(() => doc.value?.channel?.id ?? null)
  const canFollowChannel = computed(() => doc.value?.published_as === 'channel' && channelId.value != null)

  function requireAuth(): boolean {
    if (auth.isAuthenticated) return true
    if (import.meta.client) {
      try { sessionStorage.setItem(AUTH_REDIRECT_KEY, window.location.pathname + window.location.search) } catch { /* ignore */ }
      try { localStorage.setItem(AUTH_REDIRECT_KEY, window.location.pathname + window.location.search) } catch { /* ignore */ }
    }
    void navigateTo('/login')
    return false
  }

  async function toggleFavoriteAction() {
    const slugOrId = doc.value?.slug ?? doc.value?.id
    if (!slugOrId || favoritePending.value || !requireAuth()) return
    const previous = isFavorite.value
    isFavorite.value = !previous
    favoritePending.value = true
    try {
      isFavorite.value = await toggleFavorite(slugOrId)
      if (auth.user?.counts) {
        auth.user.counts.favorites = Math.max(0, auth.user.counts.favorites + (isFavorite.value ? 1 : -1))
      }
    } catch {
      isFavorite.value = previous
    } finally {
      favoritePending.value = false
    }
  }

  async function toggleFollowAction() {
    if (!channelId.value || followPending.value || !requireAuth()) return
    const previous = isFollowing.value
    isFollowing.value = !previous
    followPending.value = true
    try {
      const res = await toggleChannelSubscription(channelId.value)
      isFollowing.value = res.isFollowing
    } catch {
      isFollowing.value = previous
    } finally {
      followPending.value = false
    }
  }

  const shareUrl = computed(() =>
    import.meta.client
      ? window.location.origin + window.location.pathname
      : `/statsdata/${doc.value?.slug ?? ''}`,
  )
  const embedUrl = computed(() =>
    (import.meta.client ? window.location.origin : '') + `/embed/statsdata/${doc.value?.slug ?? ''}`,
  )
  const embedSnippet = computed(
    () => `<iframe src="${embedUrl.value}" width="100%" height="640" style="border:1px solid #e5e5e5;border-radius:12px" loading="lazy" title="${(doc.value?.title ?? 'StatsData').replace(/"/g, '&quot;')}"></iframe>`,
  )

  const canWebShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && 'share' in navigator)

  async function nativeShare(): Promise<boolean> {
    if (!canWebShare.value) return false
    try {
      await navigator.share({ title: doc.value?.title ?? 'StatsData', url: shareUrl.value })
      return true
    } catch {
      return false
    }
  }

  const shareTargets = computed(() => {
    const u = encodeURIComponent(shareUrl.value)
    const t = encodeURIComponent(doc.value?.title ?? 'StatsData')
    return [
      { key: 'x', label: 'X / Twitter', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
      { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
      { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
      { key: 'email', label: 'E-mail', href: `mailto:?subject=${t}&body=${u}` },
    ]
  })

  return {
    isFavorite,
    isFollowing,
    favoritePending,
    followPending,
    canFollowChannel,
    toggleFavoriteAction,
    toggleFollowAction,
    shareUrl,
    embedUrl,
    embedSnippet,
    canWebShare,
    nativeShare,
    shareTargets,
  }
}
