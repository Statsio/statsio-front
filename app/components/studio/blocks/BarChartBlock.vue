<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChart, useChartTheme, PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { useExpressionNumber } from '@/composables/useResolvedTokens'
import { buildChartSeries, markColor } from '@/lib/studio-chart'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{
  block: StudioBlock
  readonly?: boolean
  scope?: Record<string, string>
  /** Modal d'agrandissement : hauteur de graphique plus généreuse. */
  expanded?: boolean
}>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { data, isLoading, error } = useBlockData(() => props.block, props.readonly, () => props.scope)

// ─── Ligne de référence + couleur de marque conditionnelle (Phase 5) ─────────

const { value: refValue } = useExpressionNumber({
  expression: () => props.block.config.referenceExpression,
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  block: () => props.block,
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
})

function barColors(values: number[], fallback: string): string[] {
  const rules = props.block.config.markRules
  if (!rules?.length) return values.map(() => fallback)
  const finite = values.filter((v) => Number.isFinite(v))
  const ctx = { min: Math.min(...finite), max: Math.max(...finite), ref: refValue.value }
  return values.map((v) => markColor(rules, Number.isFinite(v) ? v : null, ctx, fallback))
}

/** Références des colonnes Y (pour le titre d'axe uniquement). */
const yRefs = computed(() => {
  const axes = props.block.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = props.block.fieldMapping.yAxis
  return single ? [single] : []
})

// Séries unifiées (format large / long / croisé) — voir buildChartSeries.
const built = computed(() => buildChartSeries(props.block, data.value, datasets))

/** Série unique sans regroupement → couleurs conditionnelles + libellé = titre du bloc. */
const isSingleSeries = computed(
  () => built.value.series.length === 1 && !props.block.fieldMapping.series,
)
const hasMultipleSeries = computed(() => built.value.series.length >= 2)

const seriesColor = (i: number) => PALETTE[i % PALETTE.length]!

const chartData = computed(() => {
  const { labels, series } = built.value

  if (isSingleSeries.value) {
    const values = series[0]?.values ?? []
    const fallback = props.block.config.colors?.[0] ?? PALETTE[0]!
    return {
      labels,
      datasets: [{
        label: props.block.config.title ?? series[0]?.label ?? '',
        data: values,
        backgroundColor: barColors(values, fallback),
        borderRadius: 6,
      }],
    }
  }

  return {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.values,
      backgroundColor: seriesColor(s.colorIndex),
      borderRadius: 6,
    })),
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

interface ProgressGroup {
  label: string
  bars: ProgressRow[]
}

const fmtNum = new Intl.NumberFormat('fr-FR')
const progressDisplay = (value: number, isPercent: boolean) =>
  isPercent ? `${value}%` : fmtNum.format(value)

/** Plusieurs séries → une barre par série, groupée par valeur de l'axe X. */
const isMultiProgress = computed(
  () => props.block.config.barStyle === 'progress' && built.value.series.length >= 2,
)

const progressSeries = computed(() =>
  built.value.series.map((s) => ({ label: s.label, color: seriesColor(s.colorIndex) })),
)

const progressGroups = computed<ProgressGroup[]>(() => {
  const { labels: xLabels, series } = built.value
  const limit = props.block.config.rowLimit ?? 20
  const isPercent = props.block.config.format === 'percent'
  const sliced = xLabels.slice(0, limit)

  // Échelle commune à toutes les séries (comme l'axe partagé du graphique).
  let max = 0
  for (const s of series) for (const v of s.values.slice(0, limit)) max = Math.max(max, v)

  return sliced.map((label, li) => ({
    label,
    bars: series.map((s) => {
      const value = s.values[li] ?? 0
      const width = isPercent
        ? Math.max(0, Math.min(100, value))
        : max > 0
          ? (value / max) * 100
          : 0
      return {
        label: s.label,
        width,
        display: progressDisplay(value, isPercent),
        color: seriesColor(s.colorIndex),
      }
    }),
  }))
})

