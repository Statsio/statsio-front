import { describe, it, expect } from 'vitest'
import { slugify, sectionAnchorId } from './slug'

describe('slugify', () => {
  it('lowercases, strips accents and joins words with dashes', () => {
    expect(slugify('Saint-Étienne')).toBe('saint-etienne')
    expect(slugify('Île-de-France')).toBe('ile-de-france')
    expect(slugify('SP95-E10')).toBe('sp95-e10')
  })

  it('collapses separators and trims leading/trailing dashes', () => {
    expect(slugify('  Lyon 3e  Arrondissement ')).toBe('lyon-3e-arrondissement')
    expect(slugify('69_123 / 2025')).toBe('69-123-2025')
  })

  it('is safe on empty / nullish input', () => {
    expect(slugify('')).toBe('')
    expect(slugify(undefined as unknown as string)).toBe('')
  })
})

describe('sectionAnchorId', () => {
  it('derives the anchor from the section title', () => {
    expect(sectionAnchorId({ title: 'Chiffres clés' })).toBe('chiffres-cles')
    expect(sectionAnchorId({ title: 'Écarts régionaux' })).toBe('ecarts-regionaux')
  })

  it('is undefined when the section has no usable title', () => {
    expect(sectionAnchorId({})).toBeUndefined()
    expect(sectionAnchorId({ title: '' })).toBeUndefined()
    expect(sectionAnchorId({ title: '  ///  ' })).toBeUndefined()
  })
})
