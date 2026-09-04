<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'
import SurveyCard from '@/components/content/SurveyCard.vue'
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
  <section v-if="items.length" class="border-t border-slate-200/70 bg-white py-16">
    <div class="mx-auto max-w-[1120px] px-6">
      <HomeSectionHeading
        eyebrow="SONDAGES"
        :title="title"
        all-label="Toutes les consultations"
        :all-to="`${base}/sondages`"
      />
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SurveyCard
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
