import { describe, it, expect } from 'vitest'
import { markColor } from './studio-chart'
import type { ChartMarkRule } from '@/types/studio'

const ctx = { min: 1, max: 10, ref: 5 }

describe('markColor', () => {
  it('returns the fallback when there are no rules or the value is null', () => {
    expect(markColor(undefined, 3, ctx, '#000')).toBe('#000')
    expect(markColor([], 3, ctx, '#000')).toBe('#000')
    expect(markColor([{ when: 'positive', color: '#f00' }], null, ctx, '#000')).toBe('#000')
  })

  it('applies the first matching rule', () => {
    const rules: ChartMarkRule[] = [
      { when: 'above-ref', color: '#a' },
      { when: 'top', color: '#b' },
    ]
    expect(markColor(rules, 10, ctx, '#000')).toBe('#a') // > ref wins (first)
    expect(markColor(rules, 4, ctx, '#000')).toBe('#000') // below ref, not top
  })

  it('handles every operator', () => {
    expect(markColor([{ when: 'positive', color: '#p' }], 2, ctx, '#x')).toBe('#p')
    expect(markColor([{ when: 'negative', color: '#n' }], -2, ctx, '#x')).toBe('#n')
    expect(markColor([{ when: 'gt', value: 3, color: '#g' }], 4, ctx, '#x')).toBe('#g')
    expect(markColor([{ when: 'lt', value: 3, color: '#l' }], 2, ctx, '#x')).toBe('#l')
    expect(markColor([{ when: 'top', color: '#t' }], 10, ctx, '#x')).toBe('#t')
    expect(markColor([{ when: 'bottom', color: '#b' }], 1, ctx, '#x')).toBe('#b')
    expect(markColor([{ when: 'below-ref', color: '#u' }], 2, ctx, '#x')).toBe('#u')
  })

  it('never matches ref rules when ref is null', () => {
    expect(markColor([{ when: 'above-ref', color: '#a' }], 9, { min: 1, max: 10, ref: null }, '#x')).toBe('#x')
  })
})
