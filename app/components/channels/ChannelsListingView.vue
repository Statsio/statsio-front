<script setup lang="ts">
import { computed } from 'vue'
import { useChannelsCatalog } from '@/composables/useChannelsCatalog'
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
import ChannelCatalogCard from '@/components/channels/ChannelCatalogCard.vue'
import ChannelCatalogRow from '@/components/channels/ChannelCatalogRow.vue'
import type { ChannelCatalogSort } from '@/types/channel-catalog'

const {
  qInput,
  kind,
  theme,
  pace,
  sort,
  view,
  verifiedOnly,
  followedOnly,
  pending,
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
} = useChannelsCatalog()

const sortOptions: { value: ChannelCatalogSort; label: string }[] = [
  { value: 'trend', label: 'Tendance' },
  { value: 'recent', label: 'Récentes' },
  { value: 'followers', label: 'Les plus suivies' },
]

const crumbs = [
  { label: 'Accueil', to: '/' },
  { label: 'Communauté', to: '/chaines' },
  { label: 'Chaînes' },
]

const heroStats = computed(() => [
  { label: 'Chaînes actives', value: formatCatalogCount(catalog.value.stats.active) },
  { label: 'Chaînes vérifiées', value: formatCatalogCount(catalog.value.stats.verified) },
  { label: 'Publications / mois', value: formatCatalogCount(catalog.value.stats.publications_month) },
  { label: 'Nouvelle chaîne', value: formatRelativePublished(catalog.value.stats.last_channel_at) },
])

const countLine = computed(
  () => `${catalog.value.meta.total} chaîne${catalog.value.meta.total > 1 ? 's' : ''} · ${catalog.value.meta.shown} affichée${catalog.value.meta.shown > 1 ? 's' : ''}`,
)
const contextLine = computed(() =>
  anyFilter.value ? 'Filtres actifs' : 'Classées par tendance sur 30 jours',
)
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)

function onSelectTag(tag: string) {
  qInput.value = tag
}
</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <CatalogHero
      :crumbs="crumbs"
      badge="CHAÎNES"
      badge-class="!border-[#dccaf8] !bg-[#f2ecfd] !text-[#7c3aed]"
      kicker="RÉDACTIONS · INSTITUTIONS · ANALYSTES INDÉPENDANTS"
      subtitle="Chaque chaîne publie ses Statsdata, ses articles et ses consultations. Abonnez-vous pour recevoir ses parutions dans votre fil."
      hero-src="/brand/listings/chaines-hero-light.png"
      :stats="heroStats"
    >
      <template #title>
        Suivez celles et ceux qui <span class="text-primary">font parler</span> les
        <span class="text-accent">données</span>.
      </template>
    </CatalogHero>

    <CatalogToolbar>
      <template #search>
        <CatalogSearchField v-model="qInput" placeholder="Rechercher une chaîne, une rédaction, un analyste…" />
      </template>
      <template #sort>
        <CatalogSortPills v-model="sort" :options="sortOptions" />
      </template>
      <template #view>
        <CatalogViewToggle v-model="view" />
      </template>

      <CatalogChipRow
        label="Type"
        :model-value="kind"
        :options="catalog.facets.kinds"
        @update:model-value="selectKind"
      />

      <CatalogChipRow
        v-if="catalog.facets.themes.length > 1"
        label="Thème"
        :model-value="theme"
        :options="catalog.facets.themes"
        @update:model-value="selectTheme"
      />

      <div class="flex flex-wrap items-center gap-2.5">
        <CatalogChipRow
          class="min-w-0"
          label="Activité"
          variant="mono"
          :model-value="pace"
          :options="catalog.facets.paces"
          @update:model-value="selectPace"
        />
        <span class="flex-1" />
        <CatalogToggleChip v-model="verifiedOnly" label="Chaînes vérifiées" />
        <CatalogToggleChip v-model="followedOnly" label="Mes abonnements" />
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
        <div v-for="i in 6" :key="i" class="h-72 animate-pulse rounded-[18px] bg-white" />
      </div>

      <template v-else-if="catalog.meta.total > 0">
        <div v-if="view === 'grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ChannelCatalogCard
            v-for="item in catalog.data"
            :key="item.id"
            :item="item"
            :following="isFollowing(item)"
            :followers="followersOf(item)"
            @follow="toggleItemFollow(item)"
            @select-tag="onSelectTag"
          />
        </div>

        <div v-else class="overflow-x-auto rounded-[18px] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
          <div
            class="grid min-w-[720px] grid-cols-[minmax(0,2.4fr)_1fr_0.8fr_0.8fr_0.9fr_108px] gap-3.5 bg-[#faf9fd] px-5 py-3"
          >
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Chaîne</div>
            <div class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Type</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Abonnés</div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">
              Publications
            </div>
            <div class="text-right text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Rythme</div>
            <div />
          </div>
          <div class="min-w-[720px]">
            <ChannelCatalogRow
              v-for="item in catalog.data"
              :key="item.id"
              :item="item"
              :following="isFollowing(item)"
              :followers="followersOf(item)"
              @follow="toggleItemFollow(item)"
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
        title="Aucune chaîne ne correspond"
        :subtitle="qInput ? `Aucun résultat pour « ${qInput} » avec ces filtres.` : 'Essayez un autre type, thème ou rythme de publication.'"
        @reset="resetFilters"
      />

      <CatalogCta
        title="Ouvrez votre chaîne en quelques minutes"
        subtitle="Un espace public pour vos jeux de données, vos articles et vos consultations — avec statistiques d’audience et vérification du compte."
        primary-to="/studio"
        primary-label="Créer ma chaîne"
        secondary-to="/about"
        secondary-label="Charte éditoriale"
      />
    </div>
  </div>
</template>
