import { describe, expect, it } from 'vitest'
import { formatCompactNumber, formatEuros, formatShortDate, getNameInitials, getUserInitials } from './format'

const norm = (s: string) => s.replace(/\s+/g, ' ')

describe('formatCompactNumber', () => {
  it('always uses compact notation, even for small values', () => {
    expect(norm(formatCompactNumber(950))).toBe('950')
    expect(norm(formatCompactNumber(15_000))).toBe('15 k')
    expect(norm(formatCompactNumber(1_234_567))).toBe('1,2 M')
  })
})

describe('formatEuros', () => {
  it('formats a value as fr-FR currency with two decimals', () => {
    expect(norm(formatEuros(1_234.5))).toBe('1 234,50 €')
    expect(norm(formatEuros(0))).toBe('0,00 €')
  })
})

describe('formatShortDate', () => {
  it('falls back to the em dash when there is no date', () => {
    expect(formatShortDate(undefined)).toBe('—')
    expect(formatShortDate(null)).toBe('—')
  })

  it('falls back to the em dash for an invalid date', () => {
    expect(formatShortDate('not-a-date')).toBe('—')
  })

  it('formats a valid ISO date as day + abbreviated month', () => {
    expect(norm(formatShortDate('2026-01-05'))).toBe('5 janv.')
  })
})

describe('getUserInitials', () => {
  it('combines the first letter of first and last name', () => {
    expect(getUserInitials('Marie', 'Curie')).toBe('MC')
  })

  it('handles a missing last name', () => {
    expect(getUserInitials('Marie', undefined)).toBe('M')
  })

  it('falls back when both names are missing', () => {
    expect(getUserInitials(undefined, undefined)).toBe('?')
    expect(getUserInitials(undefined, undefined, '--')).toBe('--')
  })
})

describe('getNameInitials', () => {
  it('takes the first letter of up to the first two words', () => {
    expect(getNameInitials('Marie Curie')).toBe('MC')
  })

  it('uppercases the result', () => {
    expect(getNameInitials('marie curie')).toBe('MC')
  })

  it('only keeps the first two words for longer names', () => {
    expect(getNameInitials('Jean Paul Sartre')).toBe('JP')
  })

  it('ignores extra whitespace between words', () => {
    expect(getNameInitials('Marie  Curie')).toBe('MC')
  })

  it('handles a single word', () => {
    expect(getNameInitials('Cher')).toBe('C')
  })
})
