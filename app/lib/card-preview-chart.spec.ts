import { describe, it, expect } from 'vitest'
import { cardPreviewToChart } from './card-preview-chart'
import type { CardPreview } from '@/types/catalog'

const PALETTE = ['#8b5cf6', '#3b82f6', '#10b981']

describe('cardPreviewToChart', () => {
  it('maps a single-series line preview to a filled line dataset', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020', '2021'],
      series: [{ name: 'Prix', values: [1.5, 1.6, 1.7] }],
    }
    const { type, data } = cardPreviewToChart(preview, PALETTE)
    expect(type).toBe('line')
    expect(data.labels).toEqual(['2019', '2020', '2021'])
    expect(data.datasets).toHaveLength(1)
    const ds = data.datasets[0]! as unknown as Record<string, unknown>
    expect(ds.data).toEqual([1.5, 1.6, 1.7])
    expect(ds.borderColor).toBe('#8b5cf6')
    expect(ds.fill).toBe(true)
  })

  it('maps multi-series lines to one unfilled dataset per series, palette-cycled', () => {
    const preview: CardPreview = {
      kind: 'line',
      labels: ['2019', '2020'],
      series: [
        { name: 'France', values: [1, 2] },
        { name: 'Europe', values: [3, 4] },
      ],
    }
    const { data } = cardPreviewToChart(preview, PALETTE)
    expect(data.datasets).toHaveLength(2)
    expect((data.datasets[0] as unknown as Record<string, unknown>).fill).toBe(false)
    expect((data.datasets[1] as unknown as Record<string, unknown>).borderColor).toBe('#3b82f6')
  })

  it('maps a bar preview to a bar chart with a category axis', () => {
    const preview: CardPreview = {
      kind: 'bar',
      orientation: 'vertical',
      labels: ['A', 'B'],
      series: [{ name: 'v', values: [10, 5] }],
    }
    const { type, data, options } = cardPreviewToChart(preview, PALETTE)
    expect(type).toBe('bar')
    expect((data.datasets[0] as unknown as Record<string, unknown>).backgroundColor).toBe('#8b5cf6')
    expect(options.indexAxis).toBe('x')
  })

  it('uses a y index axis for horizontal bars', () => {
    const preview: CardPreview = {
      kind: 'bar',
      orientation: 'horizontal',
      labels: ['A', 'B'],
      series: [{ name: 'v', values: [10, 5] }],
    }
    const { options } = cardPreviewToChart(preview, PALETTE)
    expect(options.indexAxis).toBe('y')
  })

  it('disables the legend and animation (mini render)', () => {
    const { options } = cardPreviewToChart(
      { kind: 'line', labels: [], series: [] },
      PALETTE,
    )
    expect(options.animation).toBe(false)
    expect(options.plugins?.legend?.display).toBe(false)
  })

  it('shows both x and y axis ticks', () => {
    const { options } = cardPreviewToChart(
      { kind: 'line', labels: ['a', 'b'], series: [{ name: 'v', values: [1, 2] }] },
      PALETTE,
    )
    const scales = options.scales as Record<string, { display?: boolean }>
    expect(scales.x?.display).toBe(true)
    expect(scales.y?.display).toBe(true)
  })
})
