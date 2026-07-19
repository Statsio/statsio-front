import { describe, expect, it } from 'vitest'
import {
  CATEGORY_BORDER_FALLBACK,
  CATEGORY_COLOR_FALLBACK,
  categoryBadgeClass,
  categoryBorderClass,
  categoryThumbnailGradient,
} from './tv-category-colors'

describe('categoryBadgeClass', () => {
  it('maps a known label to its badge classes', () => {
    expect(categoryBadgeClass('Sport')).toBe('bg-red-100 text-red-700')
  })

  it('falls back for a null/undefined/unknown label', () => {
    expect(categoryBadgeClass(null)).toBe(CATEGORY_COLOR_FALLBACK)
    expect(categoryBadgeClass(undefined)).toBe(CATEGORY_COLOR_FALLBACK)
    expect(categoryBadgeClass('Inconnu')).toBe(CATEGORY_COLOR_FALLBACK)
  })

  it('treats synonym labels the same as their canonical label', () => {
    expect(categoryBadgeClass('Série')).toBe(categoryBadgeClass('Fiction'))
    expect(categoryBadgeClass('Cinéma')).toBe(categoryBadgeClass('Film'))
  })
})

describe('categoryBorderClass', () => {
  it('maps a known label to its left-border accent class', () => {
    expect(categoryBorderClass('Musique')).toBe('border-l-pink-400')
  })

  it('falls back for a null/undefined/unknown label', () => {
    expect(categoryBorderClass(null)).toBe(CATEGORY_BORDER_FALLBACK)
    expect(categoryBorderClass('Inconnu')).toBe(CATEGORY_BORDER_FALLBACK)
  })
})

describe('categoryThumbnailGradient', () => {
  it('produces a repeating-linear-gradient using the mapped accent color', () => {
    const gradient = categoryThumbnailGradient('Sport')

    expect(gradient).toContain('repeating-linear-gradient')
    expect(gradient).toContain('#ef4444')
  })

  it('falls back to the neutral accent for an unknown label', () => {
    expect(categoryThumbnailGradient('Inconnu')).toContain('#94a3b8')
    expect(categoryThumbnailGradient(null)).toContain('#94a3b8')
  })
})
