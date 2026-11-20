<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingHero from '@/components/listing/tranches/ListingHero.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import ChannelsListingToolbar from '@/components/channels/listing/ChannelsListingToolbar.vue'
import ChannelOfTheMonth from '@/components/channels/listing/ChannelOfTheMonth.vue'
import ChannelTile from '@/components/channels/listing/ChannelTile.vue'
import ChannelsTable from '@/components/channels/listing/ChannelsTable.vue'
import ChannelsCreateBand from '@/components/channels/listing/ChannelsCreateBand.vue'
import { useChannelsCatalog } from '@/composables/useChannelsCatalog'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { publicChannelPath } from '@/lib/content-display'
import { buildRubricSlices, rubricLabel } from '@/lib/listing-rubrics'
import {
  CHANNEL_KINDS,
  CHANNEL_PACES,
  channelActiveFilters,
  channelKindCaption,
  channelKindPie,
  channelSortContext,
  segmentOptions,
  type ChannelFilterKey,
} from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/**
 * Listing des chaînes (Statsio, TVStats, Medistats) — charte « Tranches ».
 * Orchestration seule : recherche, type, thème, rythme, vérifiées, abonnements,
 * tri, vue, pagination et abonnement vivent dans `useChannelsCatalog` (reflétés
 * dans l'URL) ; la présentation est dans `lib/channels-listing.ts`.
 */
const props = defineProps<{
  /** titre imposé par une sous-marque */
  title?: string
}>()

const UNIT = { one: 'chaîne', many: 'chaînes' }

const basePath = useContentBasePath()
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

/* ── filtres ── */
const kinds = computed(() => segmentOptions(catalog.value.facets.kinds, CHANNEL_KINDS, kind.value))
const paces = computed(() => segmentOptions(catalog.value.facets.paces, CHANNEL_PACES, pace.value))
// les facettes de thèmes portent déjà leur libellé : pas de table de noms
const themes = computed(() => buildRubricSlices(catalog.value.facets.themes, {}))
const themeLabel = (slug: string) =>
  rubricLabel(slug, {}, catalog.value.facets.themes.find((f) => f.value === slug)?.label)
const linkOf = (item: Pick<ChannelCatalogItem, 'handle'>) =>
  publicChannelPath(item.handle, basePath.value)

/* ── hero : chiffres + camembert des types ──
   Figé pendant une recherche (même objet → DsPie ne rejoue pas son animation). */
let lastHeroKinds = catalog.value.facets.kinds
const heroKinds = computed(() => {
  if (!qInput.value.trim()) lastHeroKinds = catalog.value.facets.kinds
  return lastHeroKinds
})
const heroPie = computed(() => channelKindPie(heroKinds.value))
const heroPieLabel = computed(
  () =>
    `Répartition des chaînes par type : ${heroPie.value.map((s) => `${s.label} ${s.value}`).join(', ')}`,
)
const heroCaption = computed(() => channelKindCaption(heroKinds.value))
const heroStats = computed(() => [
  { label: 'Chaînes actives', value: formatCatalogCount(catalog.value.stats.active) },
  { label: 'Chaînes vérifiées', value: formatCatalogCount(catalog.value.stats.verified) },
  {
    label: 'Parutions sur 30 j',
    value: formatCatalogCount(catalog.value.stats.publications_month),
  },
  {
    label: 'Nouvelle chaîne',
    value: formatRelativePublished(catalog.value.stats.last_channel_at),
    small: true,
  },
])
const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: props.title ?? 'Chaînes' },
])

/* ── résultats ── */
const filters = computed(() =>
  channelActiveFilters(
    {
      q: qInput.value,
      kind: kind.value,
      theme: theme.value,
      pace: pace.value,
      verified: verifiedOnly.value,
      followed: followedOnly.value,
    },
    themeLabel,
  ),
)
const context = computed(
  () => channelSortContext(sort.value) + (view.value === 'list' ? ' · vue liste' : ''),
)

function removeFilter(key: ChannelFilterKey) {
  if (key === 'q') qInput.value = ''
  else if (key === 'kind') selectKind('')
  else if (key === 'theme') selectTheme('')
  else if (key === 'pace') selectPace('')
  else if (key === 'verified') verifiedOnly.value = false
  else followedOnly.value = false
}

/** Un mot-clé cliqué devient la recherche. */
function searchTag(tag: string) {
  qInput.value = tag
}

