import { onMounted, onBeforeUnmount, nextTick, watch, computed, type Ref } from 'vue'
import { usePrefsStore } from '@/stores/prefs'
import { useBlockSkin, TRANCHES_SERIES } from '@/lib/block-skin'
import {
  Chart,
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
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

/**
 * Palette d'encre des graphiques (ticks, grille, titres d'axe, ligne de référence,
 * étiquettes de valeur). Chart.js dessine sur un canvas et n'évalue pas les
 * variables CSS ; on résout donc des couleurs concrètes selon le thème clair/sombre.
 *
 * `pluginInk` est une copie au niveau module que lisent les plugins canvas
 * (`valueLabelsPlugin`, `referenceLinePlugin`), qui ne peuvent pas recevoir de ref
 * réactive. Elle est rafraîchie à chaque évaluation de `useChartTheme()`, et les
 * blocs graphiques référencent `theme.value` dans leur `optionsGetter`, ce qui
 * force une reconstruction du graphe au changement de thème.
 */
const MONO_STUDIO = "'JetBrains Mono', monospace"
const MONO_TRANCHES = "'Geist Mono', ui-monospace, monospace"

export interface ChartInk {
  tick: string
  grid: string
  title: string
  label: string
  ref: string
  refLabel: string
  /** Famille mono des ticks / étiquettes. */
  font: string
  /** Couleurs de séries par défaut. */
  palette: string[]
  /** Habillage Tranches : traits épais, infobulle contrastée, ligne de base marquée. */
  tranches: boolean
  /** Ligne de base (axe des valeurs à 0) — contour de la charte. */
  baseline: string
  /** Fond de carte (anneau des points survolés). */
  surface: string
  tooltip: Record<string, unknown>
}

const LIGHT_INK: ChartInk = {
  tick: 'rgba(24,24,31,0.45)',
  grid: 'rgba(24,24,31,0.06)',
  title: 'rgba(24,24,31,0.55)',
  label: 'rgba(24,24,31,0.65)',
  ref: 'rgba(24,24,31,0.45)',
  refLabel: 'rgba(24,24,31,0.55)',
  font: MONO_STUDIO,
  palette: [],
  tranches: false,
  baseline: 'rgba(24,24,31,0.06)',
  surface: '#ffffff',
  tooltip: { mode: 'index', intersect: false },
}
const DARK_INK: ChartInk = {
  ...LIGHT_INK,
  tick: 'rgba(226,232,240,0.6)',
  grid: 'rgba(148,163,184,0.18)',
  title: 'rgba(226,232,240,0.75)',
  label: 'rgba(226,232,240,0.8)',
  ref: 'rgba(226,232,240,0.5)',
  refLabel: 'rgba(226,232,240,0.68)',
  baseline: 'rgba(148,163,184,0.18)',
  surface: '#0f172a',
}

/** Infobulle de la maquette : encre pleine, texte fond, coins 3px, chiffres mono. */
function tranchesTooltip(bg: string, ink: string) {
  return {
    mode: 'index',
    intersect: false,
    backgroundColor: bg,
    titleColor: ink,
    bodyColor: ink,
    cornerRadius: 3,
    padding: { x: 10, y: 7 },
    displayColors: true,
    boxWidth: 10,
    boxHeight: 10,
    boxPadding: 4,
    titleFont: { family: "'Manrope', system-ui, sans-serif", size: 12.5, weight: 700 },
    bodyFont: { family: MONO_TRANCHES, size: 12 },
  }
}

const TRANCHES_LIGHT_INK: ChartInk = {
  tick: '#5c5969',
  grid: '#e6e4ec',
  title: '#5c5969',
  label: '#0e0d13',
  ref: '#3b82f6',
  refLabel: '#1d4ed8',
  font: MONO_TRANCHES,
  palette: TRANCHES_SERIES,
  tranches: true,
  baseline: '#6d28d9',
  surface: '#ffffff',
  tooltip: tranchesTooltip('#0e0d13', '#ffffff'),
}
const TRANCHES_DARK_INK: ChartInk = {
  ...TRANCHES_LIGHT_INK,
  tick: '#a9a5b6',
  grid: '#2a2833',
  title: '#a9a5b6',
  label: '#f1f0f6',
  ref: '#93c5fd',
  refLabel: '#93c5fd',
  baseline: '#c4b5fd',
  surface: '#16151d',
  tooltip: tranchesTooltip('#f1f0f6', '#0f0e14'),
}

let pluginInk: ChartInk = LIGHT_INK

/**
 * Encre des graphiques selon le thème (clair / sombre) ET l'habillage hôte
 * (`studio` / `tranches`, voir lib/block-skin). À appeler dans le `setup` du bloc.
 */
export function useChartTheme() {
  const prefs = usePrefsStore()
  const skin = useBlockSkin()
  return computed<ChartInk>(() => {
    const dark = prefs.colorScheme === 'dark'
    const base = skin === 'tranches'
      ? (dark ? TRANCHES_DARK_INK : TRANCHES_LIGHT_INK)
      : (dark ? DARK_INK : LIGHT_INK)
    const ink = base.palette.length ? base : { ...base, palette: PALETTE }
    pluginInk = ink
    return ink
  })
}

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
    ctx.font = `600 11px ${pluginInk.font}`
    ctx.fillStyle = pluginInk.label

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

/**
 * Trace une ligne de référence horizontale (ex. moyenne nationale) sur l'axe des
 * valeurs. Opt-in via `options.plugins.referenceLine = { value, label? }`.
 */
const referenceLinePlugin: Plugin<'bar' | 'line'> = {
  id: 'referenceLine',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const opts = pluginOptions as { value?: number | null; label?: string } | undefined
    if (opts?.value === null || opts?.value === undefined || Number.isNaN(opts.value)) return

    const horizontal = chart.options.indexAxis === 'y'
    const valueScale = horizontal ? chart.scales.x : chart.scales.y
    if (!valueScale) return
    const px = valueScale.getPixelForValue(opts.value)
    const area = chart.chartArea
    const { ctx } = chart

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([5, 4])
    ctx.lineWidth = pluginInk.tranches ? 2 : 1.5
    ctx.strokeStyle = pluginInk.ref
    if (horizontal) {
      ctx.moveTo(px, area.top)
      ctx.lineTo(px, area.bottom)
    } else {
      ctx.moveTo(area.left, px)
      ctx.lineTo(area.right, px)
    }
    ctx.stroke()
    if (opts.label) {
      ctx.setLineDash([])
      ctx.font = `600 10px ${pluginInk.font}`
      ctx.fillStyle = pluginInk.refLabel
      ctx.textAlign = horizontal ? 'center' : 'right'
      ctx.textBaseline = 'bottom'
      if (horizontal) ctx.fillText(opts.label, px, area.top + 10)
      else ctx.fillText(opts.label, area.right - 2, px - 3)
    }
    ctx.restore()
  },
}

Chart.register(
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  valueLabelsPlugin,
  referenceLinePlugin,
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
