import { computed } from 'vue'
import { EMPTY_OFFERS, fetchOffers } from '@/api/offers'

/** Offres Freemium / Premium + tableau comparatif de la page publique /offres. */
export function useOffers() {
  const { data, pending, error, refresh } = useAsyncData('offers', fetchOffers, {
    default: () => EMPTY_OFFERS,
  })

  const offers = computed(() => data.value?.offers ?? [])
  const comparisonRows = computed(() => data.value?.comparisonRows ?? [])

  return { offers, comparisonRows, pending, error, refresh }
}
