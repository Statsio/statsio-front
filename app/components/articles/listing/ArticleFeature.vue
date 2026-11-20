<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import ArticleByline from './ArticleByline.vue'
import ArticleDataBadge from './ArticleDataBadge.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingRubricTag from '@/components/listing/tranches/ListingRubricTag.vue'
import { formatCatalogViews } from '@/lib/catalog-format'
import type { RubricBadge } from '@/lib/articles-listing'
import type { CatalogItem } from '@/types/catalog'

/** Grande carte « À la une » en tête de grille (vue par défaut, sans filtre). */
const props = defineProps<{
  item: CatalogItem
  to: string
  rubric: RubricBadge | null
  favorited: boolean
}>()
const emit = defineEmits<{ favorite: [] }>()

const stats = computed(() => {
  const charts = props.item.charts_count
  const parts = [formatCatalogViews(props.item.views_count)]
  if (charts)
    parts.push(`${charts} graphique${charts > 1 ? 's' : ''} intégré${charts > 1 ? 's' : ''}`)
  return parts.join(' · ')
})
</script>

<template>
  <DsBox as="article" interactive class="feat" :class="{ 'feat--noimg': !item.thumbnail_url }">
    <NuxtLink v-if="item.thumbnail_url" :to="to" class="feat__im" tabindex="-1" aria-hidden="true">
      <AppMediaImage :src="item.thumbnail_url" alt="" class="feat__img" />
      <span class="feat__une">À la une</span>
    </NuxtLink>
    <div class="feat__tx">
      <div class="feat__top">
        <span v-if="!item.thumbnail_url" class="feat__une feat__une--inline">À la une</span>
        <ListingRubricTag :rubric="rubric" :format="item.format" />
        <ArticleDataBadge :count="item.linked_datasets_count" />
      </div>
      <NuxtLink :to="to" class="feat__t">
        <h2>{{ item.title }}</h2>
      </NuxtLink>
      <p v-if="item.description" class="feat__ex">{{ item.description }}</p>
      <span class="feat__stats">{{ stats }}</span>
      <div class="feat__ft">
        <ArticleByline :item="item" />
        <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.feat {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 28px;
  overflow: hidden;
}
@media (min-width: 861px) {
  .feat:not(.feat--noimg) {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
}
.feat__im {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
@media (min-width: 861px) {
  .feat__im {
    min-height: 300px;
    aspect-ratio: auto;
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.feat__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.feat__une {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 7px 9px;
  border: 2px solid #fff;
  border-radius: 2px;
  background: var(--ds-violet-700);
  color: #fff;
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.feat__une--inline {
  position: static;
  border-color: var(--ds-violet-700);
}
.feat__tx {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 26px;
}
.feat__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.feat__t {
  color: var(--ds-text);
  text-decoration: none;
}
.feat__t h2 {
  margin: 0;
  font: 800 clamp(28px, 3vw, 42px) / 1 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
.feat__t:hover h2 {
  color: var(--ds-link);
}
.feat__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.feat__ex {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 16px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.feat__stats {
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.feat__ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 2px solid var(--ds-divide);
}
</style>
