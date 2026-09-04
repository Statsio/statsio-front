<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

withDefaults(
  defineProps<{
    item: Pick<CatalogItem, 'type' | 'title' | 'thumbnail_url'>
    rounded?: string
  }>(),
  { rounded: 'rounded-[11px]' },
)
</script>

<template>
  <div class="shrink-0 overflow-hidden" :class="rounded">
    <AppMediaImage :src="item.thumbnail_url" :alt="item.title" :class="rounded" mark-class="min-w-0 w-1/2 max-w-[40px]" />
  </div>
</template>
