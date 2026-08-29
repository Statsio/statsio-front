import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchAccount } from '@/api/statsio-account'
import type { AccountSearchResults } from '@/types/account'

const EMPTY: AccountSearchResults = { favorites: [], history: [], contents: [] }

export function useAccountSearch() {
  const query = ref('')
  const results = ref<AccountSearchResults>({ ...EMPTY })
  const loading = ref(false)
  const open = ref(false)

  const run = useDebounceFn(async (q: string) => {
    if (q.trim().length < 2) {
      results.value = { ...EMPTY }
      loading.value = false
      return
    }
    loading.value = true
    try {
      results.value = await searchAccount(q.trim())
    } catch {
      results.value = { ...EMPTY }
    } finally {
      loading.value = false
    }
  }, 250)

  watch(query, (q) => {
    open.value = q.trim().length > 0
    loading.value = q.trim().length >= 2
    run(q)
  })

  function reset() {
    query.value = ''
    results.value = { ...EMPTY }
    open.value = false
  }

  return { query, results, loading, open, reset }
}
