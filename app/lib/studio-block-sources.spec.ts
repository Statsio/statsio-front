import { describe, it, expect } from 'vitest'
import { normalizeBlockSources, blockDatasetIds, suggestJoinKeys, pruneBlockColumnRefs } from './studio-block-sources'
import type { StudioBlock } from '@/types/studio'

function block(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return { id: 'b1', type: 'bar', zoneId: 'z', fieldMapping: {}, config: {}, ...overrides }
}

describe('normalizeBlockSources', () => {
  it('converts a legacy single datasetId to sources[]', () => {
    const b = normalizeBlockSources(block({ datasetId: '7', fieldMapping: { xAxis: 'ville' } }))
    expect(b.sources).toEqual([{ id: '7', datasetId: '7' }])
    expect(b.primarySourceId).toBe('7')
    expect(b.joins).toEqual([])
    expect(b.fieldMapping.xAxis).toBe('ville')
  })

  it('converts legacy joins to the graph shape and requalifies mapping refs', () => {
    const b = normalizeBlockSources(block({
      datasetId: '1',
      joins: [{ datasetId: '2', leftColumn: 'code', rightColumn: 'code', columns: ['nom_region'], type: 'left' }] as never,
      fieldMapping: { xAxis: 'nom_region', yAxes: ['montant'], columns: ['ville', 'nom_region'] },
    }))
    expect(b.sources).toEqual([{ id: '1', datasetId: '1' }, { id: '2', datasetId: '2' }])
    expect(b.joins).toEqual([
      { leftSourceId: '1', leftColumn: 'code', rightSourceId: '2', rightColumn: 'code', type: 'left' },
    ])
    // `nom_region` appartient à la source jointe → requalifiée
    expect(b.fieldMapping.xAxis).toBe('nom_region@2')
    expect(b.fieldMapping.columns).toEqual(['ville', 'nom_region@2'])
    // colonne primaire inchangée
    expect(b.fieldMapping.yAxes).toEqual(['montant'])
  })

  it('requalifies the map block lat / lng / title refs to a joined source', () => {
    const b = normalizeBlockSources(block({
      type: 'map',
      datasetId: '1',
      joins: [{ datasetId: '2', leftColumn: 'code', rightColumn: 'code', columns: ['lat', 'lon'], type: 'left' }] as never,
      fieldMapping: { latColumn: 'lat', lngColumn: 'lon', mapTitleColumn: 'enseigne' },
    }))
    expect(b.fieldMapping.latColumn).toBe('lat@2')
    expect(b.fieldMapping.lngColumn).toBe('lon@2')
    expect(b.fieldMapping.mapTitleColumn).toBe('enseigne')
  })

  it('is idempotent on an already-normalized block', () => {
    const b1 = normalizeBlockSources(block({ datasetId: '3' }))
    const b2 = normalizeBlockSources(b1)
    expect(b2).toBe(b1)
  })

  it('migrates a legacy search block onto the graph model', () => {
    const b = normalizeBlockSources(block({
      type: 'search',
      fieldMapping: {
        searchSources: [{ datasetId: '5', columns: ['prenom', 'nom'] }],
        resultTitleColumn: 'prenom',
      },
    }))
    expect(b.sources).toEqual([{ id: '5', datasetId: '5' }])
    expect(b.primarySourceId).toBe('5')
    expect(b.fieldMapping.searchColumns).toEqual(['prenom', 'nom'])
    expect(b.fieldMapping.resultTitleParts).toEqual([{ ref: 'prenom' }])
    expect(b.fieldMapping.searchSources).toBeUndefined()
  })

  it('leaves source-less blocks untouched', () => {
    const b = block({ type: 'paragraph' })
    expect(normalizeBlockSources(b)).toBe(b)
  })
})

describe('suggestJoinKeys', () => {
  const s = (name: string, type: 'string' | 'integer' = 'string') => ({ name, type })

  it('matches identical names (case-insensitive), type-compatible', () => {
    expect(suggestJoinKeys([s('Code'), s('ville')], [s('code'), s('pop', 'integer')]))
      .toEqual({ leftColumn: 'Code', rightColumn: 'code' })
  })

  it('falls back to a contained-name match', () => {
    expect(suggestJoinKeys([s('region_code'), s('montant', 'integer')], [s('code'), s('nom')]))
      .toEqual({ leftColumn: 'region_code', rightColumn: 'code' })
  })

  it('rejects incompatible types on the exact-name path', () => {
    expect(suggestJoinKeys([s('id', 'integer')], [s('id')])).toBeNull()
  })

  it('returns null when nothing plausible matches', () => {
    expect(suggestJoinKeys([s('a'), s('b')], [s('x'), s('y')])).toBeNull()
  })
})

describe('blockDatasetIds', () => {
  it('collects source + legacy datasetIds', () => {
    const b = block({ datasetId: '1', sources: [{ id: '1', datasetId: '1' }, { id: '2', datasetId: '2' }] })
    expect(blockDatasetIds(b).sort()).toEqual(['1', '2'])
  })
})

describe('pruneBlockColumnRefs', () => {
  it('drops dangling col@sourceId refs whose source is gone', () => {
    const b = block({
      sources: [{ id: '1', datasetId: '1' }],
      fieldMapping: { xAxis: 'ville', yAxis: 'montant@2' },
    })
    pruneBlockColumnRefs(b)
    expect(b.fieldMapping.xAxis).toBe('ville')
    expect(b.fieldMapping.yAxis).toBeUndefined()
  })

  it('keeps bare refs by default, drops them with dropBareRefs', () => {
    const b1 = block({ sources: [{ id: '1', datasetId: '1' }], fieldMapping: { xAxis: 'ville' } })
    pruneBlockColumnRefs(b1)
    expect(b1.fieldMapping.xAxis).toBe('ville')

    const b2 = block({ sources: [{ id: '1', datasetId: '1' }], fieldMapping: { xAxis: 'ville' } })
    pruneBlockColumnRefs(b2, true)
    expect(b2.fieldMapping.xAxis).toBeUndefined()
  })

  it('prunes filters and filterGroups referencing a dropped source', () => {
    const b = block({
      sources: [{ id: '1', datasetId: '1' }],
      filters: [{ column: 'ville', operator: 'eq', value: 'Paris' }, { column: 'x@2', operator: 'eq', value: '1' }] as never,
      filterGroups: [{ match: 'all', conditions: [{ column: 'x@2', operator: 'eq', value: '1' }] }] as never,
    })
    pruneBlockColumnRefs(b)
    expect(b.filters).toEqual([{ column: 'ville', operator: 'eq', value: 'Paris' }])
    expect(b.filterGroups).toEqual([])
  })
})
