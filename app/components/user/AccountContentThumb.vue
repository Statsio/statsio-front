<script setup lang="ts">
import type { DisplayAccountContent } from '@/lib/account-content'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

withDefaults(
  defineProps<{
    content: Pick<DisplayAccountContent, 'typeBg' | 'typeColor' | 'typeLabel' | 'thumbnailUrl'>
    rounded?: string
  }>(),
  { rounded: 'rounded-[11px]' },
)
</script>

<template>
  <div class="shrink-0 overflow-hidden" :class="rounded">
    <AppMediaImage :src="content.thumbnailUrl" :alt="content.typeLabel" :class="rounded" mark-class="min-w-0 w-1/2 max-w-[36px]" />
  </div>
</template>
