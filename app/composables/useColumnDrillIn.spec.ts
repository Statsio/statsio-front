import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups }
})

import { useColumnDrillIn } from './useColumnDrillIn'
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
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'annee' }, { name: 'ca' }] }]
  useColumnDrillIn().close()
})

describe('useColumnDrillIn', () => {
  it('skips the source step for a single-source block', () => {
    const block = makeBlock()
    const d = useColumnDrillIn()
    d.open({ block, title: 'X', onCommit: () => {} })
    expect(d.state.step).toBe('column')
    expect(d.state.sourceId).toBe('ds1')
  })

  it('shows the source step for a multi-source block', () => {
    groups = [
      { label: 'A', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'x' }] },
      { label: 'B', sourceId: 'ds2', columns: [{ name: 'y' }] },
    ]
    const block = makeBlock({ sources: [{ id: 'ds1', datasetId: 'ds1' }, { id: 'ds2', datasetId: 'ds2' }] })
    const d = useColumnDrillIn()
    d.open({ block, title: 'X', onCommit: () => {} })
    expect(d.state.step).toBe('source')
    d.pickSource('ds2')
    expect(d.state.step).toBe('column')
    expect(d.state.sourceId).toBe('ds2')
  })

  it('single mode: pickColumn commits one ref and closes', () => {
    const block = makeBlock()
    const d = useColumnDrillIn()
    const onCommit = vi.fn<(refs: string[]) => void>()
    d.open({ block, title: 'X', onCommit })
    d.pickColumn('ca')
    expect(onCommit).toHaveBeenCalledWith(['ca'])
    expect(d.state.open).toBe(false)
  })

  it('pickNone commits an empty list', () => {
    const block = makeBlock()
    const d = useColumnDrillIn()
    const onCommit = vi.fn<(refs: string[]) => void>()
    d.open({ block, title: 'X', allowNone: true, onCommit })
    d.pickNone()
    expect(onCommit).toHaveBeenCalledWith([])
  })

  it('multi mode: toggle accumulates, commitMulti flushes', () => {
    const block = makeBlock()
    const d = useColumnDrillIn()
    const onCommit = vi.fn<(refs: string[]) => void>()
    d.open({ block, title: 'Y', multi: true, selected: ['annee'], onCommit })
    d.pickColumn('ca')
    d.pickColumn('annee') // dé-sélectionne
    expect(d.state.selected).toEqual(['ca'])
    d.commitMulti()
    expect(onCommit).toHaveBeenCalledWith(['ca'])
  })

  it('goBack: column → source → close', () => {
    groups = [
      { label: 'A', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'x' }] },
      { label: 'B', sourceId: 'ds2', columns: [{ name: 'y' }] },
    ]
    const block = makeBlock({ sources: [{ id: 'ds1', datasetId: 'ds1' }, { id: 'ds2', datasetId: 'ds2' }] })
    const d = useColumnDrillIn()
    d.open({ block, title: 'X', onCommit: () => {} })
    d.pickSource('ds1')
    d.goBack()
    expect(d.state.step).toBe('source')
    d.goBack()
    expect(d.state.open).toBe(false)
  })

  it('startCalc → saveCalc écrit calcColumns et sélectionne calc:<id>', () => {
    const block = makeBlock()
    const store = useStudioStore()
    const d = useColumnDrillIn()
    const onCommit = vi.fn<(refs: string[]) => void>()

    d.open({ block, title: 'Champ', onCommit })
    d.startCalc()
    expect(d.state.step).toBe('calc')
    expect(d.state.calcDraft).toMatchObject({ label: '', operands: [{ column: '' }] })

    const draft = { ...d.state.calcDraft!, label: 'Total', operands: [{ column: 'annee' }, { op: '+' as const, column: 'ca' }] }
    d.saveCalc(draft)

    expect(store.selectedBlock!.fieldMapping.calcColumns).toEqual([draft])
    expect(onCommit).toHaveBeenCalledWith([`calc:${draft.id}`])
    expect(d.state.open).toBe(false)
  })

  it('goBack depuis calc revient à column', () => {
    const block = makeBlock()
    const d = useColumnDrillIn()
    d.open({ block, title: 'X', onCommit: () => {} })
    d.startCalc()
    d.goBack()
    expect(d.state.step).toBe('column')
    expect(d.state.calcDraft).toBeNull()
  })
})
