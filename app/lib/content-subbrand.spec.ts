import { describe, it, expect } from 'vitest'
import { resolveContentSubBrand } from '@/lib/content-subbrand'

describe('resolveContentSubBrand', () => {
  it('prefers the explicit domain over category derivation', () => {
    expect(resolveContentSubBrand([], 'tvstats')?.id).toBe('tvstats')
    expect(resolveContentSubBrand(['sante'], 'tvstats')?.id).toBe('tvstats')
  })

  it('returns null for the statsio domain (no pastille)', () => {
    expect(resolveContentSubBrand(['sante'], 'statsio')).toBeNull()
  })

  it('falls back to category derivation when no explicit domain', () => {
    expect(resolveContentSubBrand(['sante'])?.id).toBe('medistats')
    expect(resolveContentSubBrand(['tv'])?.id).toBe('tvstats')
    expect(resolveContentSubBrand(['economie'])).toBeNull()
  })
})
