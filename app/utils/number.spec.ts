import { describe, expect, it } from 'vitest'
import { formatCompactNumber } from './number'

const norm = (s: string) => s.replace(/\s+/g, ' ')

describe('formatCompactNumber', () => {
  it('uses standard fr-FR grouping below the 10 000 threshold', () => {
    expect(norm(formatCompactNumber(9_999))).toBe('9 999')
    expect(norm(formatCompactNumber(1_234))).toBe('1 234')
    expect(formatCompactNumber(0)).toBe('0')
  })

  it('switches to compact notation at exactly 10 000', () => {
    expect(norm(formatCompactNumber(10_000))).toBe('10 k')
  })

  it('formats large values with compact k/M suffixes', () => {
    expect(norm(formatCompactNumber(15_000))).toBe('15 k')
    expect(norm(formatCompactNumber(1_234_567))).toBe('1,2 M')
  })

  it('uses the absolute value to decide the threshold but keeps the sign', () => {
    expect(norm(formatCompactNumber(-15_000))).toBe('-15 k')
    expect(norm(formatCompactNumber(-9_999))).toBe('-9 999')
  })
})
