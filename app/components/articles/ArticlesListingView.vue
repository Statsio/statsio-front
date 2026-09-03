<script setup lang="ts">
import { computed } from 'vue'
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
import ArticleCard from '@/components/content/ArticleCard.vue'

const props = defineProps<{
  categories?: string[]
  subBrand?: import('@/types/sub-brand').SubBrand
  title?: string
}>()

const basePath = useContentBasePath()
const {
  qInput,
  category,
  format,
  sort,
  view,
  hasData,
  pending,
  catalog,
  anyFilter,
  resetFilters,
  loadMore,
  selectCategory,
  selectFormat,
  toggleItemFavorite,
  isFavorited,
} = usePublicCatalog({
  type: 'article',
  brandCategories: props.categories,
  brandSubBrand: props.subBrand,
  key: `articles-catalog-${props.subBrand ?? ''}-${(props.categories ?? []).join(',')}`,
})

const sortOptions: { value: 'trend' | 'recent' | 'views'; label: string }[] = [
  { value: 'trend', label: 'Tendance' },
  { value: 'recent', label: 'Récents' },
  { value: 'views', label: 'Les plus lus' },
]

const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: 'Articles' },
])

const heroStats = computed(() => [
  { label: 'Articles publiés', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  { label: 'Graphiques intégrés', value: formatCatalogCount(catalog.value.stats.charts) },
  { label: 'Dernière parution', value: formatRelativePublished(catalog.value.stats.last_published_at) },
])

const categoryFacets = computed(() => catalog.value.facets.categories)
const formatFacets = computed(() => {
  const facets = catalog.value.facets.formats
  const hasAny = facets.some((f) => f.value && f.count > 0)
  return hasAny ? facets.filter((f) => !f.value || f.count > 0) : []
})

const countLine = computed(
  () => `${catalog.value.meta.total} articles · ${catalog.value.meta.shown} affichés`,
)
const contextLine = computed(() =>
  anyFilter.value ? 'Filtres actifs' : 'Classés par tendance',
)
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const showFeatured = computed(() => view.value === 'grid' && !anyFilter.value && Boolean(catalog.value.featured))
const gridItems = computed(() => {
  const items = catalog.value.data
  if (!showFeatured.value || !catalog.value.featured) return items
  return items.filter((item) => item.id !== catalog.value.featured?.id)
})

</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <CatalogHero
      :crumbs="crumbs"
      badge="ARTICLES"
      kicker="ENQUÊTES, DÉCRYPTAGES ET DOSSIERS DATA"
      :title="title"
      subtitle="Chaque article croise texte long, graphiques interactifs et jeux de données ouverts — signés par une chaîne ou un analyste indépendant."
      hero-src="/brand/listings/articles-hero-light.png"
      :stats="heroStats"
    >
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else>
          Des <span class="text-primary">récits écrits</span> à partir des <span class="text-accent">chiffres</span>.
        </template>
      </template>
    </CatalogHero>

    <CatalogToolbar>
      <template #search>
        <CatalogSearchField v-model="qInput" placeholder="Rechercher un article, un auteur, un sujet…" />
      </template>
      <template #sort>
        <CatalogSortPills v-model="sort" :options="sortOptions" />
      </template>
      <template #view>
        <CatalogViewToggle v-model="view" />
      </template>

      <CatalogChipRow
        v-if="categoryFacets.length > 1"
        label="Rubrique"
        :model-value="category"
        :options="categoryFacets"
        @update:model-value="selectCategory"
      />

      <div v-if="formatFacets.length > 1" class="flex flex-wrap items-center gap-2.5">
        <CatalogChipRow
          class="min-w-0 flex-1"
          label="Format"
          variant="mono"
          :model-value="format"
          :options="formatFacets"
          @update:model-value="selectFormat"
        />
        <span class="flex-1" />
        <CatalogToggleChip v-model="hasData" label="Avec Statsdata lié" />
        <button
          v-if="anyFilter"
          type="button"
          class="shrink-0 rounded-full border-[1.5px] border-slate-200 px-3.5 py-[7px] text-xs font-bold text-slate-500 transition hover:border-[#c4b5fd] hover:text-primary"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>
      <div v-else class="flex flex-wrap items-center justify-end gap-2.5">
        <CatalogToggleChip v-model="hasData" label="Avec Statsdata lié" />
        <button
          v-if="anyFilter"
          type="button"
          class="rounded-full border-[1.5px] border-slate-200 px-3.5 py-[7px] text-xs font-bold text-slate-500 transition hover:border-[#c4b5fd] hover:text-primary"
          @click="resetFilters"
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

      <template v-else-if="catalog.meta.total > 0">
        <ArticleCard v-if="showFeatured && catalog.featured" :item="catalog.featured" format="row" feature class="mb-[22px]" />

        <div v-if="view === 'grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ArticleCard
            v-for="item in gridItems"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
          />
        </div>

        <div v-else class="overflow-x-auto rounded-[18px] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
          <div class="grid min-w-[720px] grid-cols-[minmax(0,2.6fr)_0.9fr_1.1fr_0.7fr_0.6fr_46px] gap-3.5 bg-[#faf9fd] px-5 py-3">
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Article</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Rubrique</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Publié par</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Lecture</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Vues</div>
            <div />
          </div>
          <div class="min-w-[720px]">
            <ArticleCard
              v-for="item in catalog.data"
              :key="item.id"
              :item="item"
              format="row"
              :favorited="isFavorited(item)"
              @favorite="toggleItemFavorite(item)"
            />
          </div>
        </div>

        <CatalogLoadMore
          v-if="catalog.meta.has_more"
          :more-count="moreCount"
          :loading="pending"
          @load="loadMore"
        />
      </template>

      <CatalogEmpty
        v-else
        title="Aucun article ne correspond"
        :subtitle="qInput ? `Aucun résultat pour « ${qInput} » avec ces filtres.` : 'Essayez une autre rubrique ou un autre format.'"
        @reset="resetFilters"
      />

      <CatalogCta
        title="Écrivez votre prochain décryptage"
        subtitle="Le studio mêle texte long et blocs interactifs : insérez un graphique issu d’un Statsdata en deux clics."
        primary-to="/studio"
        primary-label="Rédiger un article"
        secondary-to="/about"
        secondary-label="Guide éditorial"
      />
    </div>
  </div>
</template>
