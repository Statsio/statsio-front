import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import BlockFiltersField from './BlockFiltersField.vue'
import type { BlockFilter, StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

function seedBlock(filters: BlockFilter[]): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('bar', `${section.id}-0`)
  Object.assign(block, {
    datasetId: 'ds1',
    sources: [{ id: 'ds1', datasetId: 'ds1' }],
    primarySourceId: 'ds1',
    filters,
  })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

describe('BlockFiltersField', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useFilterDrillIn().close()
  })

  it('renders one row per filter with a value summary (in → "a, b +n")', () => {
    const block = seedBlock([
      { column: 'region', operator: '=', value: 'Bretagne' },
      { column: 'annee', operator: 'in', value: '["2023","2024","2025"]' },
    ])
    const w = mount(BlockFiltersField, { props: { block } })

    expect(w.text()).toContain('region')
    expect(w.text()).toContain('Bretagne')
    expect(w.text()).toContain('2023, 2024 +1')
  })

  it('shows the empty state and an add button when there are no filters', () => {
    const block = seedBlock([])
    const w = mount(BlockFiltersField, { props: { block, emptyLabel: 'Rien ici' } })

    expect(w.text()).toContain('Rien ici')
    expect(w.find('.studio-add-btn').exists()).toBe(true)
  })

  it('opens the drill-in on "add"', async () => {
    const block = seedBlock([])
    const drillIn = useFilterDrillIn()
    const w = mount(BlockFiltersField, { props: { block } })

    await w.find('.studio-add-btn').trigger('click')

    expect(drillIn.state.open).toBe(true)
    expect(drillIn.state.editIndex).toBeNull()
  })

  it('opens the drill-in in edit mode on a row click', async () => {
    const block = seedBlock([{ column: 'region', operator: '=', value: 'Bretagne' }])
    const drillIn = useFilterDrillIn()
    const w = mount(BlockFiltersField, { props: { block } })

    await w.findAll('.group button')[0]!.trigger('click')

    expect(drillIn.state.open).toBe(true)
    expect(drillIn.state.editIndex).toBe(0)
  })

  it('removes a filter and writes the store on the ✕ button', async () => {
    const block = seedBlock([
      { column: 'a', operator: '=', value: '1' },
      { column: 'b', operator: '=', value: '2' },
    ])
    const store = useStudioStore()
    const w = mount(BlockFiltersField, { props: { block } })

    await w.findAll('button[aria-label="Retirer le filtre"]')[0]!.trigger('click')

    expect(store.selectedBlock!.filters).toEqual([{ column: 'b', operator: '=', value: '2' }])
  })
})
