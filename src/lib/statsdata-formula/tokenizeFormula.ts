import type { FormulaToken } from './types'

export function tokenizeFormula(input: string): FormulaToken[] {
  const out: FormulaToken[] = []
  let i = 0
  // Normalize common unicode variants (copy/paste, IME).
  const s = (input ?? '')
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/\u202F/g, ' ') // narrow nbsp
    .replace(/\u200B/g, '') // zero-width space
    .replace(/＋/g, '+') // fullwidth plus
    .replace(/﹢/g, '+')
    .replace(/－/g, '-') // fullwidth minus
    .replace(/＊/g, '*') // fullwidth asterisk
    .replace(/／/g, '/') // fullwidth slash
    .trim()

  while (i < s.length) {
    const ch = s[i]!
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (ch === ',') {
      out.push({ kind: 'comma' })
      i++
      continue
    }
    // Accept common typographic operator variants.
    if (ch === '×') {
      out.push({ kind: 'op', op: 'mul' })
      i++
      continue
    }
    if (ch === '÷') {
      out.push({ kind: 'op', op: 'div' })
      i++
      continue
    }
    if (ch === '−' || ch === '–') {
      out.push({ kind: 'op', op: 'sub' })
      i++
      continue
    }
    if (ch === '(') {
      out.push({ kind: 'lparen' })
      i++
      continue
    }
    if (ch === ')') {
      out.push({ kind: 'rparen' })
      i++
      continue
    }
    if (ch === '+') {
      out.push({ kind: 'op', op: 'add' })
      i++
      continue
    }
    if (ch === '-') {
      out.push({ kind: 'op', op: 'sub' })
      i++
      continue
    }
    if (ch === '*') {
      out.push({ kind: 'op', op: 'mul' })
      i++
      continue
    }
    if (ch === '/') {
      out.push({ kind: 'op', op: 'div' })
      i++
      continue
    }
    if (ch === '[') {
      const end = s.indexOf(']', i + 1)
      if (end === -1) throw new Error('Référence invalide: `]` manquant. Utilise le format [Nom de colonne].')
      const name = s.slice(i + 1, end).trim()
      if (!name) throw new Error('Référence invalide: vide. Utilise le format [Nom de colonne].')
      out.push({ kind: 'ref', ref: name })
      i = end + 1
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      let buf = ''
      while (i < s.length) {
        const c = s[i]!
        if (c === '\\' && i + 1 < s.length) {
          const n = s[i + 1]!
          buf += n
          i += 2
          continue
        }
        if (c === quote) break
        buf += c
        i++
      }
      if (i >= s.length || s[i] !== quote) throw new Error('Chaîne invalide: guillemet manquant.')
      i++
      out.push({ kind: 'string', value: buf })
      continue
    }
    const identMatch = s.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    if (identMatch) {
      const name = identMatch[0]!
      out.push({ kind: 'ident', name })
      i += name.length
      continue
    }
    // number (accept 12, 12.34, 12,34)
    const numMatch = s.slice(i).match(/^\d+([.,]\d+)?/)
    if (numMatch) {
      const raw = numMatch[0]!
      const n = Number(raw.replace(',', '.'))
      if (!Number.isFinite(n)) throw new Error(`Nombre invalide: ${raw}`)
      out.push({ kind: 'number', value: n })
      i += raw.length
      continue
    }
    throw new Error(`Caractère invalide: \`${ch}\`. Utilise les boutons (références + opérateurs) ou des nombres.`)
  }
  return out
}

