import { describe, expect, it } from 'vitest'
import { interpolateTokens } from './studio-tokens'

describe('interpolateTokens', () => {
  const map = {
    ville: 'Bourg-en-Bresse',
    'Code postal': '01000',
    'Commune / Arrondissement Municipal': 'Bourg-en-Bresse',
  }

  it('resolves simple word tokens', () => {
    expect(interpolateTokens('Prix à {{ville}}', map)).toBe('Prix à Bourg-en-Bresse')
  })

  it('resolves tokens whose name contains spaces, accents or slashes', () => {
    expect(interpolateTokens('cp={{Code postal}}', map)).toBe('cp=01000')
    expect(interpolateTokens('{{Commune / Arrondissement Municipal}}', map)).toBe('Bourg-en-Bresse')
  })

  it('ignores whitespace around the token name', () => {
    expect(interpolateTokens('{{  Code postal  }}', map)).toBe('01000')
  })

  it('leaves unknown tokens untouched', () => {
    expect(interpolateTokens('{{inconnu}}', map)).toBe('{{inconnu}}')
  })

  it('is a no-op on empty input or empty map', () => {
    expect(interpolateTokens('', map)).toBe('')
    expect(interpolateTokens('{{ville}}', null)).toBe('{{ville}}')
  })

  it('replaces every occurrence', () => {
    expect(interpolateTokens('{{ville}} — {{ville}}', map)).toBe('Bourg-en-Bresse — Bourg-en-Bresse')
  })
})
