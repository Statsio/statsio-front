<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart, PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const studio = useStudioStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { data, isLoading, error } = useBlockData(() => props.block, props.readonly)

const chartData = computed(() => {
  const rows = data.value?.rows ?? []
  const labelKey = props.block.fieldMapping.label ?? ''
  const valueKey = props.block.fieldMapping.value ?? ''
  const limit = props.block.config.rowLimit ?? 12

  const labels = rows.slice(0, limit).map((r: Record<string, unknown>) => String(r[labelKey] ?? ''))
  const values = rows.slice(0, limit).map((r: Record<string, unknown>) => Number(r[valueKey] ?? 0))

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: props.block.config.colors?.length ? props.block.config.colors : PALETTE,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }
})

const { scheduleResize } = useChart(canvasRef, 'pie', () => chartData.value, () => ({
  plugins: {
    legend: { display: true, position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full overflow-hidden h-64 sm:h-80">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !block.fieldMapping.label || !block.fieldMapping.value" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <canvas v-else ref="canvasRef" class="w-full h-full max-w-full" />
  </div>
</template>
