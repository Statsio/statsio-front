import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups, columnRefLabel: (r: string) => r }
})
vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import TableColumnsField from './TableColumnsField.vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

function seed(): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('table', `${section.id}-0`)
  Object.assign(block, { datasetId: 'ds1', sources: [{ id: 'ds1', datasetId: 'ds1' }], primarySourceId: 'ds1' })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'ville' }, { name: 'prix' }] }]
})

describe('TableColumnsField', () => {
  it('section="columns": lists every column (bare primary refs) when nothing is customised', () => {
    const block = seed()
    const w = mount(TableColumnsField, { props: { block, section: 'columns' } })
    expect(w.text()).toContain('ville')
    expect(w.text()).toContain('prix')
  })

  it('removing a column writes the resolved list minus it', async () => {
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(TableColumnsField, { props: { block, section: 'columns' } })

    // the ✕ buttons on displayed-column rows
    await w.findAll('button').filter((b) => b.text().trim() === '✕')[1]!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, expect.objectContaining({ columns: ['ville'] }))
  })

  it('section="rules": add creates a cellRule', async () => {
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(TableColumnsField, { props: { block, section: 'rules' } })

    await w.findAll('button').find((b) => b.text().includes('+ Ajouter'))!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, expect.objectContaining({ cellRules: expect.any(Array) }))
  })
})
