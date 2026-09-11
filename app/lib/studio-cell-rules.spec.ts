import { describe, it, expect } from 'vitest'
import { cellRuleBounds, matchesCondition, cellRuleStyle, rowRuleColor, ruleConditions, ruleAggregateRefs } from './studio-cell-rules'
import type { TableCellRule } from '@/types/studio'

const rows = [
  { v: 10, w: -2, marque: 'Total' },
  { v: 40, w: 5, marque: 'Esso' },
  { v: 25, w: 0, marque: 'BP' },
] as Record<string, unknown>[]
const val = (r: Record<string, unknown>, c: string) => r[c]

describe('studio-cell-rules', () => {
  it('ruleConditions replie le schéma legacy (column/when/value) sur une liste', () => {
    expect(ruleConditions({ column: 'v', when: 'positive', color: '' } as TableCellRule)).toEqual([
      { column: 'v', when: 'positive', value: undefined, valueIsExpression: undefined },
    ])
    expect(ruleConditions({ conditions: [{ column: 'v', when: 'top' }], color: '' } as TableCellRule)).toEqual([
      { column: 'v', when: 'top' },
    ])
    expect(ruleConditions({ color: '' } as TableCellRule)).toEqual([])
  })

  it('cellRuleBounds ne calcule que pour top / bottom, sur toutes les conditions', () => {
    const rules: TableCellRule[] = [
      { column: 'v', when: 'top', color: '#0f0' },
      { column: 'w', when: '>', value: 1, color: '#f00' },
    ]
    expect(cellRuleBounds(rules, rows, val)).toEqual({ v: { min: 10, max: 40 } })
  })

  it('matchesCondition couvre signe, max / min et seuils legacy', () => {
    const b = { v: { min: 10, max: 40 } }
    expect(matchesCondition({ column: 'v', when: 'positive' }, 3, b)).toBe(true)
    expect(matchesCondition({ column: 'v', when: 'negative' }, 3, b)).toBe(false)
    expect(matchesCondition({ column: 'v', when: 'gt', value: 5 }, 6, b)).toBe(true)
    expect(matchesCondition({ column: 'v', when: 'lt', value: 5 }, 6, b)).toBe(false)
    expect(matchesCondition({ column: 'v', when: 'top' }, 40, b)).toBe(true)
    expect(matchesCondition({ column: 'v', when: 'bottom' }, 10, b)).toBe(true)
  })

  it('matchesCondition couvre les opérateurs de filtre (seuil + texte)', () => {
    const b = {}
    expect(matchesCondition({ column: 'marque', when: '=', value: 'Total' }, 'Total', b)).toBe(true)
    expect(matchesCondition({ column: 'marque', when: '!=', value: 'Total' }, 'Esso', b)).toBe(true)
    expect(matchesCondition({ column: 'marque', when: 'contains', value: 'ss' }, 'Esso', b)).toBe(true)
    expect(matchesCondition({ column: 'marque', when: 'not_contains', value: 'ss' }, 'BP', b)).toBe(true)
    expect(matchesCondition({ column: 'v', when: '>=', value: 25 }, 25, b)).toBe(true)
    expect(matchesCondition({ column: 'v', when: '<=', value: 24 }, 25, b)).toBe(false)
    // valeur manquante ⇒ pas de match
    expect(matchesCondition({ column: 'marque', when: '=' }, 'Total', b)).toBe(false)
  })

  it('matchesCondition résout `value` comme expression d\'agrégat (valueIsExpression)', () => {
    const cond = { column: 'v', when: '>' as const, value: 'AVG(v)', valueIsExpression: true }
    const refs = ruleAggregateRefs([{ conditions: [cond], color: '' } as TableCellRule])
    expect(refs).toHaveLength(1)
    const values = new Map([[refs[0]!.key, 25]])
    expect(matchesCondition(cond, 30, {}, values)).toBe(true)
    expect(matchesCondition(cond, 20, {}, values)).toBe(false)
    // Agrégat non résolu (map vide) ⇒ pas de match, jamais d'exception.
    expect(matchesCondition(cond, 30, {}, new Map())).toBe(false)
  })

  it('cellRuleStyle : toutes les conditions de la règle doivent matcher (ET), sur la 1ère colonne visée', () => {
    const rules: TableCellRule[] = [
      { column: 'v', when: 'positive', color: '#111', bold: true },
      { column: 'v', when: 'top', color: '#222' },
      { column: 'marque', when: 'contains', value: 'sso', color: '#333' },
      {
        conditions: [
          { column: 'v', when: '=', value: 25 },
          { column: 'marque', when: '=', value: 'BP' },
        ],
        color: '#multi',
      },
    ]
    const b = cellRuleBounds(rules, rows, val)
    expect(cellRuleStyle(rules, 'v', (c) => (c === 'v' ? 40 : rows[1]![c]), b)).toEqual({ color: '#222', bold: false })
    // v=25 & marque=BP (ligne 2) : la 1ère condition + la règle positive matchent, + la règle multi-conditions.
    expect(cellRuleStyle(rules, 'v', (c) => rows[2]![c], b)).toEqual({ color: '#multi', bold: false })
    expect(cellRuleStyle(rules, 'marque', (c) => rows[1]![c], b)).toEqual({ color: '#333', bold: false })
    expect(cellRuleStyle(rules, 'v', () => null, b)).toBeNull()
  })

  it('rowRuleColor renvoie la première règle dont toutes les conditions matchent la ligne', () => {
    const rules: TableCellRule[] = [
      { column: 'w', when: 'negative', color: '#red' },
      { column: 'marque', when: '=', value: 'BP', color: '#blue' },
      {
        conditions: [
          { column: 'marque', when: '=', value: 'Esso' },
          { column: 'v', when: '>', value: 30 },
        ],
        color: '#multi',
      },
    ]
    const b = cellRuleBounds(rules, rows, val)
    expect(rowRuleColor(rules, (c) => rows[0]![c], b)).toBe('#red')
    expect(rowRuleColor(rules, (c) => rows[2]![c], b)).toBe('#blue')
    // ligne 1 (Esso, v=40) : ne matche ni w<0 ni marque=BP, mais matche la règle multi-conditions.
    expect(rowRuleColor(rules, (c) => rows[1]![c], b)).toBe('#multi')
  })
})