const progressRows = computed<ProgressRow[]>(() => {
  const { labels: xLabels, series } = built.value
  const limit = props.block.config.rowLimit ?? 20
  const colors = props.block.config.colors?.length ? props.block.config.colors : PALETTE
  const color = colors[0] ?? '#8b5cf6'
  const isPercent = props.block.config.format === 'percent'

  const sliced = xLabels.slice(0, limit)
  const values = (series[0]?.values ?? []).slice(0, limit)
  const max = Math.max(0, ...values)
  const marked = barColors(values, color)

  return sliced.map((label, i) => {
    const value = values[i] ?? 0
    const width = isPercent ? Math.max(0, Math.min(100, value)) : (max > 0 ? (value / max) * 100 : 0)
    return {
      label,
      width,
      display: progressDisplay(value, isPercent),
      color: marked[i] ?? color,
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

// Titre d'axe : uniquement si un libellé personnalisé est défini sur la colonne.
const labels = computed(() => props.block.fieldMapping.columnLabels ?? {})
const xTitle = computed(() => (props.block.fieldMapping.xAxis ? labels.value[props.block.fieldMapping.xAxis] : '') || '')
const yTitle = computed(() =>
  isSingleSeries.value && yRefs.value[0] ? (labels.value[yRefs.value[0]] || '') : '',
)
const chartTheme = useChartTheme()
const axisTitle = (text: string) => (text
  ? { display: true, text, font: { family: "'JetBrains Mono', monospace", size: 11, weight: 600 as const }, color: chartTheme.value.title }
  : { display: false })

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
      grid: { display: isHorizontal.value, color: chartTheme.value.grid },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: chartTheme.value.tick },
      title: axisTitle(isHorizontal.value ? yTitle.value : xTitle.value),
    },
    y: {
      ...(!isHorizontal.value && useLogScale.value ? { type: 'logarithmic' as const } : {}),
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: chartTheme.value.tick },
      title: axisTitle(isHorizontal.value ? xTitle.value : yTitle.value),
    },
  },
  plugins: {
    legend: { display: hasMultipleSeries.value, position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
    valueLabels: {
      enabled: Boolean(props.block.config.showValueLabels),
      format: props.block.config.format,
    },
    referenceLine: {
      value: props.block.config.referenceExpression ? refValue.value : null,
      label: props.block.config.referenceLabel,
    },
  },
}))

watch(() => [studio.isPanelOpen, studio.selectedBlockId !== null], scheduleResize)
</script>

<template>
  <div class="relative w-full overflow-hidden">
    <div
      v-if="!showProgress"
      class="relative"
      :class="expanded
        ? 'h-[28rem] sm:h-[32rem]'
        : hasMultipleSeries ? 'h-64 sm:h-80' : 'h-48 sm:h-64'"
    >
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
        <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <span class="text-sm text-red-500">{{ error }}</span>
      </div>

      <div v-else-if="!block.datasetId || !block.fieldMapping.xAxis" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--studio-faint)]">
        <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z" />
        </svg>
        <span class="text-xs">Configurer les données →</span>
      </div>

      <canvas v-else ref="canvasRef" class="w-full h-full max-w-full" />
    </div>

    <div v-else-if="isMultiProgress" class="flex flex-col gap-3.5 py-1">
      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <span v-for="s in progressSeries" :key="s.label" class="flex items-center gap-1.5 text-[11.5px] text-[color:color-mix(in_srgb,var(--studio-ink)_70%,transparent)]">
          <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: s.color }" />
          {{ s.label }}
        </span>
      </div>
      <div v-for="group in progressGroups" :key="group.label" class="flex flex-col gap-1.5">
        <span class="truncate text-[12.5px] font-medium text-[color:color-mix(in_srgb,var(--studio-ink)_85%,transparent)]">{{ group.label }}</span>
        <div v-for="bar in group.bars" :key="bar.label" class="flex items-center gap-2.5">
          <div class="h-2.5 flex-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_14%,var(--studio-surface))]">
            <div class="h-full rounded-full" :style="{ width: `${bar.width}%`, backgroundColor: bar.color }" />
          </div>
          <span class="mono w-12 shrink-0 text-right text-[11.5px] text-[color:color-mix(in_srgb,var(--studio-ink)_80%,transparent)]">{{ bar.display }}</span>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-2.5 py-1">
      <div v-for="row in progressRows" :key="row.label" class="flex items-center gap-2.5">
        <span class="w-[90px] shrink-0 truncate text-[12.5px] text-[color:color-mix(in_srgb,var(--studio-ink)_80%,transparent)]">{{ row.label }}</span>
        <div class="h-2.5 flex-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_14%,var(--studio-surface))]">
          <div class="h-full rounded-full" :style="{ width: `${row.width}%`, backgroundColor: row.color }" />
        </div>
        <span class="mono w-12 shrink-0 text-right text-[11.5px] text-[color:color-mix(in_srgb,var(--studio-ink)_80%,transparent)]">{{ row.display }}</span>
      </div>
    </div>
  </div>
</template>
