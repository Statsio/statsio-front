<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingHero from '@/components/listing/tranches/ListingHero.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import DossiersListingToolbar from '@/components/dossiers/listing/DossiersListingToolbar.vue'
import DossierFeature from '@/components/dossiers/listing/DossierFeature.vue'
import DossierCard from '@/components/dossiers/listing/DossierCard.vue'
import DossiersTable from '@/components/dossiers/listing/DossiersTable.vue'
import DossiersPublishBand from '@/components/dossiers/listing/DossiersPublishBand.vue'
import { useDossiersCatalog } from '@/composables/useDossiersCatalog'
import { useDossierFollows } from '@/composables/useDossierFollows'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { publicDossierPath } from '@/lib/content-display'
import { buildRubricSlices, rubricBadgeOf, rubricLabel } from '@/lib/listing-rubrics'
import {
  DOSSIER_UNIT,
  dossierActiveFilters,
  dossierHeroCaption,
  dossierSortContext,
  dossierTypeOptions,
  dossierTypePie,
  type DossierFilterKey,
} from '@/lib/dossiers-listing'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Listing des dossiers (Statsio, TVStats, Medistats) — charte « Tranches ».
 * Orchestration seule : l'état (recherche, type, thème, domaine, suivis, tri, vue,
 * pagination) vit dans `useDossiersCatalog` (reflété dans l'URL), la logique de
 * présentation dans `lib/dossiers-listing.ts` et `lib/listing-rubrics.ts`.
 * « Dossiers suivis » reste local au navigateur (`useDossierFollows`).
 */
const props = defineProps<{
  /** titre imposé par une sous-marque */
  title?: string
}>()

const basePath = useContentBasePath()
const {
  qInput,
  category,
  contentType,
  subBrand,
  canPickDomain,
  followedOnly,
  sort,
  view,
  pending,
  catalog,
  anyFilter,
  resetFilters,
  loadMore,
} = useDossiersCatalog()
const { isFollowing, toggle } = useDossierFollows()

/* ── thèmes et types ── */
const categoryNames = computed(() =>
  Object.fromEntries(catalog.value.facets.categories.map((f) => [f.value, f.label])),
)
const rubrics = computed(() => buildRubricSlices(catalog.value.facets.categories, categoryNames.value))
const rubricOf = (item: DossierCatalogItem) =>
  rubricBadgeOf(item.category?.slug, rubrics.value.slices, categoryNames.value)
const types = computed(() => dossierTypeOptions(catalog.value.facets.types))
const linkOf = (item: DossierCatalogItem) => publicDossierPath(item.slug, basePath.value)
const following = (item: DossierCatalogItem) => isFollowing(item.slug)

/* ── hero : chiffres + camembert des contenus rangés par type ──
   Les stats portent sur tout le catalogue : on ne recrée le camembert que si
   ses valeurs changent (sinon DsPie rejouerait son animation à chaque filtre). */
const stats = computed(() => catalog.value.stats)
let lastPieKey = ''
let lastPie = dossierTypePie(undefined)
const heroPie = computed(() => {
  const key = JSON.stringify(stats.value.by_type ?? {})
  if (key !== lastPieKey) {
    lastPieKey = key
    lastPie = dossierTypePie(stats.value.by_type)
  }
  return lastPie
})
const heroPieLabel = computed(
  () => `Contenus rangés par type : ${heroPie.value.map((s) => `${s.label} ${s.value}`).join(', ')}`,
)
const heroStats = computed(() => [
  { label: 'Dossiers actifs', value: formatCatalogCount(stats.value.dossiers) },
  { label: 'Contenus rangés', value: formatCatalogCount(stats.value.contents) },
  { label: 'Mis à jour cette semaine', value: formatCatalogCount(stats.value.updated_this_week ?? 0) },
  { label: 'Dernier ajout', value: formatRelativePublished(stats.value.last_updated_at), small: true },
])
const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: props.title ?? 'Dossiers' },
])

/* ── résultats ──
   L'API sort le dossier à la une de `data` ; « Dossiers suivis » filtre côté client
   sur l'ensemble chargé (à la une compris). */
