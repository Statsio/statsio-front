<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart, useChartTheme, PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useExpressionNumber } from '@/composables/useResolvedTokens'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { buildChartSeries } from '@/lib/studio-chart'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { data, isLoading, error } = useBlockData(() => props.block, props.readonly, () => props.scope)

const { value: refValue } = useExpressionNumber({
  expression: () => props.block.config.referenceExpression,
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  block: () => props.block,
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
})

/** Références des colonnes Y (pour le titre d'axe uniquement). */
const yRefs = computed(() => {
  const axes = props.block.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = props.block.fieldMapping.yAxis
  return single ? [single] : []
})

// Séries unifiées (format large / long / croisé) — voir buildChartSeries.
const built = computed(() => buildChartSeries(props.block, data.value, datasets))

/** Série unique sans regroupement → style « aire » + libellé = titre du bloc. */
const isSingleSeries = computed(
  () => built.value.series.length === 1 && !props.block.fieldMapping.series,
)
const hasMultipleSeries = computed(() => built.value.series.length >= 2)

const chartData = computed(() => {
  const { labels, series } = built.value
  const tension = props.block.config.smooth ? 0.4 : 0

  if (isSingleSeries.value) {
    const s = series[0]
    const color = props.block.config.colors?.[0] ?? PALETTE[0]
    const filled = props.block.config.lineFill !== false
    return {
      labels,
      datasets: [{
        label: props.block.config.title ?? s?.label ?? '',
        data: s?.values ?? [],
        borderColor: color,
        backgroundColor: color + (filled ? '22' : '00'),
        tension,
        fill: filled ? 'origin' : false,
        pointRadius: 3,
      }],
    }
  }

  return {
    labels,
    datasets: series.map((s) => {
      const color = PALETTE[s.colorIndex % PALETTE.length]
      return {
        label: s.label,
        data: s.values,
        borderColor: color,
        backgroundColor: color + '22',
        tension,
        fill: false,
        pointRadius: 3,
      }
    }),
  }
})

const isHorizontal = computed(() => props.block.config.orientation === 'horizontal')

// Titre d'axe : uniquement si un libellé personnalisé est défini sur la colonne.
const labelMap = computed(() => props.block.fieldMapping.columnLabels ?? {})
const xTitle = computed(() => (props.block.fieldMapping.xAxis ? labelMap.value[props.block.fieldMapping.xAxis] : '') || '')
const yTitle = computed(() => (isSingleSeries.value && yRefs.value[0] ? (labelMap.value[yRefs.value[0]] || '') : ''))
const chartTheme = useChartTheme()
const axisTitle = (text: string) => (text
  ? { display: true, text, font: { family: "'JetBrains Mono', monospace", size: 11, weight: 600 as const }, color: chartTheme.value.title }
  : { display: false })

const { scheduleResize } = useChart(canvasRef, 'line', () => chartData.value, () => ({
  indexAxis: isHorizontal.value ? 'y' : 'x',
  scales: {
    x: {
      grid: { display: isHorizontal.value, color: chartTheme.value.grid },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: chartTheme.value.tick },
      title: axisTitle(isHorizontal.value ? yTitle.value : xTitle.value),
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: chartTheme.value.tick },
      title: axisTitle(isHorizontal.value ? xTitle.value : yTitle.value),
    },
  },
  plugins: {
    // Legend is rendered as custom HTML below the canvas instead (matches the editorial mockup style).
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
    referenceLine: {
      value: props.block.config.referenceExpression ? refValue.value : null,
      label: props.block.config.referenceLabel,
    },
  },
}))

// Same series info Chart.js would put in its native legend, used to render the custom one.
const legendEntries = computed(() => chartData.value.datasets.map((d) => ({ label: d.label, color: d.borderColor as string })))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full overflow-hidden">
    <div
      class="relative"
      :class="hasMultipleSeries ? 'h-64 sm:h-80' : 'h-48 sm:h-64'"
    >
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/70">
        <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <span class="text-sm text-red-500">{{ error }}</span>
      </div>

      <div v-else-if="!block.datasetId || !block.fieldMapping.xAxis" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--studio-faint)]">
        <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        <span class="text-xs">Configurer les données →</span>
      </div>

      <canvas v-else ref="canvasRef" class="w-full h-full max-w-full" />
    </div>

    <div v-if="hasMultipleSeries && !isLoading && !error" class="mt-3 flex flex-wrap gap-4">
      <span v-for="entry in legendEntries" :key="entry.label" class="flex items-center gap-1.5 text-xs text-[var(--studio-muted)]">
        <span class="inline-block h-[3px] w-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
        {{ entry.label }}
      </span>
    </div>
  </div>
</template>
