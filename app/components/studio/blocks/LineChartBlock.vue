<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart, PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import { formatDisplayValue } from '@/utils/statsDataFormat'
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
    // Une source (surtout live, ex. valeurs géographiques) peut contenir des milliers de
    // valeurs distinctes pour la colonne de série — sans plafond, uniqueSeries.map() ×
    // labels.map() × rows.find() explose en complexité et peut geler/planter l'onglet.
    const seriesLimit = props.block.config.seriesLimit ?? 20
    const allLabels = [...new Set(rows.map((r: Record<string, unknown>) => formatDisplayValue(r[xKey], '')))]
    const labels = allLabels.slice(0, groupLimit)
    const uniqueSeries = [...new Set(rows.map((r: Record<string, unknown>) => String(r[seriesKey] ?? '')))].slice(0, seriesLimit)
    const yKey = yCols[0] ?? ''

    // Index à plat en un seul passage sur rows — remplace un rows.find() par (label, série),
    // qui coûtait O(labels × séries × rows) au lieu de O(rows + labels × séries) ici.
    const valueByKey = new Map<string, number>()
    for (const r of rows as Record<string, unknown>[]) {
      const key = `${formatDisplayValue(r[xKey], '')} ${String(r[seriesKey] ?? '')}`
      if (!valueByKey.has(key)) valueByKey.set(key, Number(r[yKey] ?? 0))
    }

    return {
      labels,
      datasets: uniqueSeries.map((seriesVal, i) => {
        const color = PALETTE[i % PALETTE.length]
        return {
          label: seriesVal,
          data: labels.map((label) => valueByKey.get(`${label} ${seriesVal}`) ?? 0),
          borderColor: color,
          backgroundColor: color + '22',
          tension: props.block.config.smooth ? 0.4 : 0,
          fill: false,
          pointRadius: 3,
        }
      }),
    }
  }

  // ── Wide format: one dataset per Y column ──
  if (yCols.length >= 2) {
    return {
      labels: rows.map((r: Record<string, unknown>) => formatDisplayValue(r[xKey], '')),
      datasets: yCols.map((col, i) => {
        const color = PALETTE[i % PALETTE.length]
        return {
          label: col,
          data: rows.map((r: Record<string, unknown>) => Number(r[col] ?? 0)),
          borderColor: color,
          backgroundColor: color + '22',
          tension: props.block.config.smooth ? 0.4 : 0,
          fill: false,
          pointRadius: 3,
        }
      }),
    }
  }

  // ── Single Y column ──
  const yKey = yCols[0] ?? ''
  const color = props.block.config.colors?.[0] ?? PALETTE[0]
  return {
    labels: rows.map((r: Record<string, unknown>) => formatDisplayValue(r[xKey], '')),
    datasets: [
      {
        label: props.block.config.title ?? yKey,
        data: rows.map((r: Record<string, unknown>) => Number(r[yKey] ?? 0)),
        borderColor: color,
        backgroundColor: color + '22',
        tension: props.block.config.smooth ? 0.4 : 0,
        fill: true,
        pointRadius: 3,
      },
    ],
  }
})

const isHorizontal = computed(() => props.block.config.orientation === 'horizontal')

const { scheduleResize } = useChart(canvasRef, 'line', () => chartData.value, () => ({
  indexAxis: isHorizontal.value ? 'y' : 'x',
  scales: {
    x: {
      grid: { display: isHorizontal.value, color: 'rgba(24,24,31,0.06)' },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: 'rgba(24,24,31,0.45)' },
    },
    y: {
      display: isHorizontal.value,
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: 'rgba(24,24,31,0.45)' },
    },
  },
  plugins: {
    // Legend is rendered as custom HTML below the canvas instead (matches the editorial mockup style).
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}))

// Same series info Chart.js would put in its native legend, used to render the custom one.
const legendEntries = computed(() => chartData.value.datasets.map((d) => ({ label: d.label, color: d.borderColor as string })))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full overflow-hidden px-5 pb-5">
    <div
      class="relative"
      :class="hasMultipleSeries ? 'h-64 sm:h-80' : 'h-48 sm:h-64'"
    >
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

      <canvas v-else ref="canvasRef" class="w-full h-full max-w-full" />
    </div>

    <div v-if="hasMultipleSeries && !isLoading && !error" class="mt-3 flex flex-wrap gap-4">
      <span v-for="entry in legendEntries" :key="entry.label" class="flex items-center gap-1.5 text-xs text-[#18181f]/55">
        <span class="inline-block h-[3px] w-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
        {{ entry.label }}
      </span>
    </div>
  </div>
</template>
