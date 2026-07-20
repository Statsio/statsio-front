import { describe, expect, it } from 'vitest'
import { extractMedicamentBrandName, getMedicamentFormEmoji } from './medicaments'

describe('getMedicamentFormEmoji', () => {
  it('returns a bottle for oral liquid forms', () => {
    expect(getMedicamentFormEmoji('Sirop')).toBe('🧴')
    expect(getMedicamentFormEmoji('Solution buvable')).toBe('🧴')
  })

  it('returns a tube for topical forms', () => {
    expect(getMedicamentFormEmoji('Crème')).toBe('🧪')
    expect(getMedicamentFormEmoji('Gel dermique')).toBe('🧪')
  })

  it('returns a syringe for injectable forms', () => {
    expect(getMedicamentFormEmoji('Solution injectable en ampoule')).toBe('💉')
  })

  it('defaults to a pill for unknown/tablet forms', () => {
    expect(getMedicamentFormEmoji('Comprimé pelliculé')).toBe('💊')
    expect(getMedicamentFormEmoji(null)).toBe('💊')
    expect(getMedicamentFormEmoji(undefined)).toBe('💊')
  })
})

describe('extractMedicamentBrandName', () => {
  it('strips dosage and form from a BDPM-style name', () => {
    expect(extractMedicamentBrandName('DOLIPRANE 1000 mg, comprimé')).toBe('DOLIPRANE')
    expect(extractMedicamentBrandName('CODOLIPRANE 500 mg/30 mg, comprimé')).toBe('CODOLIPRANE')
  })

  it('keeps multi-word brand names before the dosage', () => {
    expect(extractMedicamentBrandName('AMOXICILLINE ARROW 500 mg, gélule')).toBe('AMOXICILLINE ARROW')
  })

  it('returns the trimmed name unchanged when there is no dosage number', () => {
    expect(extractMedicamentBrandName('SPASFON')).toBe('SPASFON')
  })
})
