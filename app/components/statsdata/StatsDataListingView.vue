<script setup lang="ts">
import { computed, ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingHero from '@/components/listing/tranches/ListingHero.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import StatsDataListingToolbar from '@/components/statsdata/listing/StatsDataListingToolbar.vue'
import StatsDataFeature from '@/components/statsdata/listing/StatsDataFeature.vue'
import StatsDataTile from '@/components/statsdata/listing/StatsDataTile.vue'
import StatsDataTable from '@/components/statsdata/listing/StatsDataTable.vue'
import StatsDataPublishBand from '@/components/statsdata/listing/StatsDataPublishBand.vue'
import { usePublicCatalog } from '@/composables/usePublicCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useContentCategoryNames } from '@/composables/useContentCategoryNames'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import {
  buildRubricSlices,
  rubricBadgeOf,
  rubricLabel,
  rubricLeadCaption,
  rubricPieSegments,
  sortContextLabel,
  type RubricSlice,
} from '@/lib/listing-rubrics'
import {
  applyStatsDataToggles,
  hasToggle,
  NO_TOGGLES,
  statsDataActiveFilters,
  type StatsDataFilterKey,
  type StatsDataToggles,
} from '@/lib/statsdata-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Listing des StatsData (Statsio, TVStats, Medistats) — charte « Tranches ».
 * Orchestration seule : recherche, catégorie, tri, vue, pagination et favoris
 * vivent dans `usePublicCatalog` (reflétés dans l'URL) ; les filtres « Affiner »
 * s'appliquent aux résultats chargés ; la présentation est dans
 * `lib/listing-rubrics.ts` et `lib/statsdata-listing.ts`.
 */
const props = defineProps<{
  /** titre imposé par une sous-marque */
  title?: string
}>()

const UNIT = { one: 'StatsData', many: 'StatsData' }

const basePath = useContentBasePath()
const categoryNames = useContentCategoryNames()
const {
  qInput,
  category,
  sort,
  view,
  pending,
  catalog,
  anyFilter: anyServerFilter,
  resetFilters,
  loadMore,
  selectCategory,
  toggleItemFavorite,
  isFavorited,
} = usePublicCatalog({ type: 'statsdata', key: 'statsdata-catalog' })

const toggles = ref<StatsDataToggles>({ ...NO_TOGGLES })
const anyFilter = computed(() => anyServerFilter.value || hasToggle(toggles.value))

/* ── catégories : tranche de la barre d'outils + pastilles des cartes ── */
const rubrics = computed(() =>
  buildRubricSlices(catalog.value.facets.categories, categoryNames.value),
)
const rubricOf = (item: CatalogItem) =>
  rubricBadgeOf(item.category, rubrics.value.slices, categoryNames.value)
const linkOf = (item: CatalogItem) => publicContentPath('statsdata', item.slug, basePath.value)

/* ── hero : chiffres du catalogue + camembert des catégories ──
   Le camembert ne se redessine pas à chaque frappe : pendant une recherche on garde
   la dernière répartition sans recherche (même objet → DsPie ne rejoue pas). */
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
    `Répartition des StatsData par catégorie : ${heroPie.value.map((s) => `${s.label} ${s.value}`).join(', ')}`,
)
const heroCaption = computed(() =>
  rubricLeadCaption(heroRubrics.value.slices, heroRubrics.value.total, UNIT),
)
const heroStats = computed(() => [
  { label: 'StatsData publiés', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  { label: 'Graphiques intégrés', value: formatCatalogCount(catalog.value.stats.charts) },
  {
    label: 'Dernière mise à jour',
    value: formatRelativePublished(catalog.value.stats.last_published_at),
    small: true,
  },
])
const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: props.title ?? 'StatsData' },
])

/* ── résultats ── */
const items = computed(() => applyStatsDataToggles(catalog.value.data, toggles.value))
const total = computed(() =>
  hasToggle(toggles.value) ? items.value.length : catalog.value.meta.total,
)
const filters = computed(() =>
  statsDataActiveFilters(
    { q: qInput.value, category: category.value, toggles: toggles.value },
    (v) => rubricLabel(v, categoryNames.value),
  ),
)
const context = computed(
  () => sortContextLabel(sort.value) + (view.value === 'list' ? ' · vue liste' : ''),
)

