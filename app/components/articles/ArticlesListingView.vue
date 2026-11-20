<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingHero from '@/components/listing/tranches/ListingHero.vue'
import ArticlesListingToolbar from '@/components/articles/listing/ArticlesListingToolbar.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import ArticleFeature from '@/components/articles/listing/ArticleFeature.vue'
import ArticleTile from '@/components/articles/listing/ArticleTile.vue'
import ArticlesTable from '@/components/articles/listing/ArticlesTable.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import ArticlesWriteBand from '@/components/articles/listing/ArticlesWriteBand.vue'
import { usePublicCatalog } from '@/composables/usePublicCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useContentCategoryNames } from '@/composables/useContentCategoryNames'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import {
  activeFilters,
  buildRubricSlices,
  rubricBadgeOf,
  rubricLabel,
  rubricLeadCaption,
  rubricPieSegments,
  sortContextLabel,
  visibleFormatFacets,
  type ActiveFilterKey,
  type RubricSlice,
} from '@/lib/articles-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Listing des articles (Statsio, TVStats, Medistats) — charte « Tranches ».
 * Orchestration seule : l'état (recherche, filtres, tri, vue, pagination,
 * favoris) vit dans `usePublicCatalog` et se reflète dans l'URL ; la logique
 * de présentation est dans `lib/articles-listing.ts`.
 */
const props = defineProps<{
  /** titre imposé par une sous-marque (« Actus », « Articles ») */
  title?: string
}>()

const basePath = useContentBasePath()
const categoryNames = useContentCategoryNames()
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
} = usePublicCatalog({ type: 'article', key: 'articles-catalog' })

/* ── rubriques : tranche de la barre d'outils + pastilles des cartes ── */
const rubrics = computed(() =>
  buildRubricSlices(catalog.value.facets.categories, categoryNames.value),
)
const rubricOf = (item: CatalogItem) =>
  rubricBadgeOf(item.category, rubrics.value.slices, categoryNames.value)
const formatFacets = computed(() => visibleFormatFacets(catalog.value.facets.formats))
const linkOf = (item: CatalogItem) => publicContentPath('article', item.slug, basePath.value)

/* ── hero : chiffres du catalogue + camembert des rubriques ──
   Les facettes suivent la recherche ; le camembert, lui, ne doit pas se redessiner
   à chaque frappe : pendant une recherche on garde la dernière répartition sans
   recherche (même objet → DsPie ne rejoue pas son animation). */
type HeroRubrics = { slices: RubricSlice[]; others: RubricSlice[]; total: number }
let lastHeroRubrics: HeroRubrics = { slices: [], others: [], total: 0 }
const heroRubrics = computed<HeroRubrics>(() => {
  if (!qInput.value.trim()) {
    const all = catalog.value.facets.categories.find((f) => !f.value)
    lastHeroRubrics = { ...rubrics.value, total: all?.count ?? catalog.value.stats.published }
  }
  return lastHeroRubrics
})
const heroPie = computed(() =>
  rubricPieSegments(heroRubrics.value.slices, heroRubrics.value.others),
)
const heroPieLabel = computed(
  () =>
    `Répartition des articles par rubrique : ${heroPie.value.map((s) => `${s.label} ${s.value}`).join(', ')}`,
)
const heroCaption = computed(() =>
  rubricLeadCaption(heroRubrics.value.slices, heroRubrics.value.total),
)
const heroStats = computed(() => [
  { label: 'Articles publiés', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  { label: 'Graphiques intégrés', value: formatCatalogCount(catalog.value.stats.charts) },
  {
    label: 'Dernière parution',
    value: formatRelativePublished(catalog.value.stats.last_published_at),
    small: true,
  },
])
const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: props.title ?? 'Articles' },
])

/* ── résultats ── */
const filters = computed(() =>
  activeFilters(
    { q: qInput.value, category: category.value, format: format.value, hasData: hasData.value },
    {
      category: (v) => rubricLabel(v, categoryNames.value),
      format: (v) => formatFacets.value.find((f) => f.value === v)?.label ?? v,
    },
  ),
)
const context = computed(
  () => sortContextLabel(sort.value) + (view.value === 'list' ? ' · vue liste' : ''),
)

