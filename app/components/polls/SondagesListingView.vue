<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingHero from '@/components/listing/tranches/ListingHero.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import SurveysListingToolbar from '@/components/polls/listing/SurveysListingToolbar.vue'
import SurveyFeature from '@/components/polls/listing/SurveyFeature.vue'
import SurveyTile from '@/components/polls/listing/SurveyTile.vue'
import SurveysTable from '@/components/polls/listing/SurveysTable.vue'
import SurveysPublishBand from '@/components/polls/listing/SurveysPublishBand.vue'
import { usePublicCatalog } from '@/composables/usePublicCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useContentCategoryNames } from '@/composables/useContentCategoryNames'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { buildRubricSlices, rubricBadgeOf, rubricLabel } from '@/lib/listing-rubrics'
import {
  surveyActiveFilters,
  surveyKindCaption,
  surveyKindOptions,
  surveyKindPie,
  surveySortContext,
  type SurveyFilterKey,
} from '@/lib/surveys-listing'
import type { CatalogItem, SurveyKind } from '@/types/catalog'

/**
 * Listing des sondages (Statsio, TVStats, Medistats) — charte « Tranches ».
 * Orchestration seule : recherche, type, thème, statut, « pas encore participé »,
 * tri, vue, pagination et favoris vivent dans `usePublicCatalog` (reflétés dans
 * l'URL) ; la présentation est dans `lib/listing-rubrics.ts` et `lib/surveys-listing.ts`.
 */
const props = defineProps<{
  /** titre imposé par une sous-marque */
  title?: string
}>()

const UNIT = { one: 'consultation', many: 'consultations' }

const basePath = useContentBasePath()
const categoryNames = useContentCategoryNames()
const {
  qInput,
  category,
  sort,
  view,
  surveyKind,
  surveyStatus,
  notParticipated,
  pending,
  catalog,
  anyFilter,
  resetFilters,
  loadMore,
  selectCategory,
  selectSurveyKind,
  selectSurveyStatus,
  toggleItemFavorite,
  isFavorited,
} = usePublicCatalog({ type: 'survey', key: 'surveys-catalog' })

/* ── types et thèmes ── */
const kinds = computed(() => surveyKindOptions(catalog.value.facets.survey_kinds))
const rubrics = computed(() =>
  buildRubricSlices(catalog.value.facets.categories, categoryNames.value),
)
const rubricOf = (item: CatalogItem) =>
  rubricBadgeOf(item.category, rubrics.value.slices, categoryNames.value)
const linkOf = (item: CatalogItem) => publicContentPath('survey', item.slug, basePath.value)

/* ── hero : chiffres + camembert des types ──
   Figé pendant une recherche (même objet → DsPie ne rejoue pas son animation). */
let lastHeroKinds = kinds.value
const heroKinds = computed(() => {
  if (!qInput.value.trim()) lastHeroKinds = kinds.value
  return lastHeroKinds
})
const heroPie = computed(() => surveyKindPie(heroKinds.value))
const heroPieLabel = computed(
  () =>
    `Répartition des consultations par type : ${heroPie.value.map((s) => `${s.label} ${s.value}`).join(', ')}`,
)
const heroCaption = computed(() => surveyKindCaption(heroKinds.value))
const heroStats = computed(() => [
  { label: 'Consultations publiées', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  // pour les sondages, l'API renvoie le nombre de pétitions dans `stats.charts`
  { label: 'Pétitions', value: formatCatalogCount(catalog.value.stats.charts) },
  {
    label: 'Dernière publication',
    value: formatRelativePublished(catalog.value.stats.last_published_at),
    small: true,
  },
])
const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: props.title ?? 'Sondages' },
])

/* ── résultats ── */
const filters = computed(() =>
  surveyActiveFilters(
    {
      q: qInput.value,
      kind: surveyKind.value,
      category: category.value,
      status: surveyStatus.value,
      notParticipated: notParticipated.value,
    },
    (v) => rubricLabel(v, categoryNames.value),
  ),
)
const context = computed(
  () => surveySortContext(sort.value) + (view.value === 'list' ? ' · vue liste' : ''),
)

