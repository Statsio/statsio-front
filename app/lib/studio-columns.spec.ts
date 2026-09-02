import { describe, it, expect } from 'vitest'
import { parseColumnRef, makeColumnRef, columnRefLabel, blockColumnGroups, primarySourceId } from './studio-columns'
import type { StudioBlock } from '@/types/studio'

function block(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return {
    id: 'b1', type: 'bar', zoneId: 'z', fieldMapping: {}, config: {},
    sources: [{ id: '1', datasetId: '1' }, { id: '2', datasetId: '2', alias: 'Régions' }],
    primarySourceId: '1',
    ...overrides,
  }
}

const datasets = {
  getSchema: (id: string) => ({
    '1': { columns: [{ name: 'ville', type: 'string' as const, nullable: false }, { name: 'nom', type: 'string' as const, nullable: false }] },
    '2': { columns: [{ name: 'nom', type: 'string' as const, nullable: false }, { name: 'pop', type: 'integer' as const, nullable: false }] },
  }[id]),
  readyDatasets: [{ id: '1', name: 'Villes' }, { id: '2', name: 'Régions données' }],
}

describe('parseColumnRef', () => {
  it('bare name → no sourceId', () => {
    expect(parseColumnRef('prix')).toEqual({ name: 'prix', sourceId: null })
  })
  it('qualified name splits on the last @', () => {
    expect(parseColumnRef('e@mail@7')).toEqual({ name: 'e@mail', sourceId: '7' })
  })
  it('leading @ is treated as a bare name', () => {
    expect(parseColumnRef('@weird')).toEqual({ name: '@weird', sourceId: null })
  })
})

describe('makeColumnRef', () => {
  it('bare for the primary source', () => {
    expect(makeColumnRef('nom', '1', '1')).toBe('nom')
  })
  it('qualified for a joined source', () => {
    expect(makeColumnRef('nom', '2', '1')).toBe('nom@2')
  })
  it('bare when sourceId missing', () => {
    expect(makeColumnRef('nom', undefined, '1')).toBe('nom')
  })
})

describe('columnRefLabel', () => {
  it('bare ref → name only', () => {
    expect(columnRefLabel('nom', block(), datasets)).toBe('nom')
  })
  it('qualified ref → name · source alias', () => {
    expect(columnRefLabel('nom@2', block(), datasets)).toBe('nom · Régions')
  })
})

describe('blockColumnGroups', () => {
  it('one group per source with sourceId + isPrimary', () => {
    const groups = blockColumnGroups(block(), datasets)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ sourceId: '1', isPrimary: true })
    expect(groups[1]).toMatchObject({ sourceId: '2', isPrimary: false, label: 'Régions' })
  })
  it('falls back to legacy datasetId when no sources', () => {
    const groups = blockColumnGroups(block({ sources: undefined, primarySourceId: undefined, datasetId: '1' }), datasets)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ sourceId: '1', isPrimary: true })
  })
  it('prepends a « Calculées » group for fieldMapping.calcColumns', () => {
    const b = block({ fieldMapping: { calcColumns: [{ id: 'x', label: 'Total', operands: [{ column: 'a' }] }] } })
    const groups = blockColumnGroups(b, datasets)
    expect(groups[0]!.label).toBe('Calculées')
    expect(groups[0]!.sourceId).toBeUndefined()
    expect(groups[0]!.columns[0]).toMatchObject({ name: 'calc:x', label: 'Total' })
  })
})

describe('columnRefLabel — colonne calculée', () => {
  it('renvoie le libellé de la CalcColumn', () => {
    const b = block({ fieldMapping: { calcColumns: [{ id: 'x', label: 'Taux', operands: [] }] } })
    expect(columnRefLabel('calc:x', b, datasets)).toBe('Taux')
  })
})

describe('columnRefLabel — libellé personnalisé (columnLabels)', () => {
  it('columnLabels[ref] a priorité sur le nom brut et la source', () => {
    const b = block({ fieldMapping: { columnLabels: { nom: 'Nom complet', 'pop@2': 'Habitants' } } })
    expect(columnRefLabel('nom', b, datasets)).toBe('Nom complet')
    expect(columnRefLabel('pop@2', b, datasets)).toBe('Habitants')
  })
})

describe('primarySourceId', () => {
  it('prefers primarySourceId, then first source, then datasetId', () => {
    expect(primarySourceId(block())).toBe('1')
    expect(primarySourceId(block({ primarySourceId: undefined }))).toBe('1')
    expect(primarySourceId(block({ sources: undefined, primarySourceId: undefined, datasetId: '9' }))).toBe('9')
  })
})
