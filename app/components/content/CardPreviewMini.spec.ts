import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardPreviewMini from './CardPreviewMini.vue'
import StatsDataMiniChart from './StatsDataMiniChart.vue'
import type { CardPreview } from '@/types/catalog'

// Chart.js draws to a <canvas>; stub the Chart.js-backed mini-chart so these tests
// stay on the mapping/branching logic of CardPreviewMini itself.
const mountMini = (preview: CardPreview, props: Record<string, unknown> = {}) =>
  mount(CardPreviewMini, {
    props: { preview, ...props },
    global: { stubs: { StatsDataMiniChart: true } },
  })

describe('CardPreviewMini', () => {
  it('line + single series → renders StatsDataMiniChart with the preview, no legend', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020', '2021'],
      series: [{ name: 'Prix', values: [1.5, 1.6, 1.7] }],
      unit: ' €',
    }
    const w = mountMini(preview)
    const chart = w.findComponent(StatsDataMiniChart)
    expect(chart.exists()).toBe(true)
    expect(chart.props('preview')).toEqual(preview)
    expect(chart.props('palette')).toBeInstanceOf(Array)
  })

  it('bar + single series → still routed through StatsDataMiniChart', () => {
    const preview: CardPreview = {
      kind: 'bar',
      orientation: 'vertical',
      labels: ['A', 'B', 'C'],
      series: [{ name: 'v', values: [10, 5, 0] }],
    }
    const w = mountMini(preview)
    expect(w.findComponent(StatsDataMiniChart).exists()).toBe(true)
  })

  it('pie → conic-gradient slices summing to 100% and a legend (no canvas)', () => {
    const preview: CardPreview = {
      kind: 'pie',
      labels: ['a', 'b', 'c', 'd'],
      series: [{ name: 'r', values: [50, 30, 15, 5] }],
    }
    const w = mountMini(preview)
    expect(w.findComponent(StatsDataMiniChart).exists()).toBe(false)
    expect(w.html()).toContain('conic-gradient')
    expect(w.text()).toContain('50 %')
    expect(w.text()).toContain('a')
  })

  it('multi-series → StatsDataMiniChart + an HTML legend with every series name', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020'],
      series: [
        { name: 'France', values: [1, 2] },
        { name: 'Europe', values: [3, 4] },
      ],
    }
    const w = mountMini(preview)
    expect(w.findComponent(StatsDataMiniChart).exists()).toBe(true)
    expect(w.text()).toContain('France')
    expect(w.text()).toContain('Europe')
  })

  it('uses an explicit label over everything else in the header', () => {
    const preview: CardPreview = {
      kind: 'line',
      title: 'Titre du bloc',
      labels: ['2019'],
      series: [{ name: 'Prix', values: [1] }],
    }
    const w = mountMini(preview, { label: 'ÉNERGIE' })
    expect(w.text()).toContain('ÉNERGIE')
  })

  it('falls back to the real Studio block title when no explicit label is given', () => {
    const preview: CardPreview = {
      kind: 'line',
      title: 'Évolution du prix moyen',
      labels: ['2019', '2020'],
      series: [{ name: 'val', values: [1, 2] }],
    }
    const w = mountMini(preview)
    expect(w.text()).toContain('Évolution du prix moyen')
  })

  it('renders no header label when the block has no title (no "Valeur" fallback)', () => {
    const preview: CardPreview = {
      kind: 'line',
      title: '',
      labels: ['2019', '2020'],
      series: [{ name: 'Valeur', values: [1, 2] }],
    }
    const w = mountMini(preview)
    expect(w.text().trim()).not.toContain('Valeur')
    expect(w.text().trim()).not.toContain('Aperçu')
  })
})
