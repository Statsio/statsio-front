import { computed, onMounted, ref, watch, readonly } from 'vue'
import { fetchPaysList } from '@/api/pays'
import type { ActiveIndicator, CountryMapPoint, IndicatorKey, IndicatorOption } from '@/types/pays'

export function usePays() {
  const indicator = ref<IndicatorKey>('lifeExp')
  const countryQuery = ref('')

  const activeIndicator = ref<ActiveIndicator | null>(null)
  const options = ref<IndicatorOption[]>([])
  const countries = ref<CountryMapPoint[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchPaysList(indicator.value)
      activeIndicator.value = data.indicator
      options.value = data.options
      countries.value = data.countries
    } catch {
      error.value = 'Impossible de charger les données pays pour le moment.'
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
