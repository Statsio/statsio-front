import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups }
})
vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import RecordBlockInspector from './RecordBlockInspector.vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

function seed(type: 'record' | 'related'): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock(type, `${section.id}-0`)
  Object.assign(block, { datasetId: 'ds1', sources: [{ id: 'ds1', datasetId: 'ds1' }], primarySourceId: 'ds1' })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'ville' }, { name: 'prix' }, { name: 'annee' }] }]
})

describe('RecordBlockInspector — fiche column selection', () => {
  it('marks every primary column (bare refs) as selected when nothing is configured', () => {
    const block = seed('record')
    const w = mount(RecordBlockInspector, { props: { block, activeTab: 'data' } })

    const selected = w.findAll('button').filter((b) => b.classes().includes("bg-[var(--studio-accent-wash)]"))
    expect(selected.map((b) => b.text().trim())).toEqual(expect.arrayContaining(['ville', 'prix', 'annee']))
  })

  it('deselecting a column writes the resolved list minus that column (bare refs)', async () => {
    const block = seed('record')
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(RecordBlockInspector, { props: { block, activeTab: 'data' } })

    await w.findAll('button').find((b) => b.text().trim() === 'prix')!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, { columns: ['ville', 'annee'] })
  })

  it('related mode selects no column by default', () => {
    const block = seed('related')
    const w = mount(RecordBlockInspector, { props: { block, activeTab: 'data' } })

    const selected = w.findAll('button').filter((b) => b.classes().includes("bg-[var(--studio-accent-wash)]"))
    expect(selected).toHaveLength(0)
  })
})
