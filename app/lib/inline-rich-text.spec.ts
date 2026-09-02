import { describe, expect, it } from 'vitest'
import { sanitizeInlineHtml, stripInlineHtml, isBlankInlineHtml } from './inline-rich-text'

describe('sanitizeInlineHtml', () => {
  it('keeps allowed character marks', () => {
    expect(sanitizeInlineHtml('<p><strong>Gras</strong> <em>ital</em> <u>sous</u> <s>barré</s></p>'))
      .toBe('<strong>Gras</strong> <em>ital</em> <u>sous</u> <s>barré</s>')
  })

  it('keeps highlight and filtered inline styles', () => {
    expect(sanitizeInlineHtml('<mark data-color="#fef9c3" style="background-color: #fef9c3">x</mark>'))
      .toBe('<mark style="background-color: #fef9c3">x</mark>')
    expect(sanitizeInlineHtml('<span style="text-transform: uppercase; color: red">x</span>'))
      .toBe('<span style="text-transform: uppercase">x</span>')
  })

  it('drops disallowed tags but keeps their text', () => {
    expect(sanitizeInlineHtml('<ul><li>a</li></ul>')).toBe('a')
    expect(sanitizeInlineHtml('<h2>Titre</h2>')).toBe('Titre')
    expect(sanitizeInlineHtml('<a href="/x" onclick="evil()">lien</a>')).toBe('lien')
  })

  it('neutralises scripts', () => {
    expect(sanitizeInlineHtml('<script>alert(1)</script>bonjour')).toBe('alert(1)bonjour')
    expect(sanitizeInlineHtml('<span style="background: url(javascript:alert(1))">x</span>')).toBe('<span>x</span>')
  })

  it('escapes a legacy plain-text value', () => {
    expect(sanitizeInlineHtml('Marges & seuils < 5')).toBe('Marges &amp; seuils &lt; 5')
    expect(sanitizeInlineHtml('')).toBe('')
  })
})

describe('stripInlineHtml', () => {
  it('returns plain text with entities decoded', () => {
    expect(stripInlineHtml('<strong>R&amp;D</strong> par région')).toBe('R&D par région')
    expect(stripInlineHtml('Chiffres clés')).toBe('Chiffres clés')
  })
})

describe('isBlankInlineHtml', () => {
  it('treats empty editor output as blank', () => {
    expect(isBlankInlineHtml('<p></p>')).toBe(true)
    expect(isBlankInlineHtml('<p><br></p>')).toBe(true)
    expect(isBlankInlineHtml('   ')).toBe(true)
    expect(isBlankInlineHtml(undefined)).toBe(true)
    expect(isBlankInlineHtml('<p>Titre</p>')).toBe(false)
  })
})
