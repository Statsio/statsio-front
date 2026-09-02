import { describe, it, expect } from 'vitest'
import { aggTermsToExpression, aggregateFor, expressionToAggTerms, valueColumnsFor, withAggregate } from './studio-aggregates'
import type { StudioBlock } from '@/types/studio'

function block(type: StudioBlock['type'], fieldMapping: StudioBlock['fieldMapping']): StudioBlock {
  return { id: 'b1', type, zoneId: 'z', fieldMapping, config: {} }
}

describe('valueColumnsFor', () => {
  it('returns yAxes for bar/line (falls back to yAxis)', () => {
    expect(valueColumnsFor(block('bar', { yAxes: ['a', 'b'] }))).toEqual(['a', 'b'])
    expect(valueColumnsFor(block('line', { yAxis: 'a' }))).toEqual(['a'])
  })
  it('returns value for pie, valueColumn for kpi', () => {
    expect(valueColumnsFor(block('pie', { value: 'v' }))).toEqual(['v'])
    expect(valueColumnsFor(block('kpi', { valueColumn: 'k' }))).toEqual(['k'])
  })
})

describe('aggregateFor', () => {
  it('reads the per-column entry, falling back to the legacy uniform aggregate', () => {
    expect(aggregateFor({ aggregates: [{ column: 'a', fn: 'sum' }] }, 'a')).toBe('sum')
    expect(aggregateFor({ aggregate: 'avg' }, 'a')).toBe('avg')
    expect(aggregateFor({}, 'a')).toBeUndefined()
  })
})

describe('withAggregate', () => {
  it('rebuilds aggregates[] for every value column and drops the legacy field', () => {
    const b = block('bar', { yAxes: ['a', 'b'], aggregate: 'sum' })
    const patch = withAggregate(b, 'b', 'avg')
    expect(patch.aggregate).toBeUndefined()
    expect(patch.aggregates).toEqual([
      { column: 'a', fn: 'sum' }, // hérité du legacy `aggregate`
      { column: 'b', fn: 'avg' },
    ])
  })

  it('purges a column when set to "" and returns undefined when empty', () => {
    const b = block('kpi', { valueColumn: 'k', aggregates: [{ column: 'k', fn: 'sum' }] })
    expect(withAggregate(b, 'k', '').aggregates).toBeUndefined()
  })
})

describe('aggTermsToExpression', () => {
  it('flat chain of aggregates', () => {
    expect(aggTermsToExpression([
      { fn: 'max', column: 'prix' },
      { op: '-', fn: 'min', column: 'prix' },
    ])).toBe('MAX("prix") - MIN("prix")')
  })
  it('quotes calc refs and skips empty columns', () => {
    expect(aggTermsToExpression([{ fn: 'sum', column: 'calc:x' }, { op: '+', fn: 'sum', column: '' }]))
      .toBe('SUM("calc:x")')
  })
})

describe('expressionToAggTerms', () => {
  it('round-trips a flat aggregate chain', () => {
    expect(expressionToAggTerms('MAX(prix) - MIN(prix)')).toEqual([
      { fn: 'max', column: 'prix' },
      { op: '-', fn: 'min', column: 'prix' },
    ])
  })
  it('handles quoted columns and division', () => {
    expect(expressionToAggTerms('SUM("a") / SUM("b")')).toEqual([
      { fn: 'sum', column: 'a' },
      { op: '/', fn: 'sum', column: 'b' },
    ])
  })
  it('returns null for expressions with parens / literals / filters', () => {
    expect(expressionToAggTerms('(MAX(a) - MIN(a)) * 100')).toBeNull()
    expect(expressionToAggTerms('AVG(a@7 | x = 1)')).toBeNull()
    expect(expressionToAggTerms('AVG(a) * 50')).toBeNull()
  })
})
