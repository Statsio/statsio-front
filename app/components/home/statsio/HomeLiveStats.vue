<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'
import StatsDataCard from '@/components/content/StatsDataCard.vue'
import { useContentBasePath } from '@/composables/useContentBasePath'
import HomeSectionHeading from '@/components/home/statsio/HomeSectionHeading.vue'

defineProps<{
  title: string
  items: CatalogItem[]
  isFavorited: (item: CatalogItem) => boolean
}>()

const emit = defineEmits<{ favorite: [CatalogItem] }>()

const base = useContentBasePath()
</script>

<template>
  <section
    v-if="items.length"
    class="border-y border-primary/10 bg-[linear-gradient(180deg,#f4f1ff_0%,#faf8ff_100%)] py-16"
  >
    <div class="mx-auto max-w-[1120px] px-6">
      <HomeSectionHeading
        eyebrow="STATSDATA"
        eyebrow-color="var(--color-accent)"
        :title="title"
        all-label="Toutes les statsdata"
        :all-to="`${base}/statsdata`"
      />
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsDataCard
          v-for="item in items"
          :key="item.id"
          class="w-full"
          format="card"
          :item="item"
          :favorited="isFavorited(item)"
          @favorite="emit('favorite', item)"
        />
      </div>
    </div>
  </section>
</template>
