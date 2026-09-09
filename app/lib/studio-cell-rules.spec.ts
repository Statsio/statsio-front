import { describe, it, expect } from 'vitest'
import { cellRuleBounds, matchesCellRule, cellRuleStyle, rowRuleColor } from './studio-cell-rules'
import type { TableCellRule } from '@/types/studio'

const rows = [
  { v: 10, w: -2, marque: 'Total' },
  { v: 40, w: 5, marque: 'Esso' },
  { v: 25, w: 0, marque: 'BP' },
] as Record<string, unknown>[]
const val = (r: Record<string, unknown>, c: string) => r[c]

describe('studio-cell-rules', () => {
  it('cellRuleBounds ne calcule que pour top / bottom', () => {
    const rules: TableCellRule[] = [
      { column: 'v', when: 'top', color: '#0f0' },
      { column: 'w', when: '>', value: 1, color: '#f00' },
    ]
    expect(cellRuleBounds(rules, rows, val)).toEqual({ v: { min: 10, max: 40 } })
  })

  it('matchesCellRule couvre signe, max / min et seuils legacy', () => {
    const b = { v: { min: 10, max: 40 } }
    expect(matchesCellRule({ column: 'v', when: 'positive', color: '' }, 3, b)).toBe(true)
    expect(matchesCellRule({ column: 'v', when: 'negative', color: '' }, 3, b)).toBe(false)
    expect(matchesCellRule({ column: 'v', when: 'gt', value: 5, color: '' }, 6, b)).toBe(true)
    expect(matchesCellRule({ column: 'v', when: 'lt', value: 5, color: '' }, 6, b)).toBe(false)
    expect(matchesCellRule({ column: 'v', when: 'top', color: '' }, 40, b)).toBe(true)
    expect(matchesCellRule({ column: 'v', when: 'bottom', color: '' }, 10, b)).toBe(true)
  })

  it('matchesCellRule couvre les opérateurs de filtre (seuil + texte)', () => {
    const b = {}
    expect(matchesCellRule({ column: 'marque', when: '=', value: 'Total', color: '' }, 'Total', b)).toBe(true)
    expect(matchesCellRule({ column: 'marque', when: '!=', value: 'Total', color: '' }, 'Esso', b)).toBe(true)
    expect(matchesCellRule({ column: 'marque', when: 'contains', value: 'ss', color: '' }, 'Esso', b)).toBe(true)
    expect(matchesCellRule({ column: 'marque', when: 'not_contains', value: 'ss', color: '' }, 'BP', b)).toBe(true)
    expect(matchesCellRule({ column: 'v', when: '>=', value: 25, color: '' }, 25, b)).toBe(true)
    expect(matchesCellRule({ column: 'v', when: '<=', value: 24, color: '' }, 25, b)).toBe(false)
    // valeur manquante ⇒ pas de match
    expect(matchesCellRule({ column: 'marque', when: '=', color: '' }, 'Total', b)).toBe(false)
  })

  it('cellRuleStyle renvoie la dernière règle qui matche la colonne', () => {
    const rules: TableCellRule[] = [
      { column: 'v', when: 'positive', color: '#111', bold: true },
      { column: 'v', when: 'top', color: '#222' },
      { column: 'marque', when: 'contains', value: 'sso', color: '#333' },
    ]
    const b = cellRuleBounds(rules, rows, val)
    expect(cellRuleStyle(rules, 'v', 40, b)).toEqual({ color: '#222', bold: false })
    expect(cellRuleStyle(rules, 'v', 25, b)).toEqual({ color: '#111', bold: true })
    expect(cellRuleStyle(rules, 'marque', 'Esso', b)).toEqual({ color: '#333', bold: false })
    expect(cellRuleStyle(rules, 'v', null, b)).toBeNull()
  })

  it('rowRuleColor renvoie la première règle qui matche une colonne de la ligne', () => {
    const rules: TableCellRule[] = [
      { column: 'w', when: 'negative', color: '#red' },
      { column: 'marque', when: '=', value: 'BP', color: '#blue' },
    ]
    const b = cellRuleBounds(rules, rows, val)
    expect(rowRuleColor(rules, (c) => rows[0]![c], b)).toBe('#red')
    expect(rowRuleColor(rules, (c) => rows[2]![c], b)).toBe('#blue')
    expect(rowRuleColor(rules, (c) => rows[1]![c], b)).toBeNull()
  })
})
