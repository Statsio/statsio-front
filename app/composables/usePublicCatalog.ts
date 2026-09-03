import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { fetchPublicCatalog } from '@/api/studio'
import { toggleFavorite } from '@/api/statsio-account'
import { useAuthStore } from '@/stores/auth'
import { useRespondentToken } from '@/composables/useRespondentToken'
import type {
  CatalogContentType,
  CatalogItem,
  CatalogQuery,
  CatalogResponse,
  CatalogSort,
  CatalogView,
  SurveyKind,
  SurveyStatusFilter,
} from '@/types/catalog'

const EMPTY: CatalogResponse = {
  data: [],
  meta: { total: 0, shown: 0, per_page: 9, has_more: false },
  facets: { categories: [], formats: [], survey_kinds: [] },
  stats: { published: 0, channels: 0, charts: 0, last_published_at: null },
  featured: null,
}

export function usePublicCatalog(options: {
  type: CatalogContentType
  brandCategories?: string[]
  /** Cadre le listing sur une sous-marque (pages TVStats / Medistats). Prioritaire sur `brandCategories`. */
  brandSubBrand?: import('@/types/sub-brand').SubBrand
  key: string
}) {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  // Sondages uniquement : jeton anonyme pour le filtre « Pas encore participé ».
  const respondentToken = options.type === 'survey' ? useRespondentToken() : ref('')

  const qInput = ref(String(route.query.q ?? ''))
  const q = refDebounced(qInput, 280)
  const category = ref(String(route.query.cat ?? ''))
  const format = ref(String(route.query.format ?? ''))
  const sort = ref<CatalogSort>(parseSort(route.query.sort))
  const view = ref<CatalogView>(route.query.view === 'list' ? 'list' : 'grid')
  const hasData = ref(route.query.data === '1')
  const surveyKind = ref<SurveyKind | ''>(parseSurveyKind(route.query.kind))
  const surveyStatus = ref<SurveyStatusFilter | ''>(parseSurveyStatus(route.query.statut))
  const notParticipated = ref(route.query.np === '1')
  const perPage = ref(9)
  const favOverrides = ref<Record<string, boolean>>({})

  watch([q, category, format, hasData, sort, surveyKind, surveyStatus, notParticipated], () => {
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
    // Sur une page de sous-marque, on filtre par domaine explicite plutôt que par
    // liste blanche de catégories.
    sub_brand: options.brandSubBrand,
    categories: options.brandSubBrand ? undefined : options.brandCategories,
    survey_kind: surveyKind.value || undefined,
    status: surveyStatus.value || undefined,
    not_participated: notParticipated.value || undefined,
    respondent_token: options.type === 'survey' ? respondentToken.value : undefined,
  }))

  const { data, pending, error, refresh } = useAsyncData(
    options.key,
    () => fetchPublicCatalog(queryParams.value),
    { watch: [queryParams] },
  )

  const catalog = computed(() => data.value ?? EMPTY)
  const anyFilter = computed(
    () => Boolean(
      q.value.trim() || category.value || format.value || hasData.value
      || surveyKind.value || surveyStatus.value || notParticipated.value,
    ),
  )

  if (import.meta.client) {
    watch(
      [qInput, category, format, sort, view, hasData, surveyKind, surveyStatus, notParticipated],
      () => {
        const next: Record<string, string> = {}
        if (qInput.value.trim()) next.q = qInput.value.trim()
        if (category.value) next.cat = category.value
        if (format.value) next.format = format.value
        if (sort.value !== 'trend') next.sort = sort.value
        if (view.value !== 'grid') next.view = view.value
        if (hasData.value) next.data = '1'
        if (surveyKind.value) next.kind = surveyKind.value
        if (surveyStatus.value) next.statut = surveyStatus.value
        if (notParticipated.value) next.np = '1'
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
    surveyKind.value = ''
    surveyStatus.value = ''
    notParticipated.value = false
    perPage.value = 9
  }

  function selectSurveyKind(value: SurveyKind | '') {
    surveyKind.value = value
    perPage.value = 9
  }

  function selectSurveyStatus(value: SurveyStatusFilter | '') {
    surveyStatus.value = value
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
    surveyKind,
    surveyStatus,
    notParticipated,
    perPage,
    pending,
    error,
    catalog,
    anyFilter,
    resetFilters,
    loadMore,
    selectCategory,
    selectFormat,
    selectSurveyKind,
    selectSurveyStatus,
    toggleItemFavorite,
    isFavorited,
    refresh,
  }
}

function parseSort(raw: unknown): CatalogSort {
  return raw === 'recent' || raw === 'views' || raw === 'trend' || raw === 'votes' ? raw : 'trend'
}

function parseSurveyKind(raw: unknown): SurveyKind | '' {
  return raw === 'single_question' || raw === 'long' || raw === 'petition' ? raw : ''
}

function parseSurveyStatus(raw: unknown): SurveyStatusFilter | '' {
  return raw === 'ouvert' || raw === 'clos' ? raw : ''
}
