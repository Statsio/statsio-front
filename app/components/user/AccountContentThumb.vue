<script setup lang="ts">
import type { DisplayAccountContent } from '@/lib/account-content'

withDefaults(
  defineProps<{
    content: Pick<DisplayAccountContent, 'typeBg' | 'typeColor' | 'typeLabel' | 'thumbnailUrl'>
    rounded?: string
  }>(),
  { rounded: 'rounded-[11px]' },
)
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden font-mono text-[9px] font-semibold"
    :class="rounded"
    :style="content.thumbnailUrl ? undefined : { background: content.typeBg, color: content.typeColor }"
  >
    <img v-if="content.thumbnailUrl" :src="content.thumbnailUrl" alt="" class="h-full w-full object-cover" />
    <span v-else>{{ content.typeLabel }}</span>
  </div>
</template>
