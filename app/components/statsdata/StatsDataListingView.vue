<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePublicCatalog } from '@/composables/usePublicCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import CatalogHero from '@/components/listing/CatalogHero.vue'
import CatalogToolbar from '@/components/listing/CatalogToolbar.vue'
import CatalogSearchField from '@/components/listing/CatalogSearchField.vue'
import CatalogSortPills from '@/components/listing/CatalogSortPills.vue'
import CatalogViewToggle from '@/components/listing/CatalogViewToggle.vue'
import CatalogChipRow from '@/components/listing/CatalogChipRow.vue'
import CatalogToggleChip from '@/components/listing/CatalogToggleChip.vue'
import CatalogResultBar from '@/components/listing/CatalogResultBar.vue'
import CatalogEmpty from '@/components/listing/CatalogEmpty.vue'
import CatalogLoadMore from '@/components/listing/CatalogLoadMore.vue'
import CatalogCta from '@/components/listing/CatalogCta.vue'
import StatsDataCard from '@/components/content/StatsDataCard.vue'

const props = defineProps<{
  categories?: string[]
  title?: string
}>()

const basePath = useContentBasePath()
const sortMode = ref<'trend' | 'recent' | 'rows'>('trend')
const withCharts = ref(false)
const withMultiSources = ref(false)
const recentlyUpdated = ref(false)

const {
  qInput,
  category,
  sort,
  view,
  pending,
  catalog,
  anyFilter,
  resetFilters,
  loadMore,
  selectCategory,
  toggleItemFavorite,
  isFavorited,
} = usePublicCatalog({
  type: 'statsdata',
  brandCategories: props.categories,
  key: `statsdata-catalog-${(props.categories ?? []).join(',')}`,
})

watch(sortMode, (v) => {
  sort.value = v === 'rows' ? 'recent' : v
}, { immediate: true })

const sortOptions: { value: 'trend' | 'recent' | 'rows'; label: string }[] = [
  { value: 'trend', label: 'Tendance' },
  { value: 'recent', label: 'Récents' },
  { value: 'rows', label: 'Volume' },
]

const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: 'StatsData' },
])

