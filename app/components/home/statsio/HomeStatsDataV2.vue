<script setup lang="ts">
import HomeCarousel from '@/components/home/statsio/HomeCarousel.vue'
import StatsDataCard from '@/components/content/StatsDataCard.vue'
import { useHomeCatalogSection } from '@/composables/useHomeCatalogSection'

const { items, isFavorited, toggleItemFavorite, selectTag } = useHomeCatalogSection({
  type: 'statsdata',
  key: 'home-v2-statsdata',
})
</script>

<template>
  <HomeCarousel
    v-if="items.length"
    eyebrow="STATSDATA"
    eyebrow-color="#3b82f6"
    title="Des chiffres qui bougent en direct"
    all-label="Toutes les statsdata"
    all-to="/statsdata"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="flex w-[346px] shrink-0"
      style="scroll-snap-align: start"
    >
      <StatsDataCard
        class="w-full"
        format="card"
        :item="item"
        :favorited="isFavorited(item)"
        @favorite="toggleItemFavorite(item)"
        @select-tag="selectTag"
      />
    </div>
  </HomeCarousel>
</template>
