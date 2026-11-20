<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import ArticleByline from './ArticleByline.vue'
import ArticleDataBadge from './ArticleDataBadge.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingRubricTag from '@/components/listing/tranches/ListingRubricTag.vue'
import { formatCatalogViews } from '@/lib/catalog-format'
import { resolveContentSubBrand } from '@/lib/content-subbrand'
import { useContentDomain } from '@/composables/useContentDomain'
import type { RubricBadge } from '@/lib/articles-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Carte d'article de la grille. Le titre est le seul lien focalisable ; l'image
 * duplique le lien pour la souris (hors tabulation). Sans image de couverture,
 * le bloc visuel est masqué (pas de visuel de substitution).
 */
const props = defineProps<{
  item: CatalogItem
  to: string
  rubric: RubricBadge | null
  favorited: boolean
  query?: string
}>()
const emit = defineEmits<{ favorite: [] }>()

const domain = useContentDomain()
/** « Publié sur TVStats / Medistats » : seulement depuis Statsio. */
const subBrand = computed(() =>
  domain.value === 'statsio'
    ? resolveContentSubBrand(props.item.categories, props.item.sub_brand)
    : null,
)
const pinned = computed(() => Boolean(props.item.is_featured))
const stats = computed(() => {
  const charts = props.item.charts_count
  const parts = [formatCatalogViews(props.item.views_count)]
  if (charts) parts.push(`${charts} graphique${charts > 1 ? 's' : ''}`)
  return parts.join(' · ')
})
</script>

<template>
  <DsBox as="article" interactive class="tile">
    <NuxtLink v-if="item.thumbnail_url" :to="to" class="tile__im" tabindex="-1" aria-hidden="true">
      <AppMediaImage :src="item.thumbnail_url" alt="" class="tile__img" loading="lazy" />
      <span v-if="pinned" class="tile__une">À la une</span>
      <span v-if="subBrand" class="tile__sub">
        <img :src="subBrand.logo" alt="" width="18" height="18" />Publié sur {{ subBrand.name }}
      </span>
    </NuxtLink>

    <div class="tile__bd">
      <div class="tile__top">
        <ListingRubricTag :rubric="rubric" :format="item.format" />
        <ArticleDataBadge :count="item.linked_datasets_count" />
      </div>
      <p v-if="!item.thumbnail_url && (pinned || subBrand)" class="tile__flags">
        <span v-if="pinned" class="tile__une tile__une--inline">À la une</span>
        <span v-if="subBrand">Publié sur {{ subBrand.name }}</span>
      </p>
      <NuxtLink :to="to" class="tile__t">
        <h3><DsHighlight :text="item.title" :query="query" /></h3>
      </NuxtLink>
      <span class="tile__stats">{{ stats }}</span>
      <div class="tile__ft">
        <ArticleByline :item="item" :query="query" />
        <ListingFavButton :active="favorited" :title="item.title" @toggle="emit('favorite')" />
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tile__im {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.tile__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tile__une {
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
.tile__une--inline {
  position: static;
  border-color: var(--ds-violet-700);
}
.tile__sub {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 12px/1 var(--ds-ui);
}
.tile__sub img {
  border-radius: 3px;
}
.tile__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
}
.tile__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tile__flags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--ds-muted);
  font: 600 12px/1 var(--ds-ui);
}
.tile__t {
  color: var(--ds-text);
  text-decoration: none;
}
.tile__t h3 {
  margin: 0;
  font: 700 18px/1.28 var(--ds-ui);
  text-wrap: pretty;
}
.tile__t:hover h3 {
  color: var(--ds-link);
}
.tile__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.tile__stats {
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.tile__ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
}
</style>
