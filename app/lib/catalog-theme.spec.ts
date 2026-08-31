import { describe, expect, it } from 'vitest'
import { catalogThemeKey, catalogThemeStyle, CATALOG_FORMAT_STYLE } from '@/lib/catalog-theme'
import { formatCatalogCount, formatCatalogItemMeta, formatReadingTime } from '@/lib/catalog-format'

describe('catalog-theme', () => {
  it('maps accented category names to known theme keys', () => {
    expect(catalogThemeKey('Économie')).toBe('economie')
    expect(catalogThemeStyle('Santé').fg).toBe('#047857')
  })

  it('exposes editorial format chips', () => {
    expect(CATALOG_FORMAT_STYLE.enquete?.label).toBe('ENQUÊTE')
  })
})

describe('catalog-format', () => {
  it('formats compact counts and reading time', () => {
    expect(formatCatalogCount(3460)).toMatch(/3/)
    expect(formatReadingTime(14)).toBe('14 min de lecture')
  })

  it('joins views and a short date', () => {
    expect(formatCatalogItemMeta(1200, '2026-07-03T00:00:00Z')).toContain('vues')
  })
})