function removeFilter(key: ActiveFilterKey) {
  if (key === 'q') qInput.value = ''
  else if (key === 'category') selectCategory('')
  else if (key === 'format') selectFormat('')
  else hasData.value = false
}

const featured = computed(() =>
  view.value === 'grid' && !anyFilter.value ? catalog.value.featured : null,
)
const gridItems = computed(() =>
  catalog.value.data.filter((item) => item.id !== featured.value?.id),
)
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const loadingFirst = computed(() => pending.value && !catalog.value.data.length)
</script>

<template>
  <div class="ds-scope articles">
    <ListingHero
      :crumbs="crumbs"
      lede="Chaque article croise un texte, des graphiques interactifs et les jeux de données ouverts qui les nourrissent. Il est signé par une chaîne ou un analyste indépendant."
      :stats="heroStats"
      :pie="heroPie"
      :pie-label="heroPieLabel"
      :caption="heroCaption"
    >
      <template #label>Articles · <b>enquêtes, décryptages et dossiers data</b></template>
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else
          >Des récits écrits <em>à partir</em> des <span class="is-alt">chiffres.</span></template
        >
      </template>
    </ListingHero>

    <ArticlesListingToolbar
      v-model:q="qInput"
      v-model:sort="sort"
      v-model:view="view"
      v-model:has-data="hasData"
      :category="category"
      :format="format"
      :slices="rubrics.slices"
      :other-rubrics="rubrics.others"
      :formats="formatFacets"
      @update:category="selectCategory"
      @update:format="selectFormat"
    />

    <section class="ds-max articles__list" aria-label="Articles">
      <ListingResultBar
        :total="catalog.meta.total"
        :unit="{ one: 'article', many: 'articles' }"
        :overall="anyFilter ? catalog.stats.published : null"
        :filters="filters"
        :context="context"
        @remove="removeFilter"
        @reset="resetFilters"
      />

      <div v-if="loadingFirst" class="articles__grid" aria-busy="true">
        <DsBox v-for="i in 6" :key="i" shadow="sm" class="articles__ghost" />
      </div>

      <template v-else-if="catalog.data.length">
        <template v-if="view === 'grid'">
          <ArticleFeature
            v-if="featured"
            :item="featured"
            :to="linkOf(featured)"
            :rubric="rubricOf(featured)"
            :favorited="isFavorited(featured)"
            @favorite="toggleItemFavorite(featured)"
          />
          <div class="articles__grid">
            <ArticleTile
              v-for="item in gridItems"
              :key="item.id"
              :item="item"
              :to="linkOf(item)"
              :rubric="rubricOf(item)"
              :favorited="isFavorited(item)"
              :query="qInput"
              @favorite="toggleItemFavorite(item)"
            />
          </div>
        </template>
        <ArticlesTable
          v-else
          :items="catalog.data"
          :query="qInput"
          :link-of="linkOf"
          :rubric-of="rubricOf"
          :is-favorited="isFavorited"
          @favorite="toggleItemFavorite"
        />

        <div v-if="catalog.meta.has_more" class="articles__more">
          <DsButton variant="secondary" :disabled="pending" @click="loadMore">
            Afficher {{ moreCount }} de plus
          </DsButton>
        </div>
        <ListingEndLine
          v-else
          :total="catalog.meta.total"
          :overall="anyFilter ? catalog.stats.published : null"
          :unit="{ one: 'article', many: 'articles' }"
        />
      </template>

      <ListingEmptyState
        v-else
        :filtered="anyFilter"
        :query="qInput"
        title="Aucun article pour cette combinaison"
        empty-title="Aucun article publié pour le moment"
        hint="Retirez un filtre ou essayez une autre rubrique."
        @reset="resetFilters"
      />

      <ArticlesWriteBand />
    </section>
  </div>
</template>

<style scoped>
.articles {
  padding-bottom: 80px;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.articles :deep(.is-alt) {
  color: var(--ds-t2);
}
.articles__list {
  padding-top: 28px;
}
.articles__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 26px;
}
@media (min-width: 621px) {
  .articles__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1041px) {
  .articles__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.articles__ghost {
  height: 340px;
  background: var(--ds-tint);
  animation: articles-pulse 1.4s var(--ds-e-balaye) infinite alternate;
}
@keyframes articles-pulse {
  to {
    opacity: 0.55;
  }
}
.articles__more {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
