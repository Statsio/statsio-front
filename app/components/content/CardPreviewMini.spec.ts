import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardPreviewMini from './CardPreviewMini.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { CardPreview } from '@/types/catalog'

describe('CardPreviewMini', () => {
  it('line + single series → renders AppSparkline with the real points', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020', '2021'],
      series: [{ name: 'Prix', values: [1.5, 1.6, 1.7] }],
      unit: ' €',
    }
    const w = mount(CardPreviewMini, { props: { preview } })
    const spark = w.findComponent(AppSparkline)
    expect(spark.exists()).toBe(true)
    expect(spark.props('points')).toEqual([1.5, 1.6, 1.7])
    expect(spark.props('labels')).toEqual(['2019', '2020', '2021'])
  })

  it('bar + single series → one bar per value, heights proportional', () => {
    const preview: CardPreview = {
      kind: 'bar',
      orientation: 'vertical',
      labels: ['A', 'B', 'C'],
      series: [{ name: 'v', values: [10, 5, 0] }],
    }
    const w = mount(CardPreviewMini, { props: { preview } })
    const bars = w.findAll('span[style*="height"]')
    expect(bars.length).toBe(3)
    expect(bars[0]!.attributes('style')).toContain('height: 100%')
  })

  it('pie → conic-gradient slices summing to 100% and a legend', () => {
    const preview: CardPreview = {
      kind: 'pie',
      labels: ['a', 'b', 'c', 'd'],
      series: [{ name: 'r', values: [50, 30, 15, 5] }],
    }
    const w = mount(CardPreviewMini, { props: { preview } })
    expect(w.html()).toContain('conic-gradient')
    expect(w.text()).toContain('50 %')
    expect(w.text()).toContain('a')
  })

  it('multi-series → one polyline per series and a legend', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020'],
      series: [
        { name: 'France', values: [1, 2] },
        { name: 'Europe', values: [3, 4] },
      ],
    }
    const w = mount(CardPreviewMini, { props: { preview } })
    expect(w.findComponent(AppSparkline).exists()).toBe(false)
    expect(w.findAll('polyline').length).toBe(2)
    expect(w.text()).toContain('France')
    expect(w.text()).toContain('Europe')
  })
})
