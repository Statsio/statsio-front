<script setup lang="ts">
import { computed } from 'vue'
import { sectorPath, PIE_START } from '@/lib/ds/pie'
import { readingSweep } from '@/lib/articles-listing'

/** Temps de lecture : cadran de 5 min, une tranche par minute. */
const props = defineProps<{ minutes: number }>()
const d = computed(() => sectorPath(12, 12, 10, PIE_START, PIE_START + readingSweep(props.minutes)))
</script>

<template>
  <span class="art-rt">
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        opacity=".35"
      />
      <path :d="d" fill="currentColor" />
    </svg>
    {{ minutes }} min
  </span>
</template>

<style scoped>
.art-rt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
</style>
