import { computed, onMounted, ref, watch, readonly } from 'vue'
import { fetchSoinsList } from '@/api/soins'
import type { ActiveSoinsIndicator, SoinsCountryPoint, SoinsIndicatorKey, SoinsIndicatorOption } from '@/types/soins'

export function useSoins() {
  const indicator = ref<SoinsIndicatorKey>('physicians')
  const countryQuery = ref('')

  const activeIndicator = ref<ActiveSoinsIndicator | null>(null)
  const options = ref<SoinsIndicatorOption[]>([])
  const countries = ref<SoinsCountryPoint[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchSoinsList(indicator.value)
      activeIndicator.value = data.indicator
      options.value = data.options
      countries.value = data.countries
    } catch {
      error.value = 'Impossible de charger les données soins pour le moment.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(load)
  watch(indicator, load)

  const filteredCountries = computed(() => {
    const q = countryQuery.value.trim().toLowerCase()
    const base = q
      ? countries.value.filter((c) => c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q))
      : countries.value
    return [...base].sort((a, b) => b.population - a.population)
  })

  const countriesEmpty = computed(
    () => countryQuery.value.trim().length > 0 && !isLoading.value && filteredCountries.value.length === 0,
  )

  return {
    indicator,
    countryQuery,
    activeIndicator: readonly(activeIndicator),
    options: readonly(options),
    countries: readonly(countries),
    filteredCountries,
    countriesEmpty,
    isLoading: readonly(isLoading),
    error: readonly(error),
  }
}
