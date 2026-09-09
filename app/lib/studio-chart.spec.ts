import { describe, it, expect } from 'vitest'
import { buildChartSeries, markColor } from './studio-chart'
import type { BlockQueryResult, ChartMarkRule, FieldMapping, StudioBlock } from '@/types/studio'

const ctx = { min: 1, max: 10, ref: 5 }

describe('markColor', () => {
  it('returns the fallback when there are no rules or the value is null', () => {
    expect(markColor(undefined, 3, ctx, '#000')).toBe('#000')
    expect(markColor([], 3, ctx, '#000')).toBe('#000')
    expect(markColor([{ when: 'positive', color: '#f00' }], null, ctx, '#000')).toBe('#000')
  })

  it('applies the first matching rule', () => {
    const rules: ChartMarkRule[] = [
      { when: 'above-ref', color: '#a' },
      { when: 'top', color: '#b' },
    ]
    expect(markColor(rules, 10, ctx, '#000')).toBe('#a') // > ref wins (first)
    expect(markColor(rules, 4, ctx, '#000')).toBe('#000') // below ref, not top
  })

  it('handles every operator', () => {
    expect(markColor([{ when: 'positive', color: '#p' }], 2, ctx, '#x')).toBe('#p')
    expect(markColor([{ when: 'negative', color: '#n' }], -2, ctx, '#x')).toBe('#n')
    expect(markColor([{ when: 'gt', value: 3, color: '#g' }], 4, ctx, '#x')).toBe('#g')
    expect(markColor([{ when: 'lt', value: 3, color: '#l' }], 2, ctx, '#x')).toBe('#l')
    expect(markColor([{ when: 'top', color: '#t' }], 10, ctx, '#x')).toBe('#t')
    expect(markColor([{ when: 'bottom', color: '#b' }], 1, ctx, '#x')).toBe('#b')
    expect(markColor([{ when: 'below-ref', color: '#u' }], 2, ctx, '#x')).toBe('#u')
  })

  it('never matches ref rules when ref is null', () => {
    expect(markColor([{ when: 'above-ref', color: '#a' }], 9, { min: 1, max: 10, ref: null }, '#x')).toBe('#x')
  })
})

// ─── buildChartSeries ──────────────────────────────────────────────────────

const datasets = { getSchema: () => null, readyDatasets: [] as { id: string; name: string }[] }

function block(fieldMapping: FieldMapping, config: StudioBlock['config'] = {}): StudioBlock {
  return { id: 'b', type: 'line', zoneId: 'z', fieldMapping, config } as StudioBlock
}
function result(rows: Record<string, unknown>[]): BlockQueryResult {
  return { columns: Object.keys(rows[0] ?? {}), rows, totalRows: rows.length }
}

describe('buildChartSeries', () => {
  it('format large : une série par colonne, lignes telles quelles', () => {
    const { labels, series } = buildChartSeries(
      block({ xAxis: 'annee', yAxes: ['h', 'f'] }),
      result([
        { annee: 2020, h: 10, f: 8 },
        { annee: 2021, h: 12, f: 9 },
      ]),
      datasets,
    )
    expect(labels).toEqual(['2020', '2021'])
    expect(series.map((s) => s.label)).toEqual(['h', 'f'])
    expect(series[0]!.values).toEqual([10, 12])
    expect(series[1]!.values).toEqual([8, 9])
    expect(series.map((s) => s.colorIndex)).toEqual([0, 1])
  })

  it('format long : une série par valeur distincte de la colonne de regroupement', () => {
    const { labels, series } = buildChartSeries(
      block({ xAxis: 'annee', yAxis: 'effectif', series: 'sexe' }),
      result([
        { annee: 2020, sexe: 'M', effectif: 10 },
        { annee: 2020, sexe: 'F', effectif: 8 },
        { annee: 2021, sexe: 'M', effectif: 12 },
      ]),
      datasets,
    )
    expect(labels).toEqual(['2020', '2021'])
    expect(series.map((s) => s.label)).toEqual(['M', 'F'])
    expect(series[0]!.values).toEqual([10, 12])
    expect(series[1]!.values).toEqual([8, 0]) // F absente en 2021 → 0
  })

  it('croisé : une série par (colonne × valeur), libellée « Colonne · Valeur »', () => {
    const { series } = buildChartSeries(
      block({ xAxis: 'annee', yAxes: ['h', 'f'], series: 'region' }),
      result([
        { annee: 2020, region: 'Nord', h: 1, f: 2 },
        { annee: 2020, region: 'Sud', h: 3, f: 4 },
      ]),
      datasets,
    )
    expect(series.map((s) => s.label)).toEqual(['h · Nord', 'h · Sud', 'f · Nord', 'f · Sud'])
    expect(series.map((s) => s.values[0])).toEqual([1, 3, 2, 4])
    expect(series.map((s) => s.colorIndex)).toEqual([0, 1, 2, 3])
  })

  it('respecte config.seriesLimit', () => {
    const { series } = buildChartSeries(
      block({ xAxis: 'annee', yAxis: 'v', series: 'sexe' }, { seriesLimit: 1 }),
      result([
        { annee: 2020, sexe: 'M', v: 1 },
        { annee: 2020, sexe: 'F', v: 2 },
      ]),
      datasets,
    )
    expect(series).toHaveLength(1)
    expect(series[0]!.label).toBe('M')
  })

  it('applique les libellés de valeurs (valueLabels) aux séries groupées', () => {
    const { series } = buildChartSeries(
      block({ xAxis: 'annee', yAxis: 'v', series: 'sexe', valueLabels: { sexe: { M: 'Hommes', F: 'Femmes' } } }),
      result([
        { annee: 2020, sexe: 'M', v: 1 },
        { annee: 2020, sexe: 'F', v: 2 },
      ]),
      datasets,
    )
    expect(series.map((s) => s.label)).toEqual(['Hommes', 'Femmes'])
  })
})
