<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()

const studio = useStudioStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { data, isLoading, error } = useBlockData(() => props.block)

const chartData = computed(() => {
  const rows = data.value?.rows ?? []
  const xKey = props.block.fieldMapping.xAxis ?? ''
  const yKey = props.block.fieldMapping.yAxis ?? ''

  return {
    labels: rows.map((r) => String(r[xKey] ?? '')),
    datasets: [
      {
        label: props.block.config.title ?? yKey,
        data: rows.map((r) => Number(r[yKey] ?? 0)),
        borderColor: props.block.config.colors?.[0] ?? '#8b5cf6',
        backgroundColor: (props.block.config.colors?.[0] ?? '#8b5cf6') + '22',
        tension: props.block.config.smooth ? 0.4 : 0,
        fill: true,
        pointRadius: 3,
      },
    ],
  }
})

const { scheduleResize } = useChart(canvasRef, 'line', () => chartData.value, () => ({
  plugins: { legend: { display: false } },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full h-full min-h-[200px] overflow-hidden">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/70">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !block.fieldMapping.xAxis" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <canvas v-else ref="canvasRef" class="w-full h-full" />
  </div>
</template>
