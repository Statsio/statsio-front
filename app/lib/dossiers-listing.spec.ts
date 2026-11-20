import { describe, expect, it } from 'vitest'
import {
  compositionParts,
  compositionText,
  dossierActiveFilters,
  dossierHeroCaption,
  dossierSortContext,
  dossierTypeOptions,
  dossierTypePie,
  thumbSeed,
} from './dossiers-listing'

describe('dossiers-listing', () => {
  it('keeps only non-empty content types, in StatsData → articles → sondages order', () => {
    const parts = compositionParts({ survey: 2, statsdata: 0, article: 5 })
    expect(parts.map((p) => [p.value, p.count])).toEqual([
      ['article', 5],
      ['survey', 2],
    ])
    expect(compositionParts(undefined)).toEqual([])
  })

  it('writes the composition with singular / plural forms', () => {
    expect(compositionText({ statsdata: 9, article: 1, survey: 2 })).toBe(
      '9 StatsData, 1 article, 2 sondages',
    )
    expect(compositionText({ statsdata: 1, article: 0, survey: 1 })).toBe('1 StatsData, 1 sondage')
  })

  it('builds the « Contient » options from the type facets', () => {
    const options = dossierTypeOptions([
      { value: 'statsdata', count: 4 },
      { value: 'survey', count: 1 },
    ])
    expect(options.map((o) => [o.value, o.count])).toEqual([
      ['', 0],
      ['statsdata', 4],
      ['article', 0],
      ['survey', 1],
    ])
  })

  it('derives the hero pie and caption from the per-type totals', () => {
    const byType = { statsdata: 3, article: 2, survey: 0 }
    expect(dossierTypePie(byType).map((s) => s.value)).toEqual([3, 2])
    expect(dossierHeroCaption(byType)).toBe(
      '5 contenus rangés : 3 StatsData, 2 articles. Un contenu peut figurer dans plusieurs dossiers.',
    )
    expect(dossierHeroCaption({ statsdata: 0, article: 0, survey: 0 })).toBeNull()
  })

  it('lists active filters in toolbar order', () => {
    const filters = dossierActiveFilters(
      { q: ' climat ', type: 'survey', category: 'env', domain: 'medistats', followedOnly: true },
      (v) => (v === 'env' ? 'Environnement' : v),
    )
    expect(filters).toEqual([
      { key: 'q', label: '« climat »' },
      { key: 'type', label: 'Avec sondages' },
      { key: 'category', label: 'Environnement' },
      { key: 'domain', label: 'Medistats' },
      { key: 'followed', label: 'Dossiers suivis' },
    ])
    expect(
      dossierActiveFilters({ q: '', type: '', category: '', domain: '', followedOnly: false }, (v) => v),
    ).toEqual([])
  })

  it('describes each sort', () => {
    expect(dossierSortContext('maj')).toBe('Épinglés puis derniers mis à jour')
    expect(dossierSortContext('count')).toBe('Classés par nombre de contenus')
    expect(dossierSortContext('az')).toBe('Classés par ordre alphabétique')
  })

  it('derives a stable integer seed for generated thumbnails', () => {
    expect(thumbSeed(42)).toBe(42)
    expect(thumbSeed('abc')).toBe(thumbSeed('abc'))
    expect(thumbSeed('abc')).not.toBe(thumbSeed('abd'))
  })
})
