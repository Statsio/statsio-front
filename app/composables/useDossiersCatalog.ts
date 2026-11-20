import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { fetchDossierCatalog } from '@/api/dossiers'
import { useContentDomain } from '@/composables/useContentDomain'
import type { CatalogView } from '@/types/catalog'
import type { DossierCatalogResponse, DossierCatalogSort, DossierContentType } from '@/types/dossier'
import type { SubBrand } from '@/types/sub-brand'

const PAGE = 12
/** plafond de l'API : « Dossiers suivis » filtre côté client, sur tout le catalogue chargé */
const MAX_PAGE = 48

const EMPTY: DossierCatalogResponse = {
  data: [],
  featured: null,
  meta: { total: 0, shown: 0, per_page: PAGE, has_more: false },
  facets: { categories: [], types: [] },
  stats: { dossiers: 0, contents: 0, categories: 0, last_updated_at: null },
}

function parseSort(raw: unknown): DossierCatalogSort {
  return raw === 'count' || raw === 'az' ? raw : 'maj'
}

function parseType(raw: unknown): DossierContentType | '' {
  return raw === 'statsdata' || raw === 'article' || raw === 'survey' ? raw : ''
}

function parseSubBrand(raw: unknown): SubBrand | '' {
  return raw === 'statsio' || raw === 'tvstats' || raw === 'medistats' ? raw : ''
}

/**
 * État de la page listing /dossiers : recherche, type de contenu, thème, domaine,
 * « Dossiers suivis », tri, affichage et pagination, reflétés dans l'URL comme les autres catalogues.
 * Le backend filtre / trie / pagine (peu de dossiers).
 *
 * Le domaine n'est choisissable que sur Statsio (qui agrège TVStats et Medistats) ;
 * les sous-sites restent cadrés à leur propre sous-marque.
 */
export function useDossiersCatalog() {
  const route = useRoute()
  const router = useRouter()
  const domain = useContentDomain()

  const qInput = ref(String(route.query.q ?? ''))
  const q = refDebounced(qInput, 280)
  const category = ref(String(route.query.cat ?? ''))
  const contentType = ref<DossierContentType | ''>(parseType(route.query.has))
  const subBrand = ref<SubBrand | ''>(parseSubBrand(route.query.domaine))
  const sort = ref<DossierCatalogSort>(parseSort(route.query.sort))
  const view = ref<CatalogView>(route.query.view === 'list' ? 'list' : 'grid')
  /** suivi local (navigateur) : filtré côté client, voir `useDossierFollows` */
  const followedOnly = ref(route.query.suivis === '1')
  const perPage = ref(PAGE)

  const canPickDomain = computed(() => domain.value === 'statsio')

  watch([q, category, contentType, subBrand, sort], () => {
    perPage.value = PAGE
  })

  const queryParams = computed(() => ({
    q: q.value.trim() || undefined,
    category: category.value || undefined,
    has: contentType.value || undefined,
    sort: sort.value,
    sub_brand: canPickDomain.value ? subBrand.value || undefined : domain.value,
    per_page: followedOnly.value ? MAX_PAGE : perPage.value,
  }))

  const { data, pending, error, refresh } = useAsyncData(
    `dossiers-catalog-${domain.value}`,
    () => fetchDossierCatalog(queryParams.value),
    { watch: [queryParams] },
  )

  const catalog = computed(() => data.value ?? EMPTY)
  const anyFilter = computed(() =>
    Boolean(
      q.value.trim() || category.value || contentType.value || subBrand.value || followedOnly.value,
    ),
  )

  if (import.meta.client) {
    watch(
      [qInput, category, contentType, subBrand, followedOnly, sort, view],
      () => {
        const next: Record<string, string> = {}
        if (qInput.value.trim()) next.q = qInput.value.trim()
        if (contentType.value) next.has = contentType.value
        if (category.value) next.cat = category.value
        if (subBrand.value) next.domaine = subBrand.value
        if (followedOnly.value) next.suivis = '1'
        if (sort.value !== 'maj') next.sort = sort.value
        if (view.value !== 'grid') next.view = view.value
        void router.replace({ query: next })
      },
      { flush: 'post' },
    )
  }

  function resetFilters() {
    qInput.value = ''
    category.value = ''
    contentType.value = ''
    subBrand.value = ''
    followedOnly.value = false
    perPage.value = PAGE
  }

  function loadMore() {
    perPage.value += PAGE
  }

  return {
    qInput,
    category,
    contentType,
    subBrand,
    canPickDomain,
    followedOnly,
    sort,
    view,
    perPage,
    pending,
    error,
    catalog,
    anyFilter,
    resetFilters,
    loadMore,
    refresh,
  }
}
