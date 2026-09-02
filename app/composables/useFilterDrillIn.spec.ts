import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups }
})

import { useFilterDrillIn, parseListValue } from './useFilterDrillIn'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

function makeBlock(overrides: Partial<StudioBlock> = {}): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('bar', `${section.id}-0`)
  Object.assign(block, {
    datasetId: 'ds1',
    sources: [{ id: 'ds1', datasetId: 'ds1' }],
    primarySourceId: 'ds1',
    ...overrides,
  })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'annee' }, { name: 'region' }] }]
  // Reset the singleton between tests.
  useFilterDrillIn().close()
})

describe('parseListValue', () => {
  it('decodes a JSON array', () => {
    expect(parseListValue('["2024","2025"]')).toEqual(['2024', '2025'])
  })
  it('falls back to a single-element list for non-JSON', () => {
    expect(parseListValue('Bretagne')).toEqual(['Bretagne'])
    expect(parseListValue('')).toEqual([])
  })
})

describe('useFilterDrillIn', () => {
  it('openAdd skips the source step when the block has a single source', () => {
    const block = makeBlock()
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'primary')

    expect(drillIn.state.open).toBe(true)
    expect(drillIn.state.skipSource).toBe(true)
    expect(drillIn.state.step).toBe('column')
    expect(drillIn.state.draft.sourceId).toBe('ds1')
  })

  it('openAdd shows the source step for a multi-source block', () => {
    groups = [
      { label: 'A', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'x' }] },
      { label: 'B', sourceId: 'ds2', columns: [{ name: 'y' }] },
    ]
    const block = makeBlock({ sources: [{ id: 'ds1', datasetId: 'ds1' }, { id: 'ds2', datasetId: 'ds2' }] })
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'primary')

    expect(drillIn.state.step).toBe('source')
    expect(drillIn.state.skipSource).toBe(false)
  })

  it('openEdit round-trips a scalar `=` filter', () => {
    const block = makeBlock({ filters: [{ column: 'region', operator: '=', value: 'Bretagne' }] })
    const drillIn = useFilterDrillIn()

    drillIn.openEdit(block, 'primary', 0)

    expect(drillIn.state.editIndex).toBe(0)
    expect(drillIn.state.step).toBe('values')
    expect(drillIn.state.draft.column).toBe('region')
    expect(drillIn.state.draft.operator).toBe('=')
    expect(drillIn.state.draft.values).toEqual(['Bretagne'])
  })

  it('openEdit round-trips an `in` filter (JSON list)', () => {
    const block = makeBlock({ filters: [{ column: 'annee', operator: 'in', value: '["2024","2025"]' }] })
    const drillIn = useFilterDrillIn()

    drillIn.openEdit(block, 'primary', 0)

    expect(drillIn.state.draft.operator).toBe('in')
    expect(drillIn.state.draft.values).toEqual(['2024', '2025'])
  })

  it('openEdit round-trips a dynamic-token filter', () => {
    const block = makeBlock({ filters: [{ column: 'region', operator: '=', value: '{{region}}' }] })
    const drillIn = useFilterDrillIn()

    drillIn.openEdit(block, 'primary', 0)

    expect(drillIn.state.draft.dynamicValue).toBe('{{region}}')
    expect(drillIn.state.draft.values).toEqual([])
  })

  it('commit adds a scalar filter for a single value', () => {
    const block = makeBlock()
    const store = useStudioStore()
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'primary')
    drillIn.goToValues('region')
    drillIn.state.draft.values = ['Bretagne']
    drillIn.commit()

    expect(store.selectedBlock!.filters).toEqual([{ column: 'region', operator: '=', value: 'Bretagne' }])
    expect(drillIn.state.open).toBe(false)
  })

  it('commit writes an `in` filter with a JSON value for multiple values', () => {
    const block = makeBlock()
    const store = useStudioStore()
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'primary')
    drillIn.goToValues('annee')
    drillIn.state.draft.operator = 'in'
    drillIn.state.draft.values = ['2024', '2025']
    drillIn.commit()

    expect(store.selectedBlock!.filters).toEqual([{ column: 'annee', operator: 'in', value: '["2024","2025"]' }])
  })

  it('commit on edit replaces the filter in place', () => {
    const block = makeBlock({
      filters: [
        { column: 'a', operator: '=', value: '1' },
        { column: 'region', operator: '=', value: 'Bretagne' },
      ],
    })
    const store = useStudioStore()
    const drillIn = useFilterDrillIn()

    drillIn.openEdit(block, 'primary', 1)
    drillIn.state.draft.values = ['Normandie']
    drillIn.commit()

    expect(store.selectedBlock!.filters).toEqual([
      { column: 'a', operator: '=', value: '1' },
      { column: 'region', operator: '=', value: 'Normandie' },
    ])
  })

  it('commit in comparison mode writes comparisonFilters', () => {
    const block = makeBlock()
    const store = useStudioStore()
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'comparison')
    drillIn.goToValues('region')
    drillIn.state.draft.values = ['Bretagne']
    drillIn.commit()

    expect(store.selectedBlock!.comparisonFilters).toEqual([{ column: 'region', operator: '=', value: 'Bretagne' }])
    expect(store.selectedBlock!.filters ?? []).toEqual([])
  })

  it('goBack walks values → column → source, then closes', () => {
    groups = [
      { label: 'A', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'x' }] },
      { label: 'B', sourceId: 'ds2', columns: [{ name: 'y' }] },
    ]
    const block = makeBlock({ sources: [{ id: 'ds1', datasetId: 'ds1' }, { id: 'ds2', datasetId: 'ds2' }] })
    const drillIn = useFilterDrillIn()

    drillIn.openAdd(block, 'primary')
    drillIn.goToColumn('ds1')
    drillIn.goToValues('x')
    expect(drillIn.state.step).toBe('values')

    drillIn.goBack()
    expect(drillIn.state.step).toBe('column')
    drillIn.goBack()
    expect(drillIn.state.step).toBe('source')
    drillIn.goBack()
    expect(drillIn.state.open).toBe(false)
  })
})
