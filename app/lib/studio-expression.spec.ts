import { describe, it, expect } from 'vitest'
import { isExpressionToken, parseExpression, evaluate, formatNumber } from './studio-expression'

describe('isExpressionToken', () => {
  it('detects a function call, not a plain variable', () => {
    expect(isExpressionToken('carburant')).toBe(false)
    expect(isExpressionToken('Code postal')).toBe(false)
    expect(isExpressionToken('AVG(prix@7)')).toBe(true)
    expect(isExpressionToken('max( x )')).toBe(true)
  })
})

describe('parseExpression', () => {
  it('parses a single aggregate with an explicit dataset', () => {
    const p = parseExpression('AVG(prix@7)')!
    expect(p.aggregates).toHaveLength(1)
    expect(p.aggregates[0]).toMatchObject({ fn: 'avg', column: 'prix', datasetId: '7', filters: [] })
  })

  it('parses arithmetic between two aggregates and dedupes refs', () => {
    const p = parseExpression('MAX(prix@7) - MIN(prix@7)')!
    expect(p.aggregates).toHaveLength(2)
    const vals = new Map([[p.aggregates[0]!.key, 1.9], [p.aggregates[1]!.key, 1.5]])
    expect(evaluate(p.node, vals)).toBeCloseTo(0.4)
  })

  it('handles parentheses, literals and a trailing decimals hint', () => {
    const p = parseExpression('(MAX(x@1) - MIN(x@1)) * 100 : 0')!
    expect(p.decimals).toBe(0)
    const vals = new Map([[p.aggregates[0]!.key, 1.9], [p.aggregates[1]!.key, 1.72]])
    expect(evaluate(p.node, vals)).toBeCloseTo(18)
  })

  it('parses filters and resolves $param references', () => {
    const p = parseExpression('AVG(prix@7 | carburant = $carburant & annee >= 2020)', (n) => (n === 'carburant' ? 'gazole' : undefined))!
    expect(p.aggregates[0]!.filters).toEqual([
      { column: 'carburant', operator: '=', value: 'gazole' },
      { column: 'annee', operator: '>=', value: '2020' },
    ])
  })

  it('parses filter operators without surrounding spaces', () => {
    const p = parseExpression('(MAX(prix@8|carburant=$c) - MIN(prix@8|carburant=$c)):2', (n) => (n === 'c' ? 'Gazole' : undefined))!
    expect(p.decimals).toBe(2)
    expect(p.aggregates.map((a) => [a.fn, a.filters])).toEqual([
      ['max', [{ column: 'carburant', operator: '=', value: 'Gazole' }]],
      ['min', [{ column: 'carburant', operator: '=', value: 'Gazole' }]],
    ])
  })

  it('accepts quoted column names with spaces', () => {
    const p = parseExpression('SUM("prix moyen"@3)')!
    expect(p.aggregates[0]!.column).toBe('prix moyen')
  })

  it('parses {col} row-references for computed table columns and evaluates them per row', () => {
    const p = parseExpression('{prix} - AVG(prix@7)')!
    expect(p.columns).toEqual(['prix'])
    expect(p.aggregates).toHaveLength(1)
    const agg = new Map([[p.aggregates[0]!.key, 1.7]])
    const row = new Map([['prix', 1.9]])
    expect(evaluate(p.node, agg, row)).toBeCloseTo(0.2)
  })

  it('parses a {col}-only expression (no aggregate)', () => {
    const p = parseExpression('{a} - {b}')!
    expect(p.columns).toEqual(['a', 'b'])
    expect(evaluate(p.node, new Map(), new Map([['a', 10], ['b', 3]]))).toBe(7)
  })

  it('returns null for a plain variable or invalid syntax', () => {
    expect(parseExpression('carburant')).toBeNull()
    expect(parseExpression('AVG(')).toBeNull()
    expect(parseExpression('AVG(x@7) +')).toBeNull()
  })

  it('propagates null (missing aggregate) through arithmetic', () => {
    const p = parseExpression('AVG(x@1) * 2')!
    expect(evaluate(p.node, new Map())).toBeNull()
  })
})

describe('formatNumber', () => {
  it('uses French formatting, integer when round, 2 decimals otherwise', () => {
    expect(formatNumber(18)).toBe('18')
    expect(formatNumber(1.712)).toBe('1,71')
    expect(formatNumber(2382.5, 0)).toBe('2 383')
  })
})
