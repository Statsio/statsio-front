import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { fetchDossierCatalog } from '@/api/dossiers'
import type { DossierCatalogResponse, DossierCatalogSort } from '@/types/dossier'

const EMPTY: DossierCatalogResponse = {
  data: [],
  featured: null,
  meta: { total: 0, shown: 0, per_page: 12, has_more: false },
  facets: { categories: [] },
  stats: { dossiers: 0, contents: 0, categories: 0, last_updated_at: null },
}

function parseSort(raw: unknown): DossierCatalogSort {
  return raw === 'count' || raw === 'az' ? raw : 'maj'
}

/**
 * État de la page listing /dossiers : recherche, facette catégorie, tri.
 * Le backend gère filtrage / tri / pagination (peu de dossiers), le composable
 * synchronise l'état avec l'URL comme les autres catalogues.
 */
export function useDossiersCatalog() {
  const route = useRoute()
  const router = useRouter()

  const qInput = ref(String(route.query.q ?? ''))
  const q = refDebounced(qInput, 280)
  const category = ref(String(route.query.cat ?? ''))
  const sort = ref<DossierCatalogSort>(parseSort(route.query.sort))
  const perPage = ref(12)

  watch([q, category, sort], () => {
    perPage.value = 12
  })

  const queryParams = computed(() => ({
    q: q.value.trim() || undefined,
    category: category.value || undefined,
    sort: sort.value,
    per_page: perPage.value,
  }))

  const { data, pending, error, refresh } = useAsyncData(
    'dossiers-catalog',
    () => fetchDossierCatalog(queryParams.value),
    { watch: [queryParams] },
  )

  const catalog = computed(() => data.value ?? EMPTY)
  const anyFilter = computed(() => Boolean(q.value.trim() || category.value))

  if (import.meta.client) {
    watch(
      [qInput, category, sort],
      () => {
        const next: Record<string, string> = {}
        if (qInput.value.trim()) next.q = qInput.value.trim()
        if (category.value) next.cat = category.value
        if (sort.value !== 'maj') next.sort = sort.value
        void router.replace({ query: next })
      },
      { flush: 'post' },
    )
  }

  function resetFilters() {
    qInput.value = ''
    category.value = ''
    sort.value = 'maj'
    perPage.value = 12
  }

  function selectCategory(value: string) {
    category.value = value
    perPage.value = 12
  }

  function loadMore() {
    perPage.value += 12
  }

  return {
    qInput,
    category,
    sort,
    perPage,
    pending,
    error,
    catalog,
    anyFilter,
    resetFilters,
    selectCategory,
    loadMore,
    refresh,
  }
}
