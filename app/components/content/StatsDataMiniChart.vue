<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChart } from '@/composables/useChart'
import { cardPreviewToChart } from '@/lib/card-preview-chart'
import type { CardPreview } from '@/types/catalog'

/**
 * Mini-graphe d'une carte Statsdata rendu avec Chart.js — la même librairie que les
 * blocs graphiques du Studio (`useChart`). Ne monte que `line` / `bar` ; le `pie`
 * reste géré en `conic-gradient` par `CardPreviewMini`.
 *
 * `useChart` fige le type de graphe au montage : le parent doit donc remonter ce
 * composant via `:key` quand `preview.kind` change (voir `CardPreviewMini`).
 */
const props = withDefaults(
  defineProps<{ preview: CardPreview; palette: string[]; height?: number }>(),
  { height: 104 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const config = computed(() => cardPreviewToChart(props.preview, props.palette))

useChart(
  canvasRef,
  config.value.type,
  () => config.value.data,
  () => config.value.options,
)
</script>

<template>
  <div class="relative w-full" :style="{ height: `${height}px` }">
    <canvas ref="canvasRef" class="!h-full !w-full" />
  </div>
</template>
