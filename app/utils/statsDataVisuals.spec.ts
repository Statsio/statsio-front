import { describe, expect, it } from 'vitest'
import { getStatsDataVisual } from './statsDataVisuals'

describe('getStatsDataVisual', () => {
  it('returns the default visual when there is no category', () => {
    expect(getStatsDataVisual(undefined)).toEqual({
      emoji: '📊',
      bg: 'bg-[var(--color-primary)]/10',
      color: 'var(--color-primary)',
    })
  })

  it('matches the health category (case-insensitive substring match)', () => {
    expect(getStatsDataVisual(['Santé'])).toMatchObject({ emoji: '🏥', bg: 'bg-rose-50', color: '#e11d48' })
    expect(getStatsDataVisual(['Urgences hospitalières'])).toMatchObject({ emoji: '🏥' })
  })

  it('matches the TV/audience category', () => {
    expect(getStatsDataVisual(['Audience TV'])).toMatchObject({ emoji: '🎬' })
  })

  it('only looks at the first category', () => {
    expect(getStatsDataVisual(['Budget', 'Santé'])).toMatchObject({ emoji: '💰' })
  })

  it('falls back to the default visual for an unrecognized category', () => {
    expect(getStatsDataVisual(['Inconnu'])).toMatchObject({ emoji: '📊' })
  })

  it('overrides the emoji when one is explicitly provided', () => {
    expect(getStatsDataVisual(['Santé'], '🚑')).toMatchObject({ emoji: '🚑', bg: 'bg-rose-50', color: '#e11d48' })
  })

  it('ignores a null/falsy emoji override', () => {
    expect(getStatsDataVisual(['Santé'], null)).toMatchObject({ emoji: '🏥' })
  })
})