const loaded = computed(() =>
  catalog.value.featured ? [catalog.value.featured, ...catalog.value.data] : catalog.value.data,
)
const results = computed(() =>
  followedOnly.value ? loaded.value.filter(following) : loaded.value,
)
const featured = computed(() =>
  view.value === 'grid' && !anyFilter.value ? catalog.value.featured : null,
)
const gridItems = computed(() =>
  featured.value ? results.value.filter((d) => d.id !== featured.value?.id) : results.value,
)
const total = computed(() => (followedOnly.value ? results.value.length : catalog.value.meta.total))
const overall = computed(() => (anyFilter.value ? stats.value.dossiers : null))
const hasMore = computed(() => !followedOnly.value && catalog.value.meta.has_more)
const moreCount = computed(() =>
  Math.min(12, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const loadingFirst = computed(() => pending.value && !loaded.value.length)

const filters = computed(() =>
  dossierActiveFilters(
    {
      q: qInput.value,
      type: contentType.value,
      category: category.value,
      domain: subBrand.value,
      followedOnly: followedOnly.value,
    },
    (v) => rubricLabel(v, categoryNames.value),
  ),
)
const context = computed(
  () => dossierSortContext(sort.value) + (view.value === 'list' ? ' · vue liste' : ''),
)

function removeFilter(key: DossierFilterKey) {
  if (key === 'q') qInput.value = ''
  else if (key === 'type') contentType.value = ''
  else if (key === 'category') category.value = ''
  else if (key === 'domain') subBrand.value = ''
  else followedOnly.value = false
}
</script>

<template>
  <div class="ds-scope dossiers">
    <ListingHero
      :crumbs="crumbs"
      lede="Chaque dossier rassemble les StatsData, articles et sondages publiés sur un même sujet, toutes chaînes confondues. Suivez-en un pour le retrouver d'un coup d'œil."
      :stats="heroStats"
      :pie="heroPie"
      :pie-label="heroPieLabel"
      :caption="dossierHeroCaption(stats.by_type)"
    >
      <template #label>Dossiers · <b>les sujets suivis dans la durée</b></template>
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else
          >Un sujet, <em>tous</em> ses chiffres, <span class="is-alt">au même endroit.</span></template
        >
      </template>
    </ListingHero>

    <DossiersListingToolbar
      v-model:q="qInput"
      v-model:sort="sort"
      v-model:view="view"
      v-model:content-type="contentType"
      v-model:category="category"
      v-model:domain="subBrand"
      v-model:followed-only="followedOnly"
      :types="types"
      :slices="rubrics.slices"
      :other-rubrics="rubrics.others"
      :show-domain="canPickDomain"
    />

    <section class="ds-max dossiers__list" aria-label="Dossiers">
      <ListingResultBar
        :total="total"
        :unit="DOSSIER_UNIT"
        :overall="overall"
        :filters="filters"
        :context="context"
        @remove="removeFilter"
        @reset="resetFilters"
      />

      <div v-if="loadingFirst" class="dossiers__grid" aria-busy="true">
        <DsBox v-for="i in 6" :key="i" class="dossiers__ghost" />
      </div>

      <template v-else-if="results.length">
        <template v-if="view === 'grid'">
          <DossierFeature
            v-if="featured"
            :item="featured"
            :to="linkOf(featured)"
            :rubric="rubricOf(featured)"
            :following="following(featured)"
            :query="qInput"
            @follow="toggle(featured.slug)"
          />
          <div class="dossiers__grid">
            <DossierCard
              v-for="item in gridItems"
              :key="item.id"
              :item="item"
              :to="linkOf(item)"
              :rubric="rubricOf(item)"
              :following="following(item)"
              :query="qInput"
              @follow="toggle(item.slug)"
            />
          </div>
        </template>
        <DossiersTable
          v-else
          :items="results"
          :query="qInput"
          :link-of="linkOf"
          :rubric-of="rubricOf"
          :is-following="following"
          @follow="(item) => toggle(item.slug)"
        />

        <div v-if="hasMore" class="dossiers__more">
          <DsButton variant="secondary" :disabled="pending" @click="loadMore"
            >Afficher {{ moreCount }} de plus</DsButton
          >
        </div>
        <ListingEndLine v-else :total="total" :overall="overall" :unit="DOSSIER_UNIT" />
      </template>

      <ListingEmptyState
        v-else
        :filtered="anyFilter"
        :query="qInput"
        title="Aucun dossier ne correspond"
        empty-title="Aucun dossier ouvert pour le moment"
        :hint="
          followedOnly
            ? 'Vous ne suivez encore aucun dossier de ce type.'
            : 'Essayez un autre thème, type de contenu ou domaine.'
        "
        @reset="resetFilters"
      />

      <DossiersPublishBand />
    </section>
  </div>
</template>

<style scoped>
.dossiers {
  padding-bottom: 80px;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.dossiers :deep(.is-alt) {
  color: var(--ds-t2);
}
.dossiers__list {
  padding-top: 28px;
}
.dossiers__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 34px 26px;
}
@media (min-width: 621px) {
  .dossiers__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1041px) {
  .dossiers__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.dossiers__ghost {
  height: 460px;
  background: var(--ds-tint);
  animation: dossiers-pulse 1.4s var(--ds-e-balaye) infinite alternate;
}
@keyframes dossiers-pulse {
  to {
    opacity: 0.55;
  }
}
.dossiers__more {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