function removeFilter(key: StatsDataFilterKey) {
  if (key === 'q') qInput.value = ''
  else if (key === 'category') selectCategory('')
  else toggles.value = { ...toggles.value, [key]: false }
}

function resetAll() {
  toggles.value = { ...NO_TOGGLES }
  resetFilters()
}

const featured = computed(() =>
  view.value === 'grid' && !anyFilter.value ? catalog.value.featured : null,
)
const gridItems = computed(() => items.value.filter((item) => item.id !== featured.value?.id))
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const loadingFirst = computed(() => pending.value && !catalog.value.data.length)
</script>

<template>
  <div class="ds-scope statsdata">
    <ListingHero
      :crumbs="crumbs"
      lede="Un StatsData branche une source publique, la met en graphiques et en tableaux, et se resynchronise tout seul. Choisissez un sujet, filtrez une commune, téléchargez les lignes."
      :stats="heroStats"
      :pie="heroPie"
      :pie-label="heroPieLabel"
      :caption="heroCaption"
    >
      <template #label
        >StatsData · <b>jeux de données interactifs et séries temporelles</b></template
      >
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else
          >Des données <em>vivantes</em> pour <span class="is-alt">comprendre</span> le
          réel.</template
        >
      </template>
    </ListingHero>

    <StatsDataListingToolbar
      v-model:q="qInput"
      v-model:sort="sort"
      v-model:view="view"
      v-model:toggles="toggles"
      :category="category"
      :slices="rubrics.slices"
      :other-rubrics="rubrics.others"
      @update:category="selectCategory"
    />

    <section class="ds-max statsdata__list" aria-label="StatsData">
      <ListingResultBar
        :total="total"
        :unit="UNIT"
        :overall="anyFilter ? catalog.stats.published : null"
        :filters="filters"
        :context="context"
        @remove="removeFilter"
        @reset="resetAll"
      />

      <div v-if="loadingFirst" class="statsdata__grid" aria-busy="true">
        <DsBox v-for="i in 6" :key="i" shadow="sm" class="statsdata__ghost" />
      </div>

      <template v-else-if="items.length">
        <template v-if="view === 'grid'">
          <StatsDataFeature
            v-if="featured"
            :item="featured"
            :to="linkOf(featured)"
            :rubric="rubricOf(featured)"
            :favorited="isFavorited(featured)"
            @favorite="toggleItemFavorite(featured)"
          />
          <div class="statsdata__grid">
            <StatsDataTile
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
        <StatsDataTable
          v-else
          :items="items"
          :query="qInput"
          :link-of="linkOf"
          :rubric-of="rubricOf"
          :is-favorited="isFavorited"
          @favorite="toggleItemFavorite"
        />

        <div v-if="catalog.meta.has_more" class="statsdata__more">
          <DsButton variant="secondary" :disabled="pending" @click="loadMore"
            >Afficher {{ moreCount }} de plus</DsButton
          >
        </div>
        <ListingEndLine
          v-else
          :total="total"
          :overall="anyFilter ? catalog.stats.published : null"
          :unit="UNIT"
        />
      </template>

      <ListingEmptyState
        v-else
        :filtered="anyFilter"
        :query="qInput"
        title="Aucun StatsData ne correspond"
        empty-title="Aucun StatsData publié pour le moment"
        hint="Retirez un filtre ou essayez une autre catégorie."
        @reset="resetAll"
      />

      <StatsDataPublishBand />
    </section>
  </div>
</template>

<style scoped>
.statsdata {
  padding-bottom: 80px;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.statsdata :deep(.is-alt) {
  color: var(--ds-t2);
}
.statsdata__list {
  padding-top: 28px;
}
.statsdata__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 26px;
}
@media (min-width: 621px) {
  .statsdata__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1041px) {
  .statsdata__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.statsdata__ghost {
  height: 360px;
  background: var(--ds-tint);
  animation: statsdata-pulse 1.4s var(--ds-e-balaye) infinite alternate;
}
@keyframes statsdata-pulse {
  to {
    opacity: 0.55;
  }
}
.statsdata__more {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
