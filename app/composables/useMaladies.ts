import { computed, onMounted, ref, watch, readonly } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { fetchMaladiesPopulaires, fetchMaladiesSearch } from '@/api/maladies'
import type { MaladiePopulaire, MaladieSuggestion } from '@/types/maladies'

const SEARCH_DEBOUNCE_MS = 350
const MIN_QUERY_LENGTH = 2

export function useMaladies() {
  const query = ref('')
  const results = ref<MaladieSuggestion[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const popular = ref<MaladiePopulaire[]>([])
  const popularLoading = ref(true)

  async function loadPopular() {
    popularLoading.value = true
    try {
      popular.value = await fetchMaladiesPopulaires()
    } catch {
      popular.value = []
    } finally {
      popularLoading.value = false
    }
  }

  onMounted(loadPopular)

  const RANKING_LIMIT = 6

  /** Maladies suivies classées par nombre de cas/valeur brute (indicateur GHO), plus élevé d'abord. */
  const topByCases = computed(() =>
    popular.value
      .filter((m) => m.value !== null)
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, RANKING_LIMIT),
  )

  /** Maladies suivies réellement en hausse (évolution % > 0), la plus forte hausse d'abord. */
  const topByIncrease = computed(() =>
    popular.value
      .filter((m) => (m.evolutionPercent ?? 0) > 0)
      .sort((a, b) => (b.evolutionPercent as number) - (a.evolutionPercent as number))
      .slice(0, RANKING_LIMIT),
  )

  /** Maladies suivies réellement en baisse (évolution % < 0), la plus forte baisse d'abord — ne
   * contient jamais une maladie en hausse même si peu de maladies suivies sont en baisse. */
  const topByDecrease = computed(() =>
    popular.value
      .filter((m) => (m.evolutionPercent ?? 0) < 0)
      .sort((a, b) => (a.evolutionPercent as number) - (b.evolutionPercent as number))
      .slice(0, RANKING_LIMIT),
  )

  async function runSearch() {
    const term = query.value.trim()
    if (term.length < MIN_QUERY_LENGTH) {
      results.value = []
      isLoading.value = false
      return
    }

    isLoading.value = true
    error.value = null
    try {
      results.value = await fetchMaladiesSearch(term)
    } catch {
      error.value = 'Impossible de charger les maladies pour le moment.'
      results.value = []
    } finally {
      isLoading.value = false
    }
  }

  const debouncedSearch = useDebounceFn(runSearch, SEARCH_DEBOUNCE_MS)

  watch(query, () => {
    if (query.value.trim().length < MIN_QUERY_LENGTH) {
      results.value = []
      return
    }
    isLoading.value = true
    void debouncedSearch()
  })

  const hasQuery = computed(() => query.value.trim().length > 0)
  const suggestionsEmpty = computed(
    () => hasQuery.value && !isLoading.value && results.value.length === 0,
  )

  return {
    query,
    results: readonly(results),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasQuery,
    suggestionsEmpty,
    popular: readonly(popular),
    popularLoading: readonly(popularLoading),
    topByCases,
    topByIncrease,
    topByDecrease,
  }
}
