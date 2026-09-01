<script setup lang="ts">
import HomeCarousel from '@/components/home/statsio/HomeCarousel.vue'
import ArticleCatalogCard from '@/components/articles/ArticleCatalogCard.vue'
import { useHomeCatalogSection } from '@/composables/useHomeCatalogSection'

const { items, isFavorited, toggleItemFavorite, selectTag } = useHomeCatalogSection({
  type: 'article',
  key: 'home-v2-articles',
})
</script>

<template>
  <HomeCarousel
    v-if="items.length"
    eyebrow="ARTICLES"
    eyebrow-color="#7c3aed"
    title="Décryptages et enquêtes du moment"
    all-label="Tous les articles"
    all-to="/articles"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="flex w-[346px] shrink-0"
      style="scroll-snap-align: start"
    >
      <ArticleCatalogCard
        class="w-full"
        :item="item"
        :favorited="isFavorited(item)"
        @favorite="toggleItemFavorite(item)"
        @select-tag="selectTag"
      />
    </div>
  </HomeCarousel>
</template>
