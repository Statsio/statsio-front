<script setup lang="ts">
import { computed } from 'vue'
import { channelPatternStyle } from '@/lib/channel-brand'

const props = defineProps<{
  title: string
  meta?: string
  colorPrimary: string
}>()

const patternStyle = computed(() => channelPatternStyle(props.colorPrimary))
</script>

<template>
  <article class="overflow-hidden rounded-[14px] border border-[#18181f]/[0.08] bg-white">
    <div class="flex h-[120px] items-center justify-center font-mono text-[11px] font-bold" :style="patternStyle">
      image
    </div>
    <div class="p-4">
      <p class="text-[14.5px] font-bold leading-[1.3] text-[#18181f]">{{ title }}</p>
      <p v-if="meta" class="mt-2 text-[11.5px] text-[#18181f]/50">{{ meta }}</p>
    </div>
  </article>
</template>
