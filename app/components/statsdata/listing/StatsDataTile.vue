<script setup lang="ts">
import { ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingRubricTag from '@/components/listing/tranches/ListingRubricTag.vue'
import ListingByline from '@/components/listing/tranches/ListingByline.vue'
import StatsDataFacts from './StatsDataFacts.vue'
import StatsDataFreshBadge from './StatsDataFreshBadge.vue'
import ListingSubBrand from '@/components/listing/tranches/ListingSubBrand.vue'
import StatsDataVisual from './StatsDataVisual.vue'
import { formatCatalogViews } from '@/lib/catalog-format'
import { hasStatsDataVisual } from '@/lib/statsdata-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogItem } from '@/types/catalog'

/**
 * Carte StatsData de la grille : miniature (le graphique lié apparaît au survol ou
 * au focus de la carte), rubrique + fraîcheur, titre (seul lien focalisable),
 * chiffres, éditeur et favori.
 */
defineProps<{
  item: CatalogItem
  to: string
  rubric: RubricBadge | null
  favorited: boolean
  query?: string
}>()
const emit = defineEmits<{ favorite: [] }>()

const active = ref(false)
</script>

<template>
  <DsBox
    as="article"
    interactive
    class="sdtile"
    @pointerenter="active = true"
    @pointerleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <StatsDataVisual
      v-if="hasStatsDataVisual(item)"
      :item="item"
      :to="to"
      :active="active"
      class="sdtile__viz"
    >
      <span v-if="item.is_featured" class="sdtile__une">À la une</span>
    </StatsDataVisual>

    <div class="sdtile__bd">
      <div class="sdtile__top">
        <ListingRubricTag :rubric="rubric" />
        <StatsDataFreshBadge :item="item" />
      </div>
      <NuxtLink :to="to" class="sdtile__t">
        <h3><DsHighlight :text="item.title" :query="query" /></h3>
      </NuxtLink>
      <StatsDataFacts :item="item" />
      <ListingSubBrand :item="item" />
      <div class="sdtile__ft">
        <ListingByline :item="item" :meta="formatCatalogViews(item.views_count)" :query="query" />
        <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.sdtile {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sdtile__viz {
  border-bottom: 2px solid var(--ds-ol);
}
.sdtile__une {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 8px;
  border: 2px solid #fff;
  border-radius: 2px;
  background: var(--ds-violet-700);
  color: #fff;
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.sdtile__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
}
.sdtile__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.sdtile__t {
  color: var(--ds-text);
  text-decoration: none;
}
.sdtile__t h3 {
  margin: 0;
  font: 700 18px/1.28 var(--ds-ui);
  text-wrap: pretty;
}
.sdtile__t:hover h3 {
  color: var(--ds-link);
}
.sdtile__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.sdtile__ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
}
</style>
