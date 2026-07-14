import { readonly, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  getChannelCategories,
  getPublicChannels,
  type Channel,
  type ChannelCategory,
  type ChannelCategoryItem,
  type ChannelSort,
} from '@/api/channels'

const PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 350

export function useChannelsDirectory() {
  const channels = ref<Channel[]>([])
  const categories = ref<ChannelCategoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const search = ref('')
  const category = ref<ChannelCategory | ''>('')
  const sort = ref<ChannelSort>('popular')
  const page = ref(1)

  const lastPage = ref(1)
  const total = ref(0)

  async function fetchChannels() {
    loading.value = true
    error.value = null
    try {
      const result = await getPublicChannels({
        search: search.value,
        category: category.value,
        sort: sort.value,
        page: page.value,
        perPage: PER_PAGE,
      })
      channels.value = result.channels
      lastPage.value = Math.max(result.lastPage, 1)
      total.value = result.total
    } catch {
      error.value = 'Impossible de charger les chaînes. Réessayez dans un instant.'
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      categories.value = await getChannelCategories()
    } catch {
      categories.value = []
    }
  }

  function resetToFirstPage() {
    if (page.value !== 1) page.value = 1
    else void fetchChannels()
  }

  const debouncedSearch = useDebounceFn(resetToFirstPage, SEARCH_DEBOUNCE_MS)

  watch(search, debouncedSearch)
  watch([category, sort], resetToFirstPage)
  watch(page, fetchChannels)

  function setPage(next: number) {
    if (next < 1 || next > lastPage.value) return
    page.value = next
  }

  function resetFilters() {
    search.value = ''
    category.value = ''
    sort.value = 'popular'
    resetToFirstPage()
  }

  async function init() {
    await Promise.all([fetchCategories(), fetchChannels()])
  }

  return {
    // Non deep-readonly : ce sont des objets API imbriqués passés tels quels
    // aux composants enfants (readonly() en ferait un DeepReadonly incompatible
    // avec le type `Channel[]` mutable attendu par ChannelDirectoryGrid).
    channels,
    categories,
    loading: readonly(loading),
    error: readonly(error),
    search,
    category,
    sort,
    page: readonly(page),
    lastPage: readonly(lastPage),
    total: readonly(total),
    perPage: PER_PAGE,
    setPage,
    resetFilters,
    init,
  }
}
