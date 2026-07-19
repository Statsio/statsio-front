<script setup lang="ts">
import ChannelFeedCard from './ChannelFeedCard.vue'
import type { FeedItem } from '@/composables/useChannelProfile'

defineProps<{
  items: FeedItem[]
  emptyText: string
  colorPrimary: string
}>()
</script>

<template>
  <div v-if="items.length" class="grid gap-[22px] py-8 sm:grid-cols-2 xl:grid-cols-3">
    <ChannelFeedCard
      v-for="(item, i) in items"
      :key="`${item.title}-${i}`"
      :title="item.title"
      :meta="item.meta"
      :color-primary="colorPrimary"
    />
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
