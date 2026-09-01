import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { fetchGlobalSearch } from '@/api/studio'
import type { GlobalSearchGroup, GlobalSearchResponse } from '@/types/search'

const RECENT_KEY = 'statsio:search:recent'
const RECENT_MAX = 5
const MIN_CHARS = 2

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

/**
 * État de la recherche globale : requête débattue, résultats groupés, historique
 * local. Utilisé par la modale de recherche du header.
 */
export function useGlobalSearch() {
  const query = ref('')
  const results = ref<GlobalSearchResponse>({ query: '', total: 0, groups: [] })
  const loading = ref(false)
  const error = ref(false)
  const recent = ref<string[]>(readRecent())

  // Garde anti-course : seule la dernière requête lancée peut écrire le résultat.
  let latest = 0

  const run = useDebounceFn(async (q: string) => {
    const token = ++latest
    loading.value = true
    error.value = false
    try {
      const res = await fetchGlobalSearch(q)
      if (token === latest) results.value = res
    } catch {
      if (token === latest) {
        results.value = { query: q, total: 0, groups: [] }
        error.value = true
      }
    } finally {
      if (token === latest) loading.value = false
    }
  }, 240)

  watch(query, (q) => {
    const trimmed = q.trim()
    if (trimmed.length < MIN_CHARS) {
      latest++
      results.value = { query: trimmed, total: 0, groups: [] }
      loading.value = false
      error.value = false
      return
    }
    loading.value = true
    run(trimmed)
  })

  const nonEmptyGroups = computed<GlobalSearchGroup[]>(() =>
    results.value.groups.filter((g) => g.items.length > 0),
  )

  const hasResults = computed(() => nonEmptyGroups.value.length > 0)
  const canSearch = computed(() => query.value.trim().length >= MIN_CHARS)

  function rememberQuery(q: string) {
    const trimmed = q.trim()
    if (trimmed.length < MIN_CHARS) return
    const next = [trimmed, ...recent.value.filter((v) => v.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_MAX)
    recent.value = next
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // stockage indisponible (mode privé) — on ignore
      }
    }
  }

  function clearRecent() {
    recent.value = []
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(RECENT_KEY)
      } catch {
        // ignore
      }
    }
  }

  function reset() {
    query.value = ''
    latest++
    results.value = { query: '', total: 0, groups: [] }
    loading.value = false
    error.value = false
  }

  return {
    query,
    results,
    nonEmptyGroups,
    hasResults,
    canSearch,
    loading,
    error,
    recent,
    rememberQuery,
    clearRecent,
    reset,
  }
}