const featured = computed(() =>
  view.value === 'grid' && !anyFilter.value && sort.value === 'trend'
    ? catalog.value.featured
    : null,
)
const gridItems = computed(() =>
  catalog.value.data.filter((item) => item.id !== featured.value?.id),
)
const moreCount = computed(() =>
  Math.min(6, Math.max(0, catalog.value.meta.total - catalog.value.meta.shown)),
)
const loadingFirst = computed(() => pending.value && !catalog.value.data.length)
const emptyHint = computed(() =>
  followedOnly.value && !qInput.value.trim()
    ? "Vous n'êtes abonné à aucune chaîne avec ces filtres."
    : 'Essayez un autre type, thème ou rythme de publication.',
)
</script>

<template>
  <div class="ds-scope channels">
    <ListingHero
      :crumbs="crumbs"
      lede="Chaque chaîne publie ses StatsData, ses articles et ses consultations. Abonnez-vous pour recevoir ses parutions dans votre fil."
      :stats="heroStats"
      :pie="heroPie"
      :pie-label="heroPieLabel"
      :caption="heroCaption"
    >
      <template #label>Chaînes · <b>rédactions, institutions, analystes indépendants</b></template>
      <template #title>
        <template v-if="title">{{ title }}</template>
        <template v-else
          >Suivez celles et ceux qui <em>font parler</em> les
          <span class="is-alt">données.</span></template
        >
      </template>
    </ListingHero>

    <ChannelsListingToolbar
      v-model:q="qInput"
      v-model:sort="sort"
      v-model:view="view"
      v-model:verified="verifiedOnly"
      v-model:followed="followedOnly"
      :kind="kind"
      :theme="theme"
      :pace="pace"
      :kinds="kinds"
      :paces="paces"
      :slices="themes.slices"
      :other-themes="themes.others"
      @update:kind="selectKind"
      @update:theme="selectTheme"
      @update:pace="selectPace"
    />

    <section class="ds-max channels__list" aria-label="Chaînes">
      <ListingResultBar
        :total="catalog.meta.total"
        :unit="UNIT"
        :overall="anyFilter ? catalog.stats.active : null"
        :filters="filters"
        :context="context"
        @remove="removeFilter"
        @reset="resetFilters"
      />

      <div v-if="loadingFirst" class="channels__grid" aria-busy="true">
        <DsBox v-for="i in 6" :key="i" shadow="sm" class="channels__ghost" />
      </div>

      <template v-else-if="catalog.data.length">
        <template v-if="view === 'grid'">
          <ChannelOfTheMonth
            v-if="featured"
            :item="featured"
            :to="linkOf(featured)"
            :following="isFollowing(featured)"
            :followers="followersOf(featured)"
            @follow="toggleItemFollow(featured)"
          />
          <div class="channels__grid">
            <ChannelTile
              v-for="item in gridItems"
              :key="item.id"
              :item="item"
              :to="linkOf(item)"
              :following="isFollowing(item)"
              :followers="followersOf(item)"
              :query="qInput"
              @follow="toggleItemFollow(item)"
              @tag="searchTag"
            />
          </div>
        </template>
        <ChannelsTable
          v-else
          :items="catalog.data"
          :query="qInput"
          :link-of="linkOf"
          :theme-label="themeLabel"
          :is-following="isFollowing"
          :followers-of="followersOf"
          @follow="toggleItemFollow"
        />

        <div v-if="catalog.meta.has_more" class="channels__more">
          <DsButton variant="secondary" :disabled="pending" @click="loadMore"
            >Afficher {{ moreCount }} de plus</DsButton
          >
        </div>
        <ListingEndLine
          v-else
          :total="catalog.meta.total"
          :overall="anyFilter ? catalog.stats.active : null"
          :unit="UNIT"
          feminine
        />
      </template>

      <ListingEmptyState
        v-else
        :filtered="anyFilter"
        :query="qInput"
        title="Aucune chaîne ne correspond"
        empty-title="Aucune chaîne active pour le moment"
        :hint="emptyHint"
        @reset="resetFilters"
      />

      <ChannelsCreateBand />
    </section>
  </div>
</template>

<style scoped>
.channels {
  padding-bottom: 80px;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.channels :deep(.is-alt) {
  color: var(--ds-t2);
}
.channels__list {
  padding-top: 28px;
}
.channels__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 26px;
}
@media (min-width: 621px) {
  .channels__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1041px) {
  .channels__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.channels__ghost {
  height: 460px;
  background: var(--ds-tint);
  animation: channels-pulse 1.4s var(--ds-e-balaye) infinite alternate;
}
@keyframes channels-pulse {
  to {
    opacity: 0.55;
  }
}
.channels__more {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
