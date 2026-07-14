import { onMounted, onBeforeUnmount, nextTick, watch, type Ref } from 'vue'
import {
  Chart,
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartType,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js'

function formatValueLabel(value: number, format?: 'number' | 'percent' | 'currency') {
  if (format === 'percent') return `${value.toFixed(1)} %`
  if (format === 'currency') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }
  return new Intl.NumberFormat('fr-FR').format(value)
}

/**
 * Draws each bar's value at its tip (above for vertical bars, past the end for horizontal
 * ones). Opt-in per chart via `options.plugins.valueLabels` — no-ops otherwise, so it's safe
 * to register globally once rather than per chart instance.
 */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const opts = pluginOptions as { enabled?: boolean; format?: 'number' | 'percent' | 'currency' } | undefined
    if (!opts?.enabled) return

    const { ctx } = chart
    const horizontal = chart.options.indexAxis === 'y'
    ctx.save()
    ctx.font = "600 11px 'JetBrains Mono', monospace"
    ctx.fillStyle = 'rgba(24,24,31,0.65)'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      if (meta.hidden) return
      meta.data.forEach((element, index) => {
        const raw = dataset.data[index]
        if (raw === null || raw === undefined) return
        const value = Number(raw)
        if (Number.isNaN(value)) return

        const label = formatValueLabel(value, opts.format)
        const pos = (element as unknown as { tooltipPosition(): { x: number; y: number } }).tooltipPosition()

        if (horizontal) {
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, pos.x + 6, pos.y)
        } else {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(label, pos.x, pos.y - 4)
        }
      })
    })
    ctx.restore()
  },
}

Chart.register(
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  valueLabelsPlugin,
)

export const PALETTE = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
]

export function useChart(
  canvasRef: Ref<HTMLCanvasElement | null>,
  type: ChartType,
  dataGetter: () => ChartData,
  optionsGetter?: () => ChartOptions,
) {
  let chart: Chart | null = null

  function buildChart() {
    if (!canvasRef.value) return
    chart?.destroy()

    chart = new Chart(canvasRef.value, {
      type,
      data: dataGetter(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: { mode: 'index', intersect: false },
        },
        ...optionsGetter?.(),
      },
    })
  }

  function updateChart() {
    if (!chart) return
    const newData = dataGetter()
    // Rebuild when dataset count changes so options (legend, etc.) are re-applied
    if (chart.data.datasets.length !== newData.datasets.length) {
      buildChart()
      return
    }
    chart.data = newData
    chart.update('none')
  }

  onMounted(async () => {
    // Wait for browser layout before reading container dimensions
    await nextTick()
    requestAnimationFrame(() => {
      buildChart()
      requestAnimationFrame(() => chart?.resize())
    })
  })
  onBeforeUnmount(() => chart?.destroy())

  // Build chart when canvas appears in DOM (data loaded after mount)
  watch(canvasRef, (el: HTMLCanvasElement | null) => {
    if (!el) return
    // Two rAF to ensure browser has fully laid out the new DOM before Chart.js reads dimensions
    requestAnimationFrame(() => {
      buildChart()
      requestAnimationFrame(() => chart?.resize())
    })
  })

  // Update chart data when source changes
  watch(dataGetter, () => {
    if (chart) updateChart()
    else buildChart()
  }, { deep: true })

  // Rebuild chart when options change (orientation, legend visibility, etc.)
  if (optionsGetter) {
    watch(optionsGetter, () => buildChart(), { deep: true })
  }

  // Force resize after sidebar transitions complete (200ms = transition duration)
  function scheduleResize() {
    setTimeout(() => chart?.resize(), 220)
  }

  return { PALETTE, scheduleResize }
}
