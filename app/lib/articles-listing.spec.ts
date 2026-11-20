import { describe, expect, it } from 'vitest'
import {
  activeFilters,
  buildRubricSlices,
  readingSweep,
  rubricBadgeOf,
  rubricLeadCaption,
  rubricPieSegments,
  slicePercent,
  sortContextLabel,
  visibleFormatFacets,
} from './articles-listing'

const names = { societe: 'Société et éducation', sante: 'Santé', tv: 'TV et médias' }

describe('buildRubricSlices', () => {
  it('ignore « Toutes » et les rubriques vides, trie et relibelle', () => {
    const { slices, others } = buildRubricSlices(
      [
        { value: '', label: 'Toutes', count: 7 },
        { value: 'sante', label: 'sante', count: 2 },
        { value: 'societe', label: 'societe', count: 3 },
        { value: 'vide', label: 'vide', count: 0 },
      ],
      names,
    )
    expect(slices.map((s) => [s.value, s.label, s.count])).toEqual([
      ['societe', 'Société et éducation', 3],
      ['sante', 'Santé', 2],
    ])
    expect(slices[0]!.color).toBe('var(--ds-t1)')
    expect(others).toEqual([])
  })

  it('au-delà de 5 rubriques, le reste passe dans `others`', () => {
    const facets = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((v, i) => ({ value: v, label: v, count: 10 - i }))
    const { slices, others } = buildRubricSlices(facets, {})
    expect(slices).toHaveLength(5)
    expect(others.map((o) => o.value)).toEqual(['f', 'g'])
    expect(others[0]!.color).toBe('var(--ds-context)')
  })
})

describe('rubricPieSegments', () => {
  it('reprend les tranches telles quelles sans rubrique restante', () => {
    const { slices, others } = buildRubricSlices([{ value: 'sante', label: 'sante', count: 2 }], names)
    expect(rubricPieSegments(slices, others)).toEqual([{ value: 2, color: 'var(--ds-t1)', label: 'Santé' }])
  })

  it('garde 4 tranches + « Autres » quand il en reste', () => {
    const facets = ['a', 'b', 'c', 'd', 'e', 'f'].map((v, i) => ({ value: v, label: v, count: 6 - i }))
    const { slices, others } = buildRubricSlices(facets, {})
    const segs = rubricPieSegments(slices, others)
    expect(segs).toHaveLength(5)
    // e (2) + f (1) regroupés
    expect(segs[4]).toEqual({ value: 3, color: 'var(--ds-context)', label: 'Autres rubriques' })
  })
})

describe('rubricBadgeOf', () => {
  const { slices } = buildRubricSlices([{ value: 'sante', label: 'sante', count: 2 }], names)
  it('reprend la couleur de la tranche', () => {
    expect(rubricBadgeOf('sante', slices, names)).toEqual({ label: 'Santé', color: 'var(--ds-t1)' })
  })
  it('rubrique hors tranches → couleur contexte', () => {
    expect(rubricBadgeOf('tv', slices, names)).toEqual({ label: 'TV et médias', color: 'var(--ds-context)' })
  })
  it('sans rubrique → null', () => {
    expect(rubricBadgeOf(null, slices, names)).toBeNull()
  })
})

describe('légendes', () => {
  const { slices } = buildRubricSlices(
    [
      { value: 'societe', label: 'societe', count: 3 },
      { value: 'sante', label: 'sante', count: 1 },
    ],
    names,
  )
  it('rubricLeadCaption', () => {
    expect(rubricLeadCaption(slices, 6)).toBe('Société et éducation en tête : 3 articles sur 6, soit 50 %.')
    expect(rubricLeadCaption([], 6)).toBeNull()
  })
  it('slicePercent', () => {
    expect(slicePercent(slices[0]!, slices)).toBe(75)
  })
  it('sortContextLabel', () => {
    expect(sortContextLabel('created')).toBe('Classés par date de création')
    expect(sortContextLabel('trend')).toBe('Classés par popularité')
  })
})

describe('visibleFormatFacets', () => {
  it('vide si aucun article typé', () => {
    expect(visibleFormatFacets([{ value: '', label: 'Tous', count: 3 }, { value: 'breve', label: 'Brève', count: 0 }])).toEqual([])
  })
  it('garde « Tous » et les formats non vides', () => {
    expect(
      visibleFormatFacets([
        { value: '', label: 'Tous', count: 3 },
        { value: 'breve', label: 'Brève', count: 0 },
        { value: 'enquete', label: 'Enquête', count: 2 },
      ]).map((f) => f.value),
    ).toEqual(['', 'enquete'])
  })
})

describe('activeFilters', () => {
  it('liste les filtres dans l’ordre de la barre', () => {
    expect(
      activeFilters(
        { q: ' bac ', category: 'sante', format: 'enquete', hasData: true },
        { category: (v) => `cat:${v}`, format: (v) => `fmt:${v}` },
      ),
    ).toEqual([
      { key: 'q', label: '« bac »' },
      { key: 'category', label: 'cat:sante' },
      { key: 'format', label: 'fmt:enquete' },
      { key: 'hasData', label: 'Avec StatsData lié' },
    ])
  })
})

describe('readingSweep', () => {
  it('72° par minute, borné à 5 min', () => {
    expect(readingSweep(2)).toBe(144)
    expect(readingSweep(12)).toBe(360)
    expect(readingSweep(Number.NaN)).toBe(0)
  })
})
