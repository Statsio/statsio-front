<script setup lang="ts">
import { computed, ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingByline from '@/components/listing/tranches/ListingByline.vue'
import StatsDataFacts from './StatsDataFacts.vue'
import StatsDataFreshBadge from './StatsDataFreshBadge.vue'
import StatsDataVisual from './StatsDataVisual.vue'
import { formatCatalogViews } from '@/lib/catalog-format'
import { hasStatsDataVisual } from '@/lib/statsdata-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogItem } from '@/types/catalog'

/** Grande carte « À la une » en tête de grille (vue par défaut, sans filtre). */
const props = defineProps<{
  item: CatalogItem
  to: string
  rubric: RubricBadge | null
  favorited: boolean
}>()
const emit = defineEmits<{ favorite: [] }>()

const active = ref(false)
const withVisual = computed(() => hasStatsDataVisual(props.item))
</script>

<template>
  <DsBox
    as="article"
    interactive
    class="sdfeat"
    :class="{ 'sdfeat--noviz': !withVisual }"
    @pointerenter="active = true"
    @pointerleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <StatsDataVisual
      v-if="withVisual"
      :item="item"
      :to="to"
      :active="active"
      size="lg"
      class="sdfeat__viz"
    />
    <div class="sdfeat__tx">
      <div class="sdfeat__top">
        <DsLabel
          ><b>À la une</b><template v-if="rubric"> · {{ rubric.label }}</template></DsLabel
        >
        <StatsDataFreshBadge :item="item" />
      </div>
      <NuxtLink :to="to" class="sdfeat__t">
        <h2>{{ item.title }}</h2>
      </NuxtLink>
      <p v-if="item.description" class="sdfeat__ex">{{ item.description }}</p>
      <StatsDataFacts :item="item" />
      <div class="sdfeat__ft">
        <ListingByline :item="item" :meta="formatCatalogViews(item.views_count)" />
        <span class="sdfeat__actions">
          <DsButton :to="to" size="sm" tabindex="-1" aria-hidden="true">Explorer</DsButton>
          <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
        </span>
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.sdfeat {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 28px;
  overflow: hidden;
}
@media (min-width: 861px) {
  .sdfeat:not(.sdfeat--noviz) {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
}
.sdfeat__viz {
  border-bottom: 2px solid var(--ds-ol);
}
@media (min-width: 861px) {
  .sdfeat .sdfeat__viz {
    min-height: 300px;
    aspect-ratio: auto;
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.sdfeat__tx {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 26px;
}
.sdfeat__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.sdfeat__t {
  color: var(--ds-text);
  text-decoration: none;
}
.sdfeat__t h2 {
  margin: 0;
  font: 800 clamp(28px, 3vw, 42px) / 1 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
.sdfeat__t:hover h2 {
  color: var(--ds-link);
}
.sdfeat__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.sdfeat__ex {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 16px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.sdfeat__ft {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 2px solid var(--ds-divide);
}
.sdfeat__actions {
  display: flex;
  gap: 8px;
}
</style>
