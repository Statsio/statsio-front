import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'

/** Préfixe (`''`, `/tvstats`, `/medistats`) à appliquer aux liens articles/statsdata/sondages, dérivé de la marque courante. */
export function useContentBasePath() {
  const route = useRoute()
  return computed(() => getBrandFromPath(route.path).contentBasePath)
}
