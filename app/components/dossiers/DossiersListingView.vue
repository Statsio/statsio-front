<script setup lang="ts">
import { computed } from 'vue'
import { useDossiersCatalog } from '@/composables/useDossiersCatalog'
import { useDossierFollows } from '@/composables/useDossierFollows'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import CatalogHero from '@/components/listing/CatalogHero.vue'
import CatalogToolbar from '@/components/listing/CatalogToolbar.vue'
import CatalogSearchField from '@/components/listing/CatalogSearchField.vue'
import CatalogSortPills from '@/components/listing/CatalogSortPills.vue'
import CatalogChipRow from '@/components/listing/CatalogChipRow.vue'
import CatalogResultBar from '@/components/listing/CatalogResultBar.vue'
import CatalogEmpty from '@/components/listing/CatalogEmpty.vue'
import CatalogLoadMore from '@/components/listing/CatalogLoadMore.vue'
import CatalogCta from '@/components/listing/CatalogCta.vue'
import DossierCatalogCard from '@/components/dossiers/DossierCatalogCard.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import type { DossierCatalogSort } from '@/types/dossier'

defineProps<{
  title?: string
}>()

const basePath = useContentBasePath()

const {
  qInput,
  category,
  sort,
  pending,
  catalog,
  anyFilter,
  resetFilters,
  selectCategory,
  loadMore,
} = useDossiersCatalog()

const { isFollowing, toggle } = useDossierFollows()

const sortOptions: { value: DossierCatalogSort; label: string }[] = [
  { value: 'maj', label: 'Récemment mis à jour' },
  { value: 'count', label: 'Plus de contenus' },
  { value: 'az', label: 'Alphabétique' },
]

const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: 'Dossiers' },
])

const heroStats = computed(() => [
  { label: 'Dossiers suivis', value: formatCatalogCount(catalog.value.stats.dossiers) },
  { label: 'Contenus rassemblés', value: formatCatalogCount(catalog.value.stats.contents) },
  { label: 'Catégories couvertes', value: formatCatalogCount(catalog.value.stats.categories) },
  { label: 'Dernière mise à jour', value: formatRelativePublished(catalog.value.stats.last_updated_at) },
])

const categoryFacets = computed(() => catalog.value.facets.categories)

const countLine = computed(() => {
  const n = catalog.value.meta.total
  return `${n} dossier${n === 1 ? '' : 's'}`
})
const contextLine = computed(() => (anyFilter.value ? 'Filtres actifs' : 'Classés par mise à jour'))
const moreCount = computed(() =>
  Math.min(12, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)

const featured = computed(() => (anyFilter.value ? null : catalog.value.featured))
const featuredStyle = computed(() => catalogThemeStyle(featured.value?.category?.slug))
</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <CatalogHero
      :crumbs="crumbs"
      badge="DOSSIERS"
      kicker="TOUS LES CONTENUS D'UN SUJET, AU MÊME ENDROIT"
      :title="title"
      subtitle="Chaque dossier regroupe articles, statsdata et sondages publiés sur un même sujet, mis à jour au fil de l'actualité."
      hero-src="/brand/listings/dossiers-hero-light.png"
      :stats="heroStats"
    >
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else>
          Un sujet, <span class="text-primary">un fil</span>, toutes les <span class="text-accent">preuves</span>.
        </template>
      </template>
    </CatalogHero>

    <CatalogToolbar>
      <template #search>
        <CatalogSearchField v-model="qInput" placeholder="Rechercher un dossier…" />
      </template>
      <template #sort>
        <CatalogSortPills v-model="sort" :options="sortOptions" />
      </template>

      <div v-if="categoryFacets.length > 1" class="flex flex-wrap items-center gap-2.5">
        <CatalogChipRow
          class="min-w-0 flex-1"
          label="Catégorie"
          :model-value="category"
          :options="categoryFacets"
          @update:model-value="selectCategory"
        />
        <span class="flex-1" />
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
        <div v-for="i in 6" :key="i" class="h-64 animate-pulse rounded-[18px] bg-white" />
      </div>

      <template v-else-if="catalog.meta.total > 0">
        <NuxtLink
          v-if="featured"
          :to="`/dossiers/${featured.slug}`"
          class="group mb-[22px] grid overflow-hidden rounded-[22px] border-[1.5px] border-slate-950/[0.06] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:border-[#c4b5fd] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
        >
          <span class="relative block min-h-[240px]">
            <AppMediaImage :src="featured.image_url" :alt="featured.name" class="absolute inset-0" />
            <span
              v-if="featured.category"
              class="absolute left-5 top-5 rounded-md bg-white px-2.5 py-[5px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
              :style="{ color: featuredStyle.fg }"
            >
              {{ featured.category.label }}
            </span>
          </span>
          <span class="flex flex-col p-8">
            <span class="w-fit rounded-[5px] bg-slate-950 px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white">
              Dossier suivi
            </span>
            <span class="mt-4 block text-[28px] font-extrabold leading-[1.14] tracking-[-0.025em] text-slate-950 text-pretty">
              {{ featured.name }}
            </span>
            <span v-if="featured.description" class="mt-3.5 block max-w-[52ch] text-[15px] leading-[1.62] text-slate-950/60">
              {{ featured.description }}
            </span>
            <span class="mt-5 flex items-center gap-6 border-t border-slate-950/[0.08] pt-4">
              <span>
                <span class="block font-mono text-base font-semibold text-slate-950">{{ featured.content_count }}</span>
                <span class="mt-0.5 block text-[10.5px] text-slate-950/50">contenus</span>
              </span>
              <span>
                <span class="block font-mono text-base font-semibold text-slate-950">{{ formatRelativePublished(featured.updated_at) }}</span>
                <span class="mt-0.5 block text-[10.5px] text-slate-950/50">dernière mise à jour</span>
              </span>
            </span>
            <span class="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white">
              OUVRIR LE DOSSIER →
            </span>
          </span>
        </NuxtLink>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DossierCatalogCard
            v-for="item in catalog.data"
            :key="item.id"
            :item="item"
            :following="isFollowing(item.slug)"
            @follow="toggle(item.slug)"
          />
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
        title="Aucun dossier ne correspond"
        :subtitle="qInput ? `Aucun résultat pour « ${qInput} ».` : 'Essayez une autre recherche ou une autre catégorie.'"
        @reset="resetFilters"
      />

      <CatalogCta
        title="Un sujet mérite son dossier ?"
        subtitle="Publiez vos articles, statsdata et consultations depuis le studio : rangez-les dans un dossier pour que vos lecteurs suivent le fil."
        primary-to="/studio"
        primary-label="Ouvrir le studio"
        secondary-to="/about"
        secondary-label="Comment ça marche"
      />
    </div>
  </div>
</template>
