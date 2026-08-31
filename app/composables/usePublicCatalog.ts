import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import type { CatalogContentType, CatalogItem, CatalogQuery, CatalogResponse, CatalogSort, CatalogView } from '@/types/catalog'

const EMPTY: CatalogResponse = {
  data: [],
  meta: { total: 0, shown: 0, per_page: 9, has_more: false },
  facets: { categories: [], formats: [] },
  stats: { published: 0, channels: 0, charts: 0, last_published_at: null },
  featured: null,
}

export function usePublicCatalog(options: {
  type: CatalogContentType
  brandCategories?: string[]
  key: string
}) {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const qInput = ref(String(route.query.q ?? ''))
  const q = refDebounced(qInput, 280)
  const category = ref(String(route.query.cat ?? ''))
  const format = ref(String(route.query.format ?? ''))
  const sort = ref<CatalogSort>(parseSort(route.query.sort))
  const view = ref<CatalogView>(route.query.view === 'list' ? 'list' : 'grid')
  const hasData = ref(route.query.data === '1')
  const perPage = ref(9)
  const favOverrides = ref<Record<string, boolean>>({})

  watch([q, category, format, hasData, sort], () => {
    perPage.value = 9
  })

  const queryParams = computed<CatalogQuery>(() => ({
    type: options.type,
    q: q.value.trim() || undefined,
    category: category.value || undefined,
    format: format.value || undefined,
    sort: sort.value,
    has_data: hasData.value || undefined,
    per_page: perPage.value,
    categories: options.brandCategories,
  }))

  const { data, pending, error, refresh } = useAsyncData(
    options.key,
    () => fetchPublicCatalog(queryParams.value),
    { watch: [queryParams] },
  )

  const catalog = computed(() => data.value ?? EMPTY)
  const anyFilter = computed(
    () => Boolean(q.value.trim() || category.value || format.value || hasData.value),
  )

  if (import.meta.client) {
    watch(
      [qInput, category, format, sort, view, hasData],
      () => {
        const next: Record<string, string> = {}
        if (qInput.value.trim()) next.q = qInput.value.trim()
        if (category.value) next.cat = category.value
        if (format.value) next.format = format.value
        if (sort.value !== 'trend') next.sort = sort.value
        if (view.value !== 'grid') next.view = view.value
        if (hasData.value) next.data = '1'
        void router.replace({ query: next })
      },
      { flush: 'post' },
    )
  }

  function resetFilters() {
    qInput.value = ''
    category.value = ''
    format.value = ''
    hasData.value = false
    perPage.value = 9
  }

  function loadMore() {
    perPage.value += 6
  }

  function selectCategory(value: string) {
    category.value = value
    perPage.value = 9
  }

  function selectFormat(value: string) {
    format.value = value
    perPage.value = 9
  }

  async function toggleItemFavorite(item: CatalogItem) {
    if (!auth.isAuthenticated) {
      await navigateTo('/login')
      return
    }
    const next = await toggleFavorite(item.id)
    favOverrides.value = { ...favOverrides.value, [item.id]: next }
  }

  function isFavorited(item: CatalogItem) {
    return favOverrides.value[item.id] ?? item.is_favorited
  }

  return {
    qInput,
    q,
    category,
    format,
    sort,
    view,
    hasData,
    perPage,
    pending,
    error,
    catalog,
    anyFilter,
    resetFilters,
    loadMore,
    selectCategory,
    selectFormat,
    toggleItemFavorite,
    isFavorited,
    refresh,
  }
}

function parseSort(raw: unknown): CatalogSort {
  return raw === 'recent' || raw === 'views' || raw === 'trend' ? raw : 'trend'
}
