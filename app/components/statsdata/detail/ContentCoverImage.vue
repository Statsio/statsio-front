<script setup lang="ts">
import { computed } from 'vue'
import type { StatsDataDocument } from '@/api/studio'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

const props = defineProps<{ doc: StatsDataDocument }>()

const src = computed(() => props.doc.thumbnail_url ?? null)
</script>

<template>
  <div class="flex min-h-[260px] overflow-hidden rounded-[18px] border border-[var(--studio-line)] bg-white lg:h-full">
    <AppMediaImage :src="src" :alt="doc.title" class="flex-1" mark-class="max-w-[96px]" />
  </div>
</template>
