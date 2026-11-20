<script setup lang="ts">
import { computed, ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ListingByline from '@/components/listing/tranches/ListingByline.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingSubBrand from '@/components/listing/tranches/ListingSubBrand.vue'
import SurveyCta from './SurveyCta.vue'
import SurveyIdentityBadge from './SurveyIdentityBadge.vue'
import SurveyKindTag from './SurveyKindTag.vue'
import SurveyStatusBadge from './SurveyStatusBadge.vue'
import SurveyVisual from './SurveyVisual.vue'
import { surveyState } from '@/lib/surveys-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogItem } from '@/types/catalog'

/**
 * Carte de consultation de la grille : miniature (l'état de la consultation
 * apparaît au survol ou au focus), type + thème, statut, titre (seul lien
 * focalisable), identité vérifiée / sous-marque, éditeur + clôture, action, favori.
 */
const props = defineProps<{
  item: CatalogItem
  to: string
  rubric: RubricBadge | null
  favorited: boolean
  query?: string
}>()
const emit = defineEmits<{ favorite: [] }>()

const active = ref(false)
const state = computed(() => surveyState(props.item))
</script>

<template>
  <DsBox
    as="article"
    interactive
    class="svtile"
    @pointerenter="active = true"
    @pointerleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <SurveyVisual :item="item" :to="to" :active="active" class="svtile__viz">
      <span v-if="item.is_featured" class="svtile__une">À la une</span>
    </SurveyVisual>

    <div class="svtile__bd">
      <div class="svtile__top">
        <SurveyKindTag :item="item" :rubric="rubric" />
        <SurveyStatusBadge :open="state.open" />
      </div>
      <NuxtLink :to="to" class="svtile__t">
        <h3><DsHighlight :text="item.title" :query="query" /></h3>
      </NuxtLink>
      <span class="svtile__flags">
        <SurveyIdentityBadge v-if="item.requires_identity_verification" />
        <ListingSubBrand :item="item" />
      </span>
      <div class="svtile__ft">
        <ListingByline :item="item" :meta="state.closing" :query="query" />
        <span class="svtile__actions">
          <SurveyCta :item="item" :to="to" :state="state" />
          <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
        </span>
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.svtile {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.svtile__viz {
  border-bottom: 2px solid var(--ds-ol);
}
.svtile__une {
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
.svtile__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
}
.svtile__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.svtile__t {
  color: var(--ds-text);
  text-decoration: none;
}
.svtile__t h3 {
  margin: 0;
  font: 700 18px/1.28 var(--ds-ui);
  text-wrap: pretty;
}
.svtile__t:hover h3 {
  color: var(--ds-link);
}
.svtile__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.svtile__flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.svtile__flags:empty {
  display: none;
}
.svtile__ft {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
}
.svtile__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
