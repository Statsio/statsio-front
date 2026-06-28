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

/** Resolved list of Y columns — prefers yAxes (multi), falls back to single yAxis */
const yColumns = computed(() => {
  const axes = props.block.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = props.block.fieldMapping.yAxis
  return single ? [single] : []
})

const hasMultipleSeries = computed(
  () => Boolean(props.block.fieldMapping.series) || yColumns.value.length >= 2,
)

const chartData = computed(() => {
  const rows = data.value?.rows ?? []
  const xKey = props.block.fieldMapping.xAxis ?? ''
  const seriesKey = props.block.fieldMapping.series
  const yCols = yColumns.value

  // ── Long format: group by series column ──
  if (seriesKey && rows.length > 0) {
    const groupLimit = props.block.config.rowLimit ?? 500
    const allLabels = [...new Set(rows.map((r: Record<string, unknown>) => String(r[xKey] ?? '')))]
    const labels = allLabels.slice(0, groupLimit)
    const uniqueSeries = [...new Set(rows.map((r: Record<string, unknown>) => String(r[seriesKey] ?? '')))]
    const yKey = yCols[0] ?? ''

    return {
      labels,
      datasets: uniqueSeries.map((seriesVal, i) => ({
        label: seriesVal,
        data: labels.map((label) => {
          const row = rows.find(
            (r: Record<string, unknown>) => String(r[xKey]) === label && String(r[seriesKey]) === seriesVal,
          )
          return Number(row?.[yKey] ?? 0)
        }),
        backgroundColor: PALETTE[i % PALETTE.length],
        borderRadius: 4,
      })),
    }
  }

  // ── Wide format: one dataset per Y column ──
  if (yCols.length >= 2) {
    return {
      labels: rows.map((r: Record<string, unknown>) => String(r[xKey] ?? '')),
      datasets: yCols.map((col, i) => ({
        label: col,
        data: rows.map((r: Record<string, unknown>) => Number(r[col] ?? 0)),
        backgroundColor: PALETTE[i % PALETTE.length],
        borderRadius: 4,
      })),
    }
  }

  // ── Single Y column ──
  const yKey = yCols[0] ?? ''
  return {
    labels: rows.map((r: Record<string, unknown>) => String(r[xKey] ?? '')),
    datasets: [
      {
        label: props.block.config.title ?? yKey,
        data: rows.map((r: Record<string, unknown>) => Number(r[yKey] ?? 0)),
        backgroundColor: props.block.config.colors?.[0] ?? PALETTE[0],
        borderRadius: 4,
      },
    ],
  }
})

const { scheduleResize } = useChart(canvasRef, 'bar', () => chartData.value, () => ({
  indexAxis: props.block.config.orientation === 'horizontal' ? 'y' : 'x',
  plugins: {
    legend: { display: hasMultipleSeries.value, position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    :class="hasMultipleSeries ? 'h-64 sm:h-80' : 'h-48 sm:h-64'"
  >
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
