<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'
import type { FeedItem } from '@/composables/useChannelProfile'

defineProps<{
  items: FeedItem[]
  emptyText: string
}>()
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-3 py-8">
    <article
      v-for="(item, i) in items"
      :key="`${item.title}-${i}`"
      class="flex items-center gap-4 rounded-[14px] border border-[#18181f]/[0.08] bg-white px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <p class="text-[14.5px] font-bold text-[#18181f]">{{ item.title }}</p>
        <p v-if="item.meta" class="mt-0.5 text-[12.5px] text-[#18181f]/50">{{ item.meta }}</p>
      </div>
      <AppBadge variant="live" dot class="shrink-0">Live</AppBadge>
    </article>
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
