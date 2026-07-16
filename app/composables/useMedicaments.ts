import { computed, readonly, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { fetchMedicamentsSearch } from '@/api/medicaments'
import type { Medicament } from '@/types/medicaments'

const SEARCH_DEBOUNCE_MS = 350
const MIN_QUERY_LENGTH = 2

/** Médicaments courants proposés avant toute recherche — de vraies recherches déclenchées au clic. */
export const POPULAR_MEDICAMENTS = [
  'Doliprane',
  'Amoxicilline',
  'Levothyrox',
  'Ventoline',
  'Ibuprofène',
  'Kardégic',
  'Augmentin',
  'Spasfon',
  'Xanax',
]

export function useMedicaments() {
  const query = ref('')
  const results = ref<Medicament[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
      results.value = await fetchMedicamentsSearch(term)
    } catch {
      error.value = 'Impossible de charger les médicaments pour le moment.'
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

  function searchPopular(name: string) {
    query.value = name
  }

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
    searchPopular,
  }
}
