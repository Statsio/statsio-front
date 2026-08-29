import { computed, ref } from 'vue'
import { clearHistory, fetchHistory } from '@/api/statsio-account'
import { toDisplayAccountContent } from '@/lib/account-content'
import type { AccountHistoryGroup } from '@/types/account'

export function useAccountHistory() {
  const groups = ref<AccountHistoryGroup[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const displayGroups = computed(() =>
    groups.value.map((g) => ({
      key: g.key,
      label: g.label,
      items: g.items.map((it) => ({
        ...toDisplayAccountContent(it),
        viewedAt: it.viewed_at,
        progress: it.progress,
      })),
    })),
  )
  const isEmpty = computed(() => !loading.value && groups.value.length === 0)

  async function load() {
    loading.value = true
    error.value = null
    try {
      groups.value = await fetchHistory()
    } catch {
      error.value = "Impossible de charger l'historique."
    } finally {
      loading.value = false
    }
  }

  async function clear() {
    const previous = groups.value
    groups.value = []
    try {
      await clearHistory()
    } catch {
      groups.value = previous
      error.value = "L'effacement a échoué."
    }
  }

  return { groups: displayGroups, loading, error, isEmpty, load, clear }
}
