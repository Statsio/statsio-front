<script setup lang="ts">
import { computed, ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import ListingByline from '@/components/listing/tranches/ListingByline.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import SurveyCta from './SurveyCta.vue'
import SurveyIdentityBadge from './SurveyIdentityBadge.vue'
import SurveyStatusBadge from './SurveyStatusBadge.vue'
import SurveyVisual from './SurveyVisual.vue'
import { plural, surveyKindOf, surveyState } from '@/lib/surveys-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Grande carte « À la une » (vue par défaut, sans filtre), en version sombre :
 * les tokens de la charte sont redéfinis localement, les primitives suivent.
 */
const props = defineProps<{ item: CatalogItem; to: string; favorited: boolean }>()
const emit = defineEmits<{ favorite: [] }>()

const active = ref(false)
const state = computed(() => surveyState(props.item))
const kind = computed(() => surveyKindOf(props.item))
</script>

<template>
  <DsBox
    as="article"
    interactive
    class="svfeat"
    @pointerenter="active = true"
    @pointerleave="active = false"
    @focusin="active = true"
    @focusout="active = false"
  >
    <SurveyVisual :item="item" :to="to" :active="active" size="lg" class="svfeat__viz" />
    <div class="svfeat__tx">
      <div class="svfeat__top">
        <DsLabel><b>À la une</b> · {{ kind.label }}</DsLabel>
        <span class="svfeat__badges">
          <SurveyStatusBadge :open="state.open" />
          <SurveyIdentityBadge v-if="item.requires_identity_verification" />
        </span>
      </div>
      <NuxtLink :to="to" class="svfeat__t">
        <h2>{{ item.title }}</h2>
      </NuxtLink>
      <p v-if="item.description" class="svfeat__ex">{{ item.description }}</p>
      <span class="svfeat__facts">
        <b>{{ plural(item.responses_count ?? 0, kind.unit) }}</b>
        <span>{{ state.closing }}</span>
        <span>Résultats publics</span>
      </span>
      <div class="svfeat__ft">
        <ListingByline :item="item" :meta="state.closing" />
        <span class="svfeat__actions">
          <SurveyCta :item="item" :to="to" :state="state" />
          <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
        </span>
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.svfeat {
  --ds-text: #f1f0f6;
  --ds-muted: #c9c4d8;
  --ds-faint: #b2adc2;
  --ds-surface: #1b1530;
  --ds-tint: #251d3d;
  --ds-divide: #4a3d70;
  --ds-accent: #c4b5fd;
  --ds-link: #c4b5fd;
  --ds-ol: #c4b5fd;
  --ds-ok: #34d399;
  --ds-action: #c4b5fd;
  --ds-action-ink: #0f0e14;
  --ds-action-wipe: #93c5fd;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 28px;
  overflow: hidden;
  border-color: var(--ds-violet-700);
  box-shadow: 5px 5px 0 var(--ds-sh2);
}
@media (min-width: 861px) {
  .svfeat {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
}
.svfeat .svfeat__viz {
  border-bottom: 2px solid var(--ds-ol);
}
@media (min-width: 861px) {
  .svfeat .svfeat__viz {
    min-height: 300px;
    aspect-ratio: auto;
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.svfeat__tx {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 26px;
}
.svfeat__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.svfeat__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.svfeat__t {
  color: var(--ds-text);
  text-decoration: none;
}
.svfeat__t h2 {
  margin: 0;
  font: 800 clamp(28px, 3vw, 42px) / 1 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
.svfeat__t:hover h2 {
  color: var(--ds-link);
}
.svfeat__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.svfeat__ex {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 16px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.svfeat__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.svfeat__facts b {
  color: var(--ds-text);
  font-weight: 500;
}
.svfeat__ft {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 2px solid var(--ds-divide);
}
.svfeat__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
