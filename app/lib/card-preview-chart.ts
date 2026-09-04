import type { ChartData, ChartOptions } from 'chart.js'
import type { CardPreview } from '@/types/catalog'

const MONO = "'JetBrains Mono', monospace"
const TICK_COLOR = 'rgba(24,24,31,0.4)'

export type MiniChartType = 'line' | 'bar'

export interface MiniChartConfig {
  type: MiniChartType
  data: ChartData
  options: ChartOptions
}

/**
 * Convertit un `CardPreview` réel en config Chart.js, afin que le mini-graphe d'une
 * carte de catalogue s'affiche avec la même librairie que les blocs graphiques du
 * Studio (`useChart`). Ne gère que `line` et `bar` : le type `pie` conserve son rendu
 * en `conic-gradient`, identique au `PieChartBlock` du Studio.
 */
export function cardPreviewToChart(
  preview: CardPreview,
  palette: string[],
  opts: { spark?: boolean } = {},
): MiniChartConfig {
  const spark = opts.spark === true
  const labels = preview.labels ?? []
  const series = preview.series ?? []
  const type: MiniChartType = preview.kind === 'bar' ? 'bar' : 'line'
  const horizontal = type === 'bar' && preview.orientation === 'horizontal'
  const single = series.length === 1
  const color = (i: number) => palette[i % palette.length] ?? '#8b5cf6'

  const datasets = series.map((s, i) => {
    const c = color(i)
    if (type === 'bar') {
      return {
        label: s.name,
        data: s.values,
        backgroundColor: c,
        borderRadius: spark ? 1.5 : 3,
        borderSkipped: false,
      }
    }
    return {
      label: s.name,
      data: s.values,
      borderColor: c,
      backgroundColor: single ? `${c}22` : 'transparent',
      borderWidth: spark ? 1.5 : 2,
      fill: single,
      tension: 0.35,
      pointRadius: 0,
    }
  })

  const tickFont = { family: MONO, size: 9 } as const

  if (spark) {
    // Variante « sparkline » : aucun axe ni interaction — juste la forme de la série,
    // pour les contextes très compacts (bandeau Tendances…).
    return {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        indexAxis: horizontal ? 'y' : 'x',
        layout: { padding: 1 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: type === 'bar' },
        },
        elements: { point: { radius: 0 } },
      },
    }
  }

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: tickFont,
          color: TICK_COLOR,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: horizontal ? 4 : 6,
        },
      },
      y: {
        display: true,
        grid: { color: 'rgba(24,24,31,0.06)' },
        border: { display: false },
        ticks: {
          font: tickFont,
          color: TICK_COLOR,
          autoSkip: true,
          maxTicksLimit: horizontal ? 6 : 4,
        },
      },
    },
  }

  return { type, data: { labels, datasets }, options }
}
