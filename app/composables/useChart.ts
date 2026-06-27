import { ref, onMounted, onBeforeUnmount, nextTick, watch, type Ref } from 'vue'
import {
  Chart,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartType,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

Chart.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

const PALETTE = [
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

  // Force resize after sidebar transitions complete (200ms = transition duration)
  function scheduleResize() {
    setTimeout(() => chart?.resize(), 220)
  }

  return { PALETTE, scheduleResize }
}
