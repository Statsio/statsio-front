<script setup lang="ts">
import { computed } from 'vue'
import { usePublicCatalog } from '@/composables/usePublicCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { SURVEY_KIND_META } from '@/lib/poll-visuals'
import type { CatalogFacet, SurveyKind, SurveyStatusFilter } from '@/types/catalog'
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
import SurveyCard from '@/components/content/SurveyCard.vue'

const props = defineProps<{
  categories?: string[]
  title?: string
}>()

const basePath = useContentBasePath()
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
} = usePublicCatalog({
  type: 'survey',
  brandCategories: props.categories,
  key: `surveys-catalog-${(props.categories ?? []).join(',')}`,
})

const sortOptions: { value: 'trend' | 'recent' | 'votes'; label: string }[] = [
  { value: 'trend', label: 'Tendance' },
  { value: 'recent', label: 'Récents' },
  { value: 'votes', label: 'Les plus suivis' },
]

const statusOptions: { value: SurveyStatusFilter | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'ouvert', label: 'Ouverts' },
  { value: 'clos', label: 'Clos' },
]

const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: 'Sondages' },
])

const heroStats = computed(() => [
  { label: 'Consultations ouvertes', value: formatCatalogCount(catalog.value.stats.published) },
  { label: 'Chaînes éditrices', value: formatCatalogCount(catalog.value.stats.channels) },
  { label: 'Pétitions actives', value: formatCatalogCount(catalog.value.stats.charts) },
  { label: 'Dernière publication', value: formatRelativePublished(catalog.value.stats.last_published_at) },
])

const kindFacets = computed<CatalogFacet[]>(() => {
  const fromApi = catalog.value.facets.survey_kinds
  if (fromApi?.length) return fromApi
  return [
    { value: '', label: 'Tous', count: 0 },
    ...(Object.keys(SURVEY_KIND_META) as SurveyKind[]).map((k) => ({
      value: k,
      label: SURVEY_KIND_META[k].label,
      count: 0,
    })),
  ]
})
const categoryFacets = computed(() => catalog.value.facets.categories)

const countLine = computed(
  () => `${catalog.value.meta.total} consultation${catalog.value.meta.total > 1 ? 's' : ''} · ${catalog.value.meta.shown} affichée${catalog.value.meta.shown > 1 ? 's' : ''}`,
)
const contextLine = computed(() => (anyFilter.value ? 'Filtres actifs' : 'Classées par tendance'))
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const showFeatured = computed(
  () => view.value === 'grid' && !anyFilter.value && Boolean(catalog.value.featured),
)
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
      badge="CONSULTATIONS"
      badge-class="!border-[#f8ccd6] !bg-[#fdeef1] !text-[#be123c]"
      kicker="SONDAGES RAPIDES · QUESTIONNAIRES · PÉTITIONS"
      :title="title"
      subtitle="Un vote en un clic, un questionnaire complet ou une pétition à signer — trois formats de consultation, des résultats publics et exportables."
      hero-src="/brand/listings/sondages-hero-light.png"
      :stats="heroStats"
    >
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else>
          Ce que <span class="text-primary">pensent les lecteurs</span>, <span class="text-accent">chiffre à l’appui</span>.
        </template>
      </template>
    </CatalogHero>

    <CatalogToolbar>
      <template #search>
        <CatalogSearchField v-model="qInput" placeholder="Rechercher un sondage, une pétition, une chaîne…" />
      </template>
      <template #sort>
        <CatalogSortPills v-model="sort" :options="sortOptions" />
      </template>
      <template #view>
        <CatalogViewToggle v-model="view" />
      </template>

      <CatalogChipRow
        label="Type"
        :model-value="surveyKind"
        :options="kindFacets"
        @update:model-value="(v) => selectSurveyKind(v as SurveyKind | '')"
      />

      <CatalogChipRow
        v-if="categoryFacets.length > 1"
        label="Thème"
        :model-value="category"
        :options="categoryFacets"
        @update:model-value="selectCategory"
      />

      <div class="flex flex-wrap items-center gap-2.5">
        <span class="shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">Statut</span>
        <button
          v-for="opt in statusOptions"
          :key="opt.value || 'all'"
          type="button"
          class="rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.03em] transition"
          :class="surveyStatus === opt.value
            ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary'
            : 'border-slate-200 bg-white text-slate-500 hover:border-[#c4b5fd] hover:text-primary'"
          @click="selectSurveyStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
        <span class="flex-1" />
        <CatalogToggleChip :model-value="notParticipated" label="Pas encore participé" @update:model-value="notParticipated = $event" />
        <button
          v-if="anyFilter"
          type="button"
          class="shrink-0 rounded-full border-[1.5px] border-slate-200 px-3.5 py-[7px] text-xs font-bold text-slate-500 transition hover:border-[#c4b5fd] hover:text-primary"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>
    </CatalogToolbar>

    <div class="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:pb-[90px] lg:pt-[26px]">
      <CatalogResultBar :count-line="countLine" :context-line="contextLine" />

      <div v-if="pending && !catalog.data.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-80 animate-pulse rounded-[18px] bg-white" />
      </div>

      <template v-else-if="catalog.meta.total > 0">
        <SurveyCard v-if="showFeatured && catalog.featured" :item="catalog.featured" format="row" feature tone="dark" class="mb-[22px]" />

        <div v-if="view === 'grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SurveyCard
            v-for="item in gridItems"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
          />
        </div>

        <div v-else class="overflow-x-auto rounded-[18px] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
          <div class="grid min-w-[720px] grid-cols-[minmax(0,2.5fr)_1.05fr_1fr_0.8fr_0.8fr_46px] gap-3.5 bg-[#faf9fd] px-5 py-3">
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Consultation</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Type</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Publié par</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Participation</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Clôture</div>
            <div />
          </div>
          <div class="min-w-[720px]">
            <SurveyCard
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
        title="Aucune consultation ne correspond"
        :subtitle="qInput ? `Aucun résultat pour « ${qInput} » avec ces filtres.` : 'Essayez un autre type, thème ou statut.'"
        @reset="resetFilters"
      />

      <CatalogCta
        title="Consultez votre audience, à votre échelle"
        subtitle="Un vote express, un questionnaire à plusieurs volets ou une pétition avec objectif de signatures — et l’export des réponses en CSV."
        primary-to="/studio"
        primary-label="Créer une consultation"
        secondary-to="/about"
        secondary-label="Bonnes pratiques"
      />
    </div>
  </div>
</template>
