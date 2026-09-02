import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

import ColumnDrillInPanel from './ColumnDrillInPanel.vue'
import { useStudioStore } from '@/stores/studio'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { StudioBlock } from '@/types/studio'

function seed(sources: { id: string; datasetId: string }[]): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('bar', `${section.id}-0`)
  Object.assign(block, { datasetId: sources[0]!.datasetId, sources, primarySourceId: sources[0]!.id })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'annee' }, { name: 'ca' }] }]
  useColumnDrillIn().close()
})

describe('ColumnDrillInPanel', () => {
  it('renders nothing while closed', () => {
    seed([{ id: 'ds1', datasetId: 'ds1' }])
    const w = mount(ColumnDrillInPanel)
    expect(w.find('.absolute').exists()).toBe(false)
  })

  it('single-source: goes straight to the column list and commits on pick', async () => {
    const block = seed([{ id: 'ds1', datasetId: 'ds1' }])
    const onCommit = vi.fn<(refs: string[]) => void>()
    const d = useColumnDrillIn()
    const w = mount(ColumnDrillInPanel)

    d.open({ block, title: 'Colonne X', onCommit })
    await flushPromises()

    expect(w.text()).toContain('Colonne X')
    await w.findAll('button').find((b) => b.text().trim() === 'ca')!.trigger('click')
    expect(onCommit).toHaveBeenCalledWith(['ca'])
  })

  it('multi-source: source step then column step, back button returns to source', async () => {
    groups = [
      { label: 'Ventes', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'ca' }] },
      { label: 'Régions', sourceId: 'ds2', columns: [{ name: 'zone' }] },
    ]
    const block = seed([{ id: 'ds1', datasetId: 'ds1' }, { id: 'ds2', datasetId: 'ds2' }])
    const d = useColumnDrillIn()
    const w = mount(ColumnDrillInPanel)

    d.open({ block, title: 'X', onCommit: vi.fn<(refs: string[]) => void>() })
    await flushPromises()
    expect(w.text()).toContain('Ventes')
    expect(w.text()).toContain('Régions')

    await w.findAll('button').find((b) => b.text().includes('Régions'))!.trigger('click')
    await flushPromises()
    expect(d.state.step).toBe('column')

    await w.find('button[aria-label="Retour"]').trigger('click')
    expect(d.state.step).toBe('source')
  })

  it('allowNone renders the none option and commits []', async () => {
    const block = seed([{ id: 'ds1', datasetId: 'ds1' }])
    const onCommit = vi.fn<(refs: string[]) => void>()
    const d = useColumnDrillIn()
    const w = mount(ColumnDrillInPanel)

    d.open({ block, title: 'Tri', allowNone: true, noneLabel: 'Aucun tri', onCommit })
    await flushPromises()

    await w.findAll('button').find((b) => b.text().includes('Aucun tri'))!.trigger('click')
    expect(onCommit).toHaveBeenCalledWith([])
  })
})
