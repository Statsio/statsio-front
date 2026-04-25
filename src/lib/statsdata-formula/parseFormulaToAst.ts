import type { StatsDataFormulaAst } from '@/types/statsdata-query-v2'
import type { FormulaToken } from './types'

export function parseFormulaToAst(tokens: FormulaToken[]): StatsDataFormulaAst {
  let i = 0
  const peek = () => tokens[i]
  const next = () => tokens[i++]

  const expect = (kind: FormulaToken['kind']) => {
    const t = next()
    if (!t || t.kind !== kind) throw new Error('Expression invalide.')
    return t as any
  }

  const parsePrimary = (): StatsDataFormulaAst => {
    const t = peek()
    if (!t) throw new Error('Expression invalide.')
    if (t.kind === 'number') {
      next()
      return { kind: 'number', value: t.value }
    }
    if (t.kind === 'string') {
      next()
      return { kind: 'string', value: t.value }
    }
    if (t.kind === 'ref') {
      next()
      return { kind: 'ref', ref: t.ref }
    }
    if (t.kind === 'ident') {
      const name = t.name
      next()
      const after = peek()
      if (!after || after.kind !== 'lparen') throw new Error(`Fonction invalide: ${name}`)
      next() // (
      const args: StatsDataFormulaAst[] = []
      if (peek() && peek()!.kind !== 'rparen') {
        args.push(parseExpr())
        while (peek() && peek()!.kind === 'comma') {
          next()
          args.push(parseExpr())
        }
      }
      expect('rparen')
      return { kind: 'fn', fn: name as any, args }
    }
    if (t.kind === 'lparen') {
      next()
      const e = parseExpr()
      expect('rparen')
      return e
    }
    throw new Error('Expression invalide.')
  }

  const parseUnary = (): StatsDataFormulaAst => {
    const t = peek()
    if (t && t.kind === 'op' && t.op === 'sub') {
      next()
      return { kind: 'op', op: 'neg', args: [parseUnary()] }
    }
    return parsePrimary()
  }

  const parseMulDiv = (): StatsDataFormulaAst => {
    let left = parseUnary()
    while (true) {
      const t = peek()
      if (!t || t.kind !== 'op' || (t.op !== 'mul' && t.op !== 'div')) break
      next()
      const right = parseUnary()
      left = { kind: 'op', op: t.op, args: [left, right] }
    }
    return left
  }

  const parseAddSub = (): StatsDataFormulaAst => {
    let left = parseMulDiv()
    while (true) {
      const t = peek()
      if (!t || t.kind !== 'op' || (t.op !== 'add' && t.op !== 'sub')) break
      next()
      const right = parseMulDiv()
      left = { kind: 'op', op: t.op, args: [left, right] }
    }
    return left
  }

  const parseExpr = (): StatsDataFormulaAst => parseAddSub()

  const expr = parseExpr()
  if (i < tokens.length) throw new Error('Expression invalide.')
  return expr
}

