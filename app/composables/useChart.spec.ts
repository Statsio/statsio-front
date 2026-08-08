import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import type { ChartData } from 'chart.js'

class MockChart {
  static register = vi.fn()
  static instances: MockChart[] = []
  data: ChartData
  options: unknown
  update = vi.fn()
  resize = vi.fn()
  destroy = vi.fn()

  constructor(
    public canvas: unknown,
    config: { data: ChartData; options: unknown },
  ) {
    this.data = config.data
    this.options = config.options
    MockChart.instances.push(this)
  }
}

vi.mock('chart.js', () => ({
  Chart: MockChart,
  BarController: {},
  LineController: {},
  PieController: {},
  CategoryScale: {},
  LinearScale: {},
  LogarithmicScale: {},
  BarElement: {},
  LineElement: {},
  PointElement: {},
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}))

const { useChart } = await import('./useChart')

async function flushChartBuild() {
  // useChart schedules buildChart via: await nextTick(); requestAnimationFrame(() => { build; requestAnimationFrame(resize) })
  await nextTick()
  await vi.advanceTimersByTimeAsync(50)
}

function mountChart(dataGetter: () => ChartData, optionsGetter?: () => Record<string, unknown>) {
  const Host = defineComponent({
    setup() {
      const canvasRef = ref<HTMLCanvasElement | null>(null)
      const chart = useChart(canvasRef, 'bar', dataGetter, optionsGetter)
      return { canvasRef, chart }
    },
    render() {
      return h('canvas', { ref: 'canvasRef' })
    },
  })
  return mount(Host, { attachTo: document.body })
}

describe('useChart', () => {
  beforeEach(() => {
    MockChart.instances.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds a chart on mount once the canvas is available', async () => {
    const wrapper = mountChart(() => ({ datasets: [{ data: [1, 2, 3] }] }) as unknown as ChartData)
    await flushChartBuild()

    // The mount-time canvasRef watcher and the onMounted hook both schedule a build,
    // so at least one (possibly two) Chart instances are created — assert on the last
    // one, which is what the composable's internal `chart` reference ends up pointing to.
    expect(MockChart.instances.length).toBeGreaterThanOrEqual(1)
    expect(MockChart.instances.at(-1)!.data.datasets).toHaveLength(1)
    wrapper.unmount()
  })

  it('rebuilds (destroy + new Chart) when the dataset count changes', async () => {
    const datasetsRef = ref<unknown[]>([{ data: [1] }])
    const wrapper = mountChart(() => ({ datasets: datasetsRef.value }) as unknown as ChartData)
    await flushChartBuild()
    const countAfterMount = MockChart.instances.length
    const activeInstance = MockChart.instances.at(-1)!

    datasetsRef.value = [{ data: [1] }, { data: [2] }]
    await nextTick()

    expect(activeInstance.destroy).toHaveBeenCalled()
    expect(MockChart.instances).toHaveLength(countAfterMount + 1)
    expect(MockChart.instances.at(-1)!.data.datasets).toHaveLength(2)
    wrapper.unmount()
  })

  it('updates the existing chart in place (no rebuild) when the dataset count is unchanged', async () => {
    const valueRef = ref(1)
    const wrapper = mountChart(() => ({ datasets: [{ data: [valueRef.value] }] }) as unknown as ChartData)
    await flushChartBuild()
    const countAfterMount = MockChart.instances.length
    const activeInstance = MockChart.instances.at(-1)!
    activeInstance.update.mockClear()

    valueRef.value = 2
    await nextTick()

    expect(activeInstance.destroy).not.toHaveBeenCalled()
    expect(activeInstance.update).toHaveBeenCalledWith('none')
    expect(MockChart.instances).toHaveLength(countAfterMount)
    wrapper.unmount()
  })

  it('destroys the active chart on unmount', async () => {
    const wrapper = mountChart(() => ({ datasets: [{ data: [1] }] }) as unknown as ChartData)
    await flushChartBuild()
    const activeInstance = MockChart.instances.at(-1)!

    wrapper.unmount()

    expect(activeInstance.destroy).toHaveBeenCalled()
  })

  it('scheduleResize debounces a resize call via a 220ms timeout', async () => {
    const wrapper = mountChart(() => ({ datasets: [{ data: [1] }] }) as unknown as ChartData)
    await flushChartBuild()
    const instance = MockChart.instances.at(-1)!
    // The mount sequence itself already chains a resize() call — reset the spy so this
    // test only observes the resize triggered by our own scheduleResize() call below.
    instance.resize.mockClear()
    const vm = wrapper.vm as unknown as { chart: { scheduleResize: () => void } }

    vm.chart.scheduleResize()
    await vi.advanceTimersByTimeAsync(100)
    expect(instance.resize).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)
    expect(instance.resize).toHaveBeenCalled()
    wrapper.unmount()
  })
})
