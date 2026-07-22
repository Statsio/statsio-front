<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart, PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import { formatDisplayValue, parseNumericValue } from '@/utils/statsDataFormat'
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
      if (!valueByKey.has(key)) valueByKey.set(key, parseNumericValue(r[yKey]))
    }

    return {
      labels,
      datasets: uniqueSeries.map((seriesVal, i) => ({
        label: seriesVal,
        data: labels.map((label) => valueByKey.get(`${label} ${seriesVal}`) ?? 0),
        backgroundColor: PALETTE[i % PALETTE.length],
        borderRadius: 6,
      })),
    }
  }

  // ── Wide format: one dataset per Y column ──
  if (yCols.length >= 2) {
    return {
      labels: rows.map((r: Record<string, unknown>) => formatDisplayValue(r[xKey], '')),
      datasets: yCols.map((col, i) => ({
        label: col,
        data: rows.map((r: Record<string, unknown>) => parseNumericValue(r[col])),
        backgroundColor: PALETTE[i % PALETTE.length],
        borderRadius: 6,
      })),
    }
  }

  // ── Single Y column ──
  const yKey = yCols[0] ?? ''
  return {
    labels: rows.map((r: Record<string, unknown>) => formatDisplayValue(r[xKey], '')),
    datasets: [
      {
        label: props.block.config.title ?? yKey,
        data: rows.map((r: Record<string, unknown>) => parseNumericValue(r[yKey])),
        backgroundColor: props.block.config.colors?.[0] ?? PALETTE[0],
        borderRadius: 6,
      },
    ],
  }
})

// ─── Progress-list rendering (config.barStyle === 'progress') ─────────────────
// Thin labeled progress-bar list (label / track / value), used instead of the
// Chart.js canvas for simple single-series distributions (see mockup "Répartition
// par tranche d'âge" / "non-conformités par paramètre").

interface ProgressRow {
  label: string
  width: number
  display: string
  color: string
}

const progressRows = computed<ProgressRow[]>(() => {
  const rows = data.value?.rows ?? []
  const xKey = props.block.fieldMapping.xAxis ?? ''
  const yKey = yColumns.value[0] ?? ''
  const limit = props.block.config.rowLimit ?? 20
  const colors = props.block.config.colors?.length ? props.block.config.colors : PALETTE
  const color = colors[0] ?? '#8b5cf6'
  const isPercent = props.block.config.format === 'percent'

  const sliced = (rows as Record<string, unknown>[]).slice(0, limit)
  const values = sliced.map((r) => parseNumericValue(r[yKey]))
  const max = Math.max(0, ...values)

  return sliced.map((r, i) => {
    const value = values[i] ?? 0
    const width = isPercent ? Math.max(0, Math.min(100, value)) : (max > 0 ? (value / max) * 100 : 0)
    return {
      label: formatDisplayValue(r[xKey], ''),
      width,
      display: isPercent ? `${value}%` : new Intl.NumberFormat('fr-FR').format(value),
      color,
    }
  })
})

const showProgress = computed(() =>
  props.block.config.barStyle === 'progress' &&
  !isLoading.value && !error.value &&
  Boolean(props.block.datasetId) && Boolean(props.block.fieldMapping.xAxis),
)

const isHorizontal = computed(() => props.block.config.orientation === 'horizontal')
// Value axis (the one carrying magnitudes, not category labels) on a log10 scale —
// keeps small values visible when a dataset spans several orders of magnitude
// (e.g. 500 000 vs 500 000 000, where the smaller bar is invisible on a linear axis).
// The `type` key must be omitted entirely (not set to `undefined`) on the category axis —
// Chart.js only auto-infers the 'category' scale type when the key is absent, so an explicit
// `undefined` there was blanking out the x-axis labels (falls back to a numeric index axis).
const useLogScale = computed(() => Boolean(props.block.config.logScale))

const { scheduleResize } = useChart(canvasRef, 'bar', () => chartData.value, () => ({
  indexAxis: isHorizontal.value ? 'y' : 'x',
  layout: {
    padding: props.block.config.showValueLabels
      ? (isHorizontal.value ? { right: 44 } : { top: 22 })
      : undefined,
  },
  scales: {
    x: {
      ...(isHorizontal.value && useLogScale.value ? { type: 'logarithmic' as const } : {}),
      grid: { display: isHorizontal.value, color: 'rgba(24,24,31,0.06)' },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: 'rgba(24,24,31,0.45)' },
    },
    y: {
      ...(!isHorizontal.value && useLogScale.value ? { type: 'logarithmic' as const } : {}),
      display: isHorizontal.value,
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: 'rgba(24,24,31,0.45)' },
    },
  },
  plugins: {
    legend: { display: hasMultipleSeries.value, position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
    valueLabels: {
      enabled: Boolean(props.block.config.showValueLabels),
      format: props.block.config.format,
    },
  },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full overflow-hidden px-5 pb-5">
    <div
      v-if="!showProgress"
      class="relative"
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

    <div v-else class="flex flex-col gap-2.5 py-1">
      <div v-for="row in progressRows" :key="row.label" class="flex items-center gap-2.5">
        <span class="w-[90px] shrink-0 truncate text-[12.5px] text-[#18181f]/80">{{ row.label }}</span>
        <div class="h-2.5 flex-1 rounded-full bg-[#f0eefa]">
          <div class="h-full rounded-full" :style="{ width: `${row.width}%`, backgroundColor: row.color }" />
        </div>
        <span class="mono w-12 shrink-0 text-right text-[11.5px] text-[#18181f]/80">{{ row.display }}</span>
      </div>
    </div>
  </div>
</template>
