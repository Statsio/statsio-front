<script setup lang="ts">
import { computed } from 'vue'
import { getStatsDataVisual } from '@/utils/statsDataVisuals'

const props = defineProps<{
  categories?: string[]
  emoji?: string | null
  thumbnailUrl?: string | null
}>()

const visual = computed(() => getStatsDataVisual(props.categories, props.emoji))

const backgroundImage = computed(() => {
  const a = `color-mix(in srgb, ${visual.value.color} 10%, white)`
  const b = `color-mix(in srgb, ${visual.value.color} 5%, white)`
  return `repeating-linear-gradient(45deg, ${a}, ${a} 14px, ${b} 14px, ${b} 28px)`
})
</script>

<template>
  <img
    v-if="thumbnailUrl"
    :src="thumbnailUrl"
    alt=""
    class="h-40 w-full rounded-2xl object-cover sm:h-56"
  />
  <div
    v-else
    class="flex h-40 items-center justify-center rounded-2xl sm:h-56"
    :style="{ backgroundImage }"
  >
    <span class="text-5xl select-none sm:text-6xl">{{ visual.emoji }}</span>
  </div>
</template>
