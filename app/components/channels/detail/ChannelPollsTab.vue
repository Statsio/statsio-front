<script setup lang="ts">
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
      class="rounded-[14px] border border-[#18181f]/[0.08] bg-white px-[22px] py-5"
    >
      <p class="text-[15px] font-bold leading-[1.3] text-[#18181f]">{{ item.title }}</p>
      <p v-if="item.meta" class="mt-1.5 text-xs text-[#18181f]/50">{{ item.meta }}</p>
    </article>
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
