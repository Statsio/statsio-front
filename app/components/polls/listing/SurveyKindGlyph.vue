<script setup lang="ts">
import { computed } from 'vue'
import { sectorPath } from '@/lib/ds/pie'
import type { SurveyKind } from '@/types/catalog'

/**
 * Pictogramme du type de consultation, découpé dans le disque de la charte :
 * sondage rapide = part détachée · questionnaire = quatre quarts (deux remplis) ·
 * pétition = jauge. Couleur = `currentColor`.
 */
const props = withDefaults(defineProps<{ kind?: SurveyKind; size?: number }>(), {
  kind: 'single_question',
  size: 13,
})

const quarters = [0, 1, 2, 3].map((i) => ({
  d: sectorPath(12, 12, 10.5, -86 + i * 90, -4 + i * 90),
  opacity: i < 2 ? 1 : 0.35,
}))
const quick = [
  { d: sectorPath(13.4, 10.6, 9.6, -90, 0), opacity: 1 },
  { d: sectorPath(11.6, 12.4, 9.6, 0, 270), opacity: 0.45 },
]
const shapes = computed(() =>
  props.kind === 'long' ? quarters : props.kind === 'single_question' ? quick : [],
)
</script>

<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true">
    <template v-if="kind === 'petition'">
      <path
        d="M2 17 A10 10 0 0 1 22 17"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        opacity=".35"
      />
      <path d="M2 17 A10 10 0 0 1 15 7.5" fill="none" stroke="currentColor" stroke-width="3" />
      <circle cx="12" cy="17" r="2.2" fill="currentColor" />
    </template>
    <path
      v-for="(s, i) in shapes"
      v-else
      :key="i"
      :d="s.d"
      fill="currentColor"
      :opacity="s.opacity"
    />
  </svg>
</template>
