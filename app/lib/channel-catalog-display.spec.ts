import { describe, it, expect } from 'vitest'
import { CHANNEL_KIND_STYLE } from './channel-catalog-display'

describe('channel-catalog-display', () => {
  it('exposes a style for every channel kind', () => {
    expect(CHANNEL_KIND_STYLE.redaction.label).toBe('RÉDACTION')
    expect(CHANNEL_KIND_STYLE.institution.label).toBe('INSTITUTION')
    expect(CHANNEL_KIND_STYLE.independant.label).toBe('INDÉPENDANT')
  })
})