function removeFilter(key: SurveyFilterKey) {
  if (key === 'q') qInput.value = ''
  else if (key === 'kind') selectSurveyKind('')
  else if (key === 'category') selectCategory('')
  else if (key === 'status') selectSurveyStatus('')
  else notParticipated.value = false
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
  <div class="ds-scope surveys">
    <ListingHero
      :crumbs="crumbs"
      lede="Un vote en un clic, un questionnaire complet ou une pétition à signer. Les résultats sont publics, exportables, et certaines consultations demandent une identité vérifiée pour compter une voix par personne."
      :stats="heroStats"
      :pie="heroPie"
      :pie-label="heroPieLabel"
      :caption="heroCaption"
    >
      <template #label>Consultations · <b>sondages rapides, questionnaires, pétitions</b></template>
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else
          >Ce que <em>pensent</em> les lecteurs,
          <span class="is-alt">chiffre à l'appui.</span></template
        >
      </template>
    </ListingHero>

    <SurveysListingToolbar
      v-model:q="qInput"
      v-model:sort="sort"
      v-model:view="view"
      v-model:not-participated="notParticipated"
      :kind="surveyKind"
      :category="category"
      :status="surveyStatus"
      :kinds="kinds"
      :slices="rubrics.slices"
      :other-rubrics="rubrics.others"
      @update:kind="(v: SurveyKind | '') => selectSurveyKind(v)"
      @update:category="selectCategory"
      @update:status="selectSurveyStatus"
    />

    <section class="ds-max surveys__list" aria-label="Consultations">
      <ListingResultBar
        :total="catalog.meta.total"
        :unit="UNIT"
        :overall="anyFilter ? catalog.stats.published : null"
        :filters="filters"
        :context="context"
        @remove="removeFilter"
        @reset="resetFilters"
      />

      <div v-if="loadingFirst" class="surveys__grid" aria-busy="true">
        <DsBox v-for="i in 6" :key="i" shadow="sm" class="surveys__ghost" />
      </div>

      <template v-else-if="catalog.data.length">
        <template v-if="view === 'grid'">
          <SurveyFeature
            v-if="featured"
            :item="featured"
            :to="linkOf(featured)"
            :favorited="isFavorited(featured)"
            @favorite="toggleItemFavorite(featured)"
          />
          <div class="surveys__grid">
            <SurveyTile
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
        <SurveysTable
          v-else
          :items="catalog.data"
          :query="qInput"
          :link-of="linkOf"
          :is-favorited="isFavorited"
          @favorite="toggleItemFavorite"
        />

        <div v-if="catalog.meta.has_more" class="surveys__more">
          <DsButton variant="secondary" :disabled="pending" @click="loadMore"
            >Afficher {{ moreCount }} de plus</DsButton
          >
        </div>
        <ListingEndLine
          v-else
          :total="catalog.meta.total"
          :overall="anyFilter ? catalog.stats.published : null"
          :unit="UNIT"
          feminine
        />
      </template>

      <ListingEmptyState
        v-else
        :filtered="anyFilter"
        :query="qInput"
        title="Aucune consultation ne correspond"
        empty-title="Aucune consultation publiée pour le moment"
        hint="Essayez un autre type, thème ou statut."
        @reset="resetFilters"
      />

      <SurveysPublishBand />
    </section>
  </div>
</template>

<style scoped>
.surveys {
  padding-bottom: 80px;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.surveys :deep(.is-alt) {
  color: var(--ds-t2);
}
.surveys__list {
  padding-top: 28px;
}
.surveys__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 26px;
}
@media (min-width: 621px) {
  .surveys__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1041px) {
  .surveys__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.surveys__ghost {
  height: 380px;
  background: var(--ds-tint);
  animation: surveys-pulse 1.4s var(--ds-e-balaye) infinite alternate;
}
@keyframes surveys-pulse {
  to {
    opacity: 0.55;
  }
}
.surveys__more {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
