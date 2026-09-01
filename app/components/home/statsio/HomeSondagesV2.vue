<script setup lang="ts">
import HomeCarousel from '@/components/home/statsio/HomeCarousel.vue'
import SurveyCard from '@/components/content/SurveyCard.vue'
import { useHomeCatalogSection } from '@/composables/useHomeCatalogSection'

const { items, isFavorited, toggleItemFavorite, selectTag } = useHomeCatalogSection({
  type: 'survey',
  key: 'home-v2-sondages',
})
</script>

<template>
  <HomeCarousel
    v-if="items.length"
    eyebrow="SONDAGES"
    eyebrow-color="#e11d48"
    title="Votez, ça compte vraiment"
    all-label="Toutes les consultations"
    all-to="/sondages"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="flex w-[346px] shrink-0"
      style="scroll-snap-align: start"
    >
      <SurveyCard
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