const heroStats = computed(() => [
  { label: 'Datasets publiés', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  { label: 'Graphiques intégrés', value: formatCatalogCount(catalog.value.stats.charts) },
  { label: 'Dernière mise à jour', value: formatRelativePublished(catalog.value.stats.last_published_at) },
])

const categoryFacets = computed(() => catalog.value.facets.categories)

function rowCountOf(item: { linked_datasets_count?: number; charts_count?: number; views_count?: number }) {
  return (item.linked_datasets_count ?? 0) * 1000 + (item.charts_count ?? 0) * 12 + (item.views_count ?? 0)
}

const sortedData = computed(() => {
  const arr = [...catalog.value.data]
  if (withCharts.value) {
    for (let i = arr.length - 1; i >= 0; i--) if (!(arr[i]!.charts_count > 0)) arr.splice(i, 1)
  }
  if (withMultiSources.value) {
    for (let i = arr.length - 1; i >= 0; i--) if (!((arr[i]!.linked_datasets_count ?? 0) > 1)) arr.splice(i, 1)
  }
  if (recentlyUpdated.value) {
    const week = Date.now() - 7 * 86_400_000
    for (let i = arr.length - 1; i >= 0; i--) {
      const t = new Date(arr[i]!.updated_at ?? 0).getTime()
      if (t < week) arr.splice(i, 1)
    }
  }
  if (sortMode.value === 'rows') {
    arr.sort((a, b) => rowCountOf(b) - rowCountOf(a))
  }
  return arr
})

const sortedTotal = computed(() => sortedData.value.length)
const shownCount = computed(() => Math.min(catalog.value.meta.shown, sortedTotal.value))

const countLine = computed(
  () => `${sortedTotal.value} dataset${sortedTotal.value > 1 ? 's' : ''} · ${shownCount.value} affiché${shownCount.value > 1 ? 's' : ''}`,
)
const hasClientFilter = computed(() => withCharts.value || withMultiSources.value || recentlyUpdated.value || sortMode.value === 'rows')
const contextLine = computed(() =>
  anyFilter.value || hasClientFilter.value ? 'Filtres actifs' : 'Classés par tendance',
)
const moreCount = computed(() =>
  Math.min(6, Math.max(0, sortedTotal.value - shownCount.value)),
)
const showFeatured = computed(() => view.value === 'grid' && !anyFilter.value && !hasClientFilter.value && Boolean(catalog.value.featured))
const gridItems = computed(() => {
  const items = sortedData.value
  if (!showFeatured.value || !catalog.value.featured) return items
  return items.filter((item) => item.id !== catalog.value.featured?.id)
})
const canLoadMore = computed(() => catalog.value.meta.has_more || shownCount.value < sortedTotal.value)

function onSelectTag(tag: string) {
  qInput.value = tag
}

function resetAll() {
  withCharts.value = false
  withMultiSources.value = false
  recentlyUpdated.value = false
  sortMode.value = 'trend'
  resetFilters()
}
</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <CatalogHero
      :crumbs="crumbs"
      badge="STATSDATA"
      badge-class="!border-[#ddd6fe] !bg-[#f2ecfd] !text-[#6d28d9]"
      kicker="DATASETS INTERACTIFS · SÉRIES TEMPORELLES · ANALYSES EXPERTES"
      :title="title"
      subtitle="Explorez et comparez des indicateurs clés : chaque Statsdata croise sources vérifiées, graphiques interactifs et pages analytiques personnalisables — créés par des experts Statsio."
      :stats="heroStats"
      hero-src="/brand/listings/statsdata-hero-light.png"
    >
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else>
          Des <span class="text-primary">données vivantes</span> pour <span class="text-accent">comprendre</span> le réel.
        </template>
      </template>
    </CatalogHero>

    <CatalogToolbar>
      <template #search>
        <CatalogSearchField v-model="qInput" placeholder="Rechercher un dataset, une source, un indicateur…" />
      </template>
      <template #sort>
        <CatalogSortPills v-model="sortMode" :options="sortOptions" />
      </template>
      <template #view>
        <CatalogViewToggle v-model="view" />
      </template>

      <CatalogChipRow
        v-if="categoryFacets.length > 1"
        label="Catégorie"
        :model-value="category"
        :options="categoryFacets"
        @update:model-value="selectCategory"
      />

      <div class="flex flex-wrap items-center gap-2.5">
        <CatalogToggleChip v-model="withCharts" label="Avec graphiques" />
        <CatalogToggleChip v-model="withMultiSources" label="Multi-sources" />
        <CatalogToggleChip v-model="recentlyUpdated" label="Mis à jour cette semaine" />
        <span class="flex-1" />
        <button
          v-if="anyFilter || hasClientFilter"
          type="button"
          class="rounded-full border-[1.5px] border-slate-200 px-3.5 py-[7px] text-xs font-bold text-slate-500 transition hover:border-[#c4b5fd] hover:text-primary"
          @click="resetAll"
        >
          Réinitialiser
        </button>
      </div>
    </CatalogToolbar>

    <div class="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:pb-[90px] lg:pt-[26px]">
      <CatalogResultBar :count-line="countLine" :context-line="contextLine" />

      <div v-if="pending && !catalog.data.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-72 animate-pulse rounded-[18px] bg-white" />
      </div>

      <template v-else-if="sortedTotal > 0">
        <StatsDataCard v-if="showFeatured && catalog.featured" :item="catalog.featured" format="row" feature class="mb-[22px]" />

        <div v-if="view === 'grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsDataCard
            v-for="item in gridItems"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
            @select-tag="onSelectTag"
          />
        </div>

        <div v-else class="overflow-x-auto rounded-[18px] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
          <div class="grid min-w-[720px] grid-cols-[minmax(0,2.4fr)_1.3fr_1fr_0.8fr_0.7fr_46px] gap-3.5 bg-[#faf9fd] px-5 py-3">
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Dataset</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Tendance</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Catégorie</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Publié par</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Sources</div>
            <div />
          </div>
          <div class="min-w-[720px]">
            <StatsDataCard
              v-for="item in sortedData"
              :key="item.id"
              :item="item"
              format="row"
              :favorited="isFavorited(item)"
              @favorite="toggleItemFavorite(item)"
            />
          </div>
        </div>

        <CatalogLoadMore
          v-if="canLoadMore"
          :more-count="moreCount"
          :loading="pending"
          @load="loadMore"
        />
      </template>

      <CatalogEmpty
        v-else
        title="Aucun StatsData ne correspond"
        :subtitle="qInput || category || hasClientFilter ? 'Aucun résultat avec ces filtres. Essayez un autre mot-clé ou réinitialisez les filtres.' : 'Essayez une autre catégorie ou un autre mot-clé.'"
        @reset="resetAll"
      />

      <CatalogCta
        title="Publiez votre propre StatsData"
        subtitle="Le studio vous permet de connecter une source de données, de créer des graphiques et de publier un dataset interactif en quelques minutes."
        primary-to="/studio"
        primary-label="Créer un StatsData"
        secondary-to="/about"
        secondary-label="Guide des données"
      />
    </div>
  </div>
</template>


