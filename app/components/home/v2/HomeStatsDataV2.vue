<script setup lang="ts">
import { computed } from 'vue'
import HomeCarousel from '@/components/home/v2/HomeCarousel.vue'
import StatsDataCard from '@/components/content/StatsDataCard.vue'
import { useHomeCatalogSection } from '@/composables/useHomeCatalogSection'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  eyebrow: string
  title: string
  allLabel: string
}>()

const basePath = useContentBasePath()
const allTo = computed(() => `${basePath.value}/statsdata`)

const { items, isFavorited, toggleItemFavorite } = useHomeCatalogSection({
  type: 'statsdata',
  key: 'home-v2-statsdata',
})
</script>

<template>
  <HomeCarousel
    v-if="items.length"
    :eyebrow="props.eyebrow"
    eyebrow-color="var(--color-accent)"
    :title="props.title"
    :all-label="props.allLabel"
    :all-to="allTo"
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
      />
    </div>
  </HomeCarousel>
</template>
