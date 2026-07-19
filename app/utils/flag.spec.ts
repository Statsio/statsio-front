import { describe, expect, it } from 'vitest'
import { isoToFlagEmoji } from './flag'

describe('isoToFlagEmoji', () => {
  it('converts an uppercase ISO 3166-1 alpha-2 code to a flag emoji', () => {
    expect(isoToFlagEmoji('FR')).toBe('🇫🇷')
  })

  it('is case-insensitive', () => {
    expect(isoToFlagEmoji('fr')).toBe('🇫🇷')
    expect(isoToFlagEmoji('Us')).toBe('🇺🇸')
  })

  it('handles every letter independently', () => {
    expect(isoToFlagEmoji('DE')).toBe('🇩🇪')
    expect(isoToFlagEmoji('JP')).toBe('🇯🇵')
  })
})
