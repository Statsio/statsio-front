import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import { fetchColumnFacets } from '@/api/studio'
import FilterValuesStep from './FilterValuesStep.vue'
import type { ColumnFacetResult, StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchColumnFacets: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

const stubs = {
  VariableButton: { name: 'VariableButton', template: '<button class="var-btn" />' },
}

function result(over: Partial<ColumnFacetResult> = {}): ColumnFacetResult {
  return {
    column: 'annee',
    values: [{ value: '2025', count: 2346 }, { value: '2024', count: 1988 }],
    total: 5,
    offset: 0,
    limit: 50,
    hasCounts: true,
    partial: false,
    ...over,
  }
}

function seedDrillIn(): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('bar', `${section.id}-0`)
  Object.assign(block, {
    datasetId: 'ds1',
    sources: [{ id: 'ds1', datasetId: 'ds1' }],
    primarySourceId: 'ds1',
  })
  store.selectBlock(block.id)
  const drillIn = useFilterDrillIn()
  drillIn.openAdd(store.selectedBlock as StudioBlock, 'primary')
  drillIn.goToValues('annee')
  return store.selectedBlock as StudioBlock
}

async function mountStep(block: StudioBlock) {
  const w = mount(FilterValuesStep, { props: { block }, global: { stubs } })
  await flushPromises()
  return w
}

describe('FilterValuesStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useFilterDrillIn().close()
    vi.mocked(fetchColumnFacets).mockReset().mockResolvedValue(result())
  })

  it('renders faceted values with fr-FR formatted counts', async () => {
    const block = seedDrillIn()
    const w = await mountStep(block)

    expect(fetchColumnFacets).toHaveBeenCalled()
    const formatted = new Intl.NumberFormat('fr-FR').format(2346)
    expect(w.text()).toContain(formatted)
    expect(w.text()).toContain('2025')
  })

  it('promotes "=" to "in" when a second value is checked', async () => {
    const block = seedDrillIn()
    const drillIn = useFilterDrillIn()
    const w = await mountStep(block)

    const boxes = w.findAll('input[type="checkbox"]')
    await boxes[0]!.setValue(true)
    expect(drillIn.state.draft.operator).toBe('=')
    await boxes[1]!.setValue(true)
    expect(drillIn.state.draft.operator).toBe('in')
    expect(drillIn.state.draft.values).toEqual(['2025', '2024'])
  })

  it('shows "Voir plus" while loaded < total and appends on click', async () => {
    const block = seedDrillIn()
    const w = await mountStep(block)

    const more = w.findAll('button').find((b) => b.text().startsWith('Voir plus'))
    expect(more).toBeTruthy()

    vi.mocked(fetchColumnFacets).mockResolvedValueOnce(
      result({ values: [{ value: '2023', count: 100 }], offset: 50 }),
    )
    await more!.trigger('click')
    await flushPromises()

    expect(w.text()).toContain('2023')
    expect(w.text()).toContain('2025')
  })

  it('hides counts and shows a note when the source is partial (live)', async () => {
    vi.mocked(fetchColumnFacets).mockResolvedValue(
      result({ values: [{ value: '75', count: null }], hasCounts: false, partial: true, total: 1 }),
    )
    const block = seedDrillIn()
    const w = await mountStep(block)

    expect(w.text()).toContain('Valeurs indicatives')
    expect(w.text()).not.toContain('NaN')
  })

  it('switches to a free-text input for a comparison operator', async () => {
    const block = seedDrillIn()
    const drillIn = useFilterDrillIn()
    const w = await mountStep(block)

    const opBtn = w.findAll('button').find((b) => b.text().includes('supérieur à'))
    await opBtn!.trigger('click')

    expect(drillIn.state.draft.operator).toBe('>')
    expect(w.find('input[type="text"]').exists()).toBe(true)
  })
})
