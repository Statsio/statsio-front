<script setup lang="ts">
import DatasetCard from '@/components/statsdata/DatasetCard.vue'
import type { StatsDataDocument } from '@/api/studio'

defineProps<{
  items: StatsDataDocument[]
  emptyText: string
}>()
</script>

<template>
  <div v-if="items.length" class="grid gap-[22px] py-8 sm:grid-cols-2 xl:grid-cols-3">
    <DatasetCard v-for="item in items" :key="item.id" :document="item" />
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
