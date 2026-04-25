import { escapeHtml } from './escapeHtml'

export function highlightFormulaHtml(expr: string): string {
  const s = expr ?? ''
  // Color rules:
  // - refs: [ ... ] in red
  // - numbers in blue
  // - function names (ident followed by "(") in orange
  const re = /\[[^\]]*\]|\d+(?:[.,]\d+)?|[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()|\s+|./g
  const parts = s.match(re) ?? []
  return parts
    .map((p) => {
      if (/^\s+$/.test(p)) return p.replace(/ /g, '&nbsp;')
      const esc = escapeHtml(p)
      if (p.startsWith('[') && p.endsWith(']')) return `<span class="text-rose-600">${esc}</span>`
      if (/^\d+(?:[.,]\d+)?$/.test(p)) return `<span class="text-sky-600">${esc}</span>`
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) return `<span class="text-orange-600">${esc}</span>`
      return `<span class="text-slate-900">${esc}</span>`
    })
    .join('')
}

