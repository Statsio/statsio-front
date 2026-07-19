import { describe, expect, it } from 'vitest'
import { getCategoryColorClass } from './articleCategoryColor'

describe('getCategoryColorClass', () => {
  it('is deterministic for a given category', () => {
    expect(getCategoryColorClass('Politique')).toBe(getCategoryColorClass('Politique'))
  })

  it('returns a class from the fixed palette', () => {
    const palette = [
      'text-[var(--color-primary)]',
      'text-[var(--color-accent)]',
      'text-emerald-600',
      'text-amber-600',
      'text-rose-600',
    ]

    expect(palette).toContain(getCategoryColorClass('Économie'))
    expect(palette).toContain(getCategoryColorClass(''))
  })

  it('can map different categories to different colors', () => {
    const categories = ['Politique', 'Économie', 'Santé', 'Sport', 'Culture', 'International']
    const classes = new Set(categories.map(getCategoryColorClass))

    expect(classes.size).toBeGreaterThan(1)
  })
})
