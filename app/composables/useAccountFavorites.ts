import { computed, ref } from 'vue'
import { fetchFavorites, removeFavorite, toggleFavorite } from '@/api/statsio-account'
import { toDisplayAccountContent } from '@/lib/account-content'
import { useAuthStore } from '@/stores/auth'
import type { AccountFavorite } from '@/types/account'

export function useAccountFavorites() {
  const auth = useAuthStore()
  const favorites = ref<AccountFavorite[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const items = computed(() =>
    favorites.value.map((f) => ({ ...toDisplayAccountContent(f), favoritedAt: f.favorited_at })),
  )
  const isEmpty = computed(() => !loading.value && favorites.value.length === 0)

  async function load() {
    loading.value = true
    error.value = null
    try {
      favorites.value = await fetchFavorites()
    } catch {
      error.value = 'Impossible de charger vos favoris.'
    } finally {
      loading.value = false
    }
  }

  /** Retrait optimiste depuis la liste (bouton cœur). */
  async function remove(id: string) {
    const previous = favorites.value
    favorites.value = favorites.value.filter((f) => f.id !== id)
    if (auth.user?.counts) auth.user.counts.favorites = Math.max(0, auth.user.counts.favorites - 1)
    try {
      await removeFavorite(id)
    } catch {
      favorites.value = previous
      if (auth.user?.counts) auth.user.counts.favorites += 1
      error.value = 'La suppression a échoué.'
    }
  }

  return { items, loading, error, isEmpty, load, remove, toggle: toggleFavorite }
}
