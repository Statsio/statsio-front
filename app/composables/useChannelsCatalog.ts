import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { fetchChannelCatalog, toggleChannelSubscription } from '@/api/channels'
import { useAuthStore } from '@/stores/auth'
import { useContentDomain } from '@/composables/useContentDomain'
import type {
  ChannelCatalogItem,
  ChannelCatalogQuery,
  ChannelCatalogResponse,
  ChannelCatalogSort,
  ChannelCatalogView,
} from '@/types/channel-catalog'

const EMPTY: ChannelCatalogResponse = {
  data: [],
  meta: { total: 0, shown: 0, per_page: 9, has_more: false },
  facets: { kinds: [], themes: [], paces: [] },
  stats: { active: 0, verified: 0, publications_month: 0, last_channel_at: null },
  featured: null,
}

function parseSort(raw: unknown): ChannelCatalogSort {
  return raw === 'recent' || raw === 'followers' ? raw : 'trend'
}

export function useChannelsCatalog() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const domain = useContentDomain()

  const qInput = ref(String(route.query.q ?? ''))
  const q = refDebounced(qInput, 280)
  const kind = ref(String(route.query.kind ?? ''))
  const theme = ref(String(route.query.theme ?? ''))
  const pace = ref(String(route.query.pace ?? ''))
  const sort = ref<ChannelCatalogSort>(parseSort(route.query.sort))
  const view = ref<ChannelCatalogView>(route.query.view === 'list' ? 'list' : 'grid')
  const verifiedOnly = ref(route.query.verified === '1')
  const followedOnly = ref(route.query.followed === '1')
  const perPage = ref(9)

  // { [channelId]: { following, count } } — bascule optimiste, prioritaire sur la réponse serveur.
  const followOverrides = ref<Record<number, { following: boolean; count: number }>>({})

  watch([q, kind, theme, pace, verifiedOnly, followedOnly, sort], () => {
    perPage.value = 9
  })

  const queryParams = computed<ChannelCatalogQuery>(() => ({
    q: q.value.trim() || undefined,
    kind: kind.value || undefined,
    category: theme.value || undefined,
    pace: pace.value || undefined,
    sort: sort.value,
    sub_brand: domain.value,
    verified: verifiedOnly.value || undefined,
    followed: followedOnly.value || undefined,
    per_page: perPage.value,
  }))

  const { data, pending, error, refresh } = useAsyncData(
    `channels-catalog-${domain.value}`,
    () => fetchChannelCatalog(queryParams.value),
    { watch: [queryParams] },
  )

  const catalog = computed(() => data.value ?? EMPTY)

  const anyFilter = computed(
    () =>
      Boolean(q.value.trim()) ||
      Boolean(kind.value) ||
      Boolean(theme.value) ||
      Boolean(pace.value) ||
      verifiedOnly.value ||
      followedOnly.value,
  )

  if (import.meta.client) {
    watch(
      [qInput, kind, theme, pace, sort, view, verifiedOnly, followedOnly],
      () => {
        const next: Record<string, string> = {}
        if (qInput.value.trim()) next.q = qInput.value.trim()
        if (kind.value) next.kind = kind.value
        if (theme.value) next.theme = theme.value
        if (pace.value) next.pace = pace.value
        if (sort.value !== 'trend') next.sort = sort.value
        if (view.value !== 'grid') next.view = view.value
        if (verifiedOnly.value) next.verified = '1'
        if (followedOnly.value) next.followed = '1'
        void router.replace({ query: next })
      },
      { flush: 'post' },
    )
  }

  function resetFilters() {
    qInput.value = ''
    kind.value = ''
    theme.value = ''
    pace.value = ''
    verifiedOnly.value = false
    followedOnly.value = false
    perPage.value = 9
  }

  function loadMore() {
    perPage.value += 6
  }

  function selectKind(value: string) {
    kind.value = value
  }

  function selectTheme(value: string) {
    theme.value = value
  }

  function selectPace(value: string) {
    pace.value = value
  }

  function isFollowing(item: { id: number; is_following: boolean }) {
    return followOverrides.value[item.id]?.following ?? item.is_following
  }

  function followersOf(item: ChannelCatalogItem) {
    return followOverrides.value[item.id]?.count ?? item.followers_count
  }

  async function toggleItemFollow(item: { id: number; is_following: boolean; followers_count?: number }) {
    if (!auth.isAuthenticated) {
      await navigateTo('/login')
      return
    }
    const result = await toggleChannelSubscription(item.id)
    followOverrides.value = {
      ...followOverrides.value,
      [item.id]: { following: result.isFollowing, count: result.followersCount },
    }
  }

  return {
    qInput,
    q,
    kind,
    theme,
    pace,
    sort,
    view,
    verifiedOnly,
    followedOnly,
    perPage,
    pending,
    error,
    catalog,
    anyFilter,
    resetFilters,
    loadMore,
    selectKind,
    selectTheme,
    selectPace,
    isFollowing,
    followersOf,
    toggleItemFollow,
    refresh,
  }
}
