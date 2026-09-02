import { describe, it, expect, vi } from 'vitest'
import type { StudioBlock } from '@/types/studio'
import {
  autoParamName,
  bareNames,
  datasetOfPrimarySource,
  desiredSearchPageParam,
  migrateSearchBlock,
  sameSearchPageParam,
  searchColumnsForSource,
} from './studio-search'

function search(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return { id: 'blk123', type: 'search', zoneId: 'z', fieldMapping: {}, config: {}, ...overrides }
}

describe('bareNames', () => {
  it('strips the @sourceId suffix', () => {
    expect(bareNames(['prenom', 'nom@42', 'calc:x'])).toEqual(['prenom', 'nom', 'calc:x'])
  })
})

describe('autoParamName', () => {
  it('is "q" by default and avoids collisions', () => {
    expect(autoParamName('abcdef01')).toBe('q')
    expect(autoParamName('abcdef01', ['q'])).toBe('q_abcdef')
  })
})

describe('migrateSearchBlock', () => {
  it('converts legacy searchSources + searchJoins to the graph model', () => {
    const b = migrateSearchBlock(search({
      fieldMapping: {
        searchSources: [{ datasetId: '5', columns: ['prenom', 'nom'] }],
        searchJoins: [{ sourceDatasetId: '5', datasetId: '9', leftColumn: 'ville_id', rightColumn: 'id', columns: ['ville'], type: 'left' }],
        resultTitleColumn: 'prenom',
        resultDescColumns: ['ville'],
        resultDescColumnLabels: { ville: 'Commune' },
        targetPageId: 'pX',
        urlParams: ['nom'],
      },
    }))
    expect(b.sources).toEqual([{ id: '5', datasetId: '5' }, { id: '9', datasetId: '9' }])
    expect(b.primarySourceId).toBe('5')
    expect(b.joins).toEqual([
      { leftSourceId: '5', leftColumn: 'ville_id', rightSourceId: '9', rightColumn: 'id', type: 'left' },
    ])
    expect(b.fieldMapping.searchColumns).toEqual(['prenom', 'nom', 'ville@9'])
    expect(b.fieldMapping.resultTitleParts).toEqual([{ ref: 'prenom' }])
    expect(b.fieldMapping.resultDescParts).toEqual([{ ref: 'ville@9', label: 'Commune' }])
    expect(b.fieldMapping.searchSources).toBeUndefined()
    expect(b.fieldMapping.searchJoins).toBeUndefined()
    expect(b.fieldMapping.targetPageId).toBeUndefined()
    expect(b.fieldMapping.urlParams).toBeUndefined()
  })

  it('is idempotent', () => {
    const once = migrateSearchBlock(search({
      fieldMapping: { searchSources: [{ datasetId: '5', columns: ['prenom'] }], resultTitleColumn: 'prenom' },
    }))
    const twice = migrateSearchBlock(once)
    expect(twice.sources).toEqual(once.sources)
    expect(twice.fieldMapping.searchColumns).toEqual(once.fieldMapping.searchColumns)
    expect(twice.fieldMapping.resultTitleParts).toEqual(once.fieldMapping.resultTitleParts)
  })

  it('migrates a legacy single-column block (searchColumn + datasetId)', () => {
    const b = migrateSearchBlock(search({ datasetId: '7', fieldMapping: { searchColumn: 'nom_commune' } }))
    expect(b.sources).toEqual([{ id: '7', datasetId: '7' }])
    expect(b.fieldMapping.searchColumns).toEqual(['nom_commune'])
  })

  it('requalifies searchAltColumns like searchColumns', () => {
    const b = migrateSearchBlock(search({
      fieldMapping: {
        searchSources: [{ datasetId: '5', columns: ['prenom', 'nom'] }],
        searchAltColumns: ['email'],
      },
    }))
    expect(b.fieldMapping.searchAltColumns).toEqual(['email'])
  })

  it('warns and drops extra independent search sources (no union)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const b = migrateSearchBlock(search({
      fieldMapping: { searchSources: [
        { datasetId: '1', columns: ['a'] },
        { datasetId: '2', columns: ['b'] },
      ] },
    }))
    expect(b.sources).toEqual([{ id: '1', datasetId: '1' }])
    expect(b.fieldMapping.searchColumns).toEqual(['a'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('desiredSearchPageParam', () => {
  const block = migrateSearchBlock(search({
    fieldMapping: { searchSources: [{ datasetId: '5', columns: ['prenom', 'nom'] }] },
  }))

  it('derives a hidden fan-out param from the search columns', () => {
    expect(desiredSearchPageParam(block)).toMatchObject({
      name: 'q',
      columns: ['prenom', 'nom'],
      datasetId: '5',
      fanOut: true,
      hidden: true,
      searchBlockId: 'blk123',
    })
  })

  it('returns null when there are no search columns', () => {
    expect(desiredSearchPageParam(search())).toBeNull()
  })

  it('keeps an existing param name', () => {
    expect(desiredSearchPageParam(block, { existingName: 'q_blk123' })?.name).toBe('q_blk123')
  })
})

describe('sameSearchPageParam', () => {
  const a = { name: 'q', columns: ['x'], fanOut: true, hidden: true, searchBlockId: 'b', datasetId: '1' }
  it('compares the structural fields', () => {
    expect(sameSearchPageParam(a, { ...a })).toBe(true)
    expect(sameSearchPageParam(a, { ...a, columns: ['x', 'y'] })).toBe(false)
  })
})

describe('datasetOfPrimarySource / searchColumnsForSource', () => {
  const block = migrateSearchBlock(search({
    fieldMapping: {
      searchSources: [{ datasetId: '5', columns: ['prenom'] }],
      searchJoins: [{ sourceDatasetId: '5', datasetId: '9', leftColumn: 'a', rightColumn: 'b', columns: ['ville'], type: 'left' }],
    },
  }))
  it('resolves the primary dataset', () => {
    expect(datasetOfPrimarySource(block)).toBe('5')
  })
  it('filters search columns by source', () => {
    expect(searchColumnsForSource(block, '5')).toEqual(['prenom'])
    expect(searchColumnsForSource(block, '9')).toEqual(['ville@9'])
  })
})
