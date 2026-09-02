import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatDisplayValue,
  formatRowCount,
  formatStatsDataDate,
  parseNumericValue,
  relativeUpdate,
  toNumericOrNull,
} from './statsDataFormat'

describe('formatStatsDataDate', () => {
  it('returns the em dash fallback when no ISO string is given', () => {
    expect(formatStatsDataDate(undefined)).toBe('—')
  })

  it('formats an ISO date in long French format', () => {
    expect(formatStatsDataDate('2026-01-05')).toBe('05 janvier 2026')
  })
})

describe('formatDisplayValue', () => {
  it('falls back for null, undefined and empty string', () => {
    expect(formatDisplayValue(null)).toBe('—')
    expect(formatDisplayValue(undefined)).toBe('—')
    expect(formatDisplayValue('')).toBe('—')
    expect(formatDisplayValue(undefined, 'n/a')).toBe('n/a')
  })

  it('stringifies non-string values as-is', () => {
    expect(formatDisplayValue(42)).toBe('42')
    expect(formatDisplayValue(true)).toBe('true')
  })

  it('reformats an ISO datetime keeping the source clock time', () => {
    expect(formatDisplayValue('2026-01-05T14:30:00')).toBe('05/01/2026 14h30:00')
  })

  it('reformats an ISO datetime without seconds', () => {
    expect(formatDisplayValue('2026-01-05T14:30')).toBe('05/01/2026 14h30:00')
  })

  it('reformats a date-only ISO string', () => {
    expect(formatDisplayValue('2026-01-05')).toBe('05/01/2026')
  })

  it('passes through non-date strings unchanged', () => {
    expect(formatDisplayValue('Hello world')).toBe('Hello world')
  })
})

describe('toNumericOrNull', () => {
  it('passes through finite numbers and rejects NaN/Infinity', () => {
    expect(toNumericOrNull(42)).toBe(42)
    expect(toNumericOrNull(-3.5)).toBe(-3.5)
    expect(toNumericOrNull(NaN)).toBeNull()
    expect(toNumericOrNull(Infinity)).toBeNull()
  })

  it('returns null for empty / non-numeric values', () => {
    expect(toNumericOrNull(null)).toBeNull()
    expect(toNumericOrNull(undefined)).toBeNull()
    expect(toNumericOrNull('')).toBeNull()
    expect(toNumericOrNull(true)).toBeNull()
    expect(toNumericOrNull('N/A')).toBeNull()
    expect(toNumericOrNull('2020-01-01')).toBeNull()
  })

  it('strips units, symbols and thousands separators', () => {
    expect(toNumericOrNull('90%')).toBe(90)
    expect(toNumericOrNull('  47,8 % ')).toBe(47.8)
    expect(toNumericOrNull('1 234')).toBe(1234)
    expect(toNumericOrNull('1,234')).toBe(1234)
    expect(toNumericOrNull('500,000,000+')).toBe(500000000)
    expect(toNumericOrNull('1 234,56 €')).toBe(1234.56)
    expect(toNumericOrNull('1,234.56')).toBe(1234.56)
  })

  it('disambiguates a decimal comma from a thousands comma', () => {
    expect(toNumericOrNull('12,5')).toBe(12.5)
    expect(toNumericOrNull('1,234')).toBe(1234)
  })
})

describe('parseNumericValue', () => {
  it('falls back to 0 when nothing numeric can be read', () => {
    expect(parseNumericValue('N/A')).toBe(0)
    expect(parseNumericValue(null)).toBe(0)
  })

  it('reads decorated numbers', () => {
    expect(parseNumericValue('90%')).toBe(90)
  })
})

describe('formatRowCount', () => {
  it('returns null when there is no row count', () => {
    expect(formatRowCount(undefined)).toBeNull()
    expect(formatRowCount(0)).toBeNull()
  })

  it('formats small counts with the raw number', () => {
    expect(formatRowCount(42)).toBe('42 lignes')
  })

  it('formats thousands rounded to the nearest k', () => {
    expect(formatRowCount(1_500)).toBe('2k lignes')
    expect(formatRowCount(12_000)).toBe('12k lignes')
  })

  it('formats millions with one decimal', () => {
    expect(formatRowCount(2_500_000)).toBe('2.5M lignes')
  })
})

describe('relativeUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when there is no date', () => {
    expect(relativeUpdate(undefined)).toBeNull()
  })

  it('reports today for the current day', () => {
    expect(relativeUpdate('2026-07-16T08:00:00Z')).toBe("maj aujourd'hui")
  })

  it('reports singular "1j" for yesterday', () => {
    expect(relativeUpdate('2026-07-15T12:00:00Z')).toBe('maj il y a 1j')
  })

  it('reports days for anything under 30 days', () => {
    expect(relativeUpdate('2026-07-10T12:00:00Z')).toBe('maj il y a 6j')
  })

  it('reports months at 30 days and beyond', () => {
    expect(relativeUpdate('2026-06-10T12:00:00Z')).toBe('maj il y a 1 mois')
  })
})
