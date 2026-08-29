import { describe, it, expect } from 'vitest'
import { freshnessLabel, primaryFreshness, relativeAge } from './statsdata-freshness'

const NOW = new Date('2026-08-29T12:00:00Z')

describe('relativeAge', () => {
  it('buckets the delay into a human string', () => {
    expect(relativeAge('2026-08-29T11:59:40Z', NOW)).toBe("à l'instant")
    expect(relativeAge('2026-08-29T11:30:00Z', NOW)).toBe('il y a 30 min')
    expect(relativeAge('2026-08-29T09:00:00Z', NOW)).toBe('il y a 3 h')
    expect(relativeAge('2026-08-26T12:00:00Z', NOW)).toBe('il y a 3 j')
    expect(relativeAge('2026-06-30T12:00:00Z', NOW)).toBe('il y a 2 mois')
  })
})

describe('freshnessLabel', () => {
  it('flags a live source', () => {
    expect(freshnessLabel({ is_live: true }, NOW)).toEqual({ text: 'Données en direct', tone: 'live' })
  })

  it('returns null without a refresh date', () => {
    expect(freshnessLabel({ last_refreshed_at: null }, NOW)).toBeNull()
  })

  it('describes a fresh dataset with its cadence', () => {
    const label = freshnessLabel({ last_refreshed_at: '2026-08-28T12:00:00Z', refresh_frequency: 'daily' }, NOW)
    expect(label).toEqual({ text: 'Mis à jour il y a 1 j', detail: 'rafraîchi chaque jour', tone: 'fresh' })
  })

  it('marks a dataset stale when overdue by more than twice its cadence', () => {
    const label = freshnessLabel({ last_refreshed_at: '2026-08-20T12:00:00Z', refresh_frequency: 'daily' }, NOW)
    expect(label?.tone).toBe('stale')
  })
})

describe('primaryFreshness', () => {
  it('prefers a live source', () => {
    expect(primaryFreshness([{ last_refreshed_at: '2026-08-01T00:00:00Z' }, { is_live: true }], NOW)?.tone).toBe('live')
  })

  it('otherwise picks the most recently refreshed', () => {
    const label = primaryFreshness([
      { last_refreshed_at: '2026-08-01T00:00:00Z' },
      { last_refreshed_at: '2026-08-28T12:00:00Z', refresh_frequency: 'daily' },
    ], NOW)
    expect(label?.text).toBe('Mis à jour il y a 1 j')
  })

  it('returns null when nothing is dated', () => {
    expect(primaryFreshness([{}, {}], NOW)).toBeNull()
  })
})
