<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const studio = useStudioStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { data, isLoading, error } = useBlockData(() => props.block, props.readonly)

const chartData = computed(() => {
  const rows = data.value?.rows ?? []
  const xKey = props.block.fieldMapping.xAxis ?? ''
  const yKey = props.block.fieldMapping.yAxis ?? ''

  return {
    labels: rows.map((r: Record<string, unknown>) => String(r[xKey] ?? '')),
    datasets: [
      {
        label: props.block.config.title ?? yKey,
        data: rows.map((r: Record<string, unknown>) => Number(r[yKey] ?? 0)),
        backgroundColor: props.block.config.colors?.[0] ?? '#8b5cf6',
        borderRadius: 4,
      },
    ],
  }
})

const { scheduleResize } = useChart(canvasRef, 'bar', () => chartData.value, () => ({
  indexAxis: props.block.config.orientation === 'horizontal' ? 'y' : 'x',
  plugins: { legend: { display: false } },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full h-48 sm:h-64 overflow-hidden">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !block.fieldMapping.xAxis" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <canvas v-else ref="canvasRef" class="w-full h-full max-w-full" />
  </div>
</template>
