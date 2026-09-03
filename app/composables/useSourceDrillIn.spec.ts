import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>().mockResolvedValue([]),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockImplementation((id: string) =>
    Promise.resolve({ id, name: id, rowCount: 0, status: 'ready', columns: [{ name: 'id', type: 'integer' }, { name: 'ville', type: 'string' }] }),
  ),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import type { DatasetMeta, StudioBlock } from '@/types/studio'

function ds(id: string): DatasetMeta {
  return { id, name: `DS ${id}`, rowCount: 10, status: 'ready' }
}

function seed(type: 'bar' | 'record'): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock(type, `${section.id}-0`)
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  useStudioDatasetsStore().datasets = [ds('1'), ds('2')]
  useSourceDrillIn().close()
})

describe('useSourceDrillIn', () => {
  it('single-source: picking a dataset sets it and closes', () => {
    const block = seed('record')
    const store = useStudioStore()
    const d = useSourceDrillIn()
    d.open({ block, singleSource: true })
    expect(d.state.open).toBe(true)

    d.pickDataset('1')
    const b = store.blocks.find((x) => x.id === block.id)!
    expect(b.sources).toEqual([{ id: '1', datasetId: '1' }])
    expect(d.state.open).toBe(false)
  })

  it('multi-source: pickDataset toggles a source without closing', () => {
    const block = seed('bar')
    const store = useStudioStore()
    const d = useSourceDrillIn()
    d.open({ block })

    d.pickDataset('1')
    d.pickDataset('2')
    let b = store.blocks.find((x) => x.id === block.id)!
    expect(b.sources?.map((s) => s.datasetId)).toEqual(['1', '2'])
    expect(d.state.open).toBe(true)

    d.pickDataset('2')
    b = store.blocks.find((x) => x.id === block.id)!
    expect(b.sources?.map((s) => s.datasetId)).toEqual(['1'])
  })

  it('goToJoins creates one join card per non-primary source, pre-filled from matching keys', async () => {
    const block = seed('bar')
    const store = useStudioStore()
    const d = useSourceDrillIn()
    d.open({ block })
    d.pickDataset('1')
    d.pickDataset('2')
    await flushPromises() // schemas loaded

    d.goToJoins()
    const b = store.blocks.find((x) => x.id === block.id)!
    expect(b.joins).toHaveLength(1)
    expect(b.joins![0]).toMatchObject({ leftSourceId: '1', rightSourceId: '2', leftColumn: 'id', rightColumn: 'id', type: 'left' })
  })

  it('makePrimary swaps the primary source', async () => {
    const block = seed('bar')
    const store = useStudioStore()
    const d = useSourceDrillIn()
    d.open({ block })
    d.pickDataset('1')
    d.pickDataset('2')
    await flushPromises()

    d.makePrimary('2')
    expect(store.blocks.find((x) => x.id === block.id)!.primarySourceId).toBe('2')
  })
})
