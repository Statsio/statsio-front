<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { CONTENT_TYPE_META } from '@/lib/content-display'

const props = withDefaults(
  defineProps<{
    item: Pick<CatalogItem, 'type' | 'title' | 'thumbnail_url'>
    rounded?: string
  }>(),
  { rounded: 'rounded-[11px]' },
)

const meta = computed(() => CONTENT_TYPE_META[props.item.type ?? 'statsdata'] ?? CONTENT_TYPE_META.statsdata)
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden font-mono text-[9px] font-semibold"
    :class="rounded"
    :style="item.thumbnail_url ? undefined : { background: meta.bg, color: meta.color }"
  >
    <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full object-cover" />
    <span v-else>{{ meta.label }}</span>
  </div>
</template>
