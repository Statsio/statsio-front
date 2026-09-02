import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PieChartBlock from './PieChartBlock.vue'
import { clearAggregateCache } from '@/composables/useResolvedTokens'
import { fetchBlockData, fetchScalarAggregate } from '@/api/studio'
import type { StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>().mockResolvedValue({ columns: [], rows: [], totalRows: 0 }),
  fetchPublicBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>().mockResolvedValue({ columns: [], rows: [], totalRows: 0 }),
  fetchScalarAggregate: vi.fn<(...a: unknown[]) => Promise<number | null>>(),
  fetchPublicScalarAggregate: vi.fn<(...a: unknown[]) => Promise<number | null>>(),
}))

function pieBlock(over: Partial<StudioBlock> = {}): StudioBlock {
  return {
    id: 'p1',
    type: 'pie',
    zoneId: 'z',
    datasetId: '14',
    sources: [{ id: '14', datasetId: '14' }],
    primarySourceId: '14',
    fieldMapping: {},
    config: {},
    ...over,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearAggregateCache()
  vi.mocked(fetchScalarAggregate).mockReset()
  vi.mocked(fetchBlockData).mockClear()
})

describe('PieChartBlock — parts calculées', () => {
  it('renders one slice per part; a "remainder" part = SUM(total) − somme des autres', async () => {
    // SUM("Admis") = 870 ; SUM("Inscrits") = 1000 → part "Reste" = 130
    vi.mocked(fetchScalarAggregate).mockImplementation((_ds, params) => {
      const p = params as { column: string }
      return Promise.resolve(p.column === 'Admis' ? 870 : 1000)
    })

    const block = pieBlock({
      config: { pieMode: 'segments' },
      fieldMapping: {
        pieSegments: [
          { fn: 'sum', column: 'Admis' },
          { fn: 'remainder', column: 'Inscrits' },
        ],
      },
    })

    const w = mount(PieChartBlock, { props: { block } })
    await flushPromises()

    expect(w.text()).toContain('Admis')
    expect(w.text()).toContain('Reste')
    expect(w.text()).toContain('87%')
    expect(w.text()).toContain('13%')
  })

  it('merges the block filters into each part aggregate query', async () => {
    vi.mocked(fetchScalarAggregate).mockResolvedValue(10)

    const block = pieBlock({
      config: { pieMode: 'segments' },
      fieldMapping: { pieSegments: [{ fn: 'sum', column: 'Admis' }] },
      filters: [{ column: 'Session', operator: '=', value: '2021' }],
    })

    mount(PieChartBlock, { props: { block } })
    await flushPromises()

    expect(fetchScalarAggregate).toHaveBeenCalled()
    const [, params] = vi.mocked(fetchScalarAggregate).mock.calls[0]!
    expect((params as { filters: unknown[] }).filters).toEqual([
      { column: 'Session', operator: '=', value: '2021' },
    ])
  })

  it('shows the empty state when no part has a column', () => {
    const block = pieBlock({ config: { pieMode: 'segments' }, fieldMapping: { pieSegments: [{ fn: 'sum', column: '' }] } })
    const w = mount(PieChartBlock, { props: { block } })
    expect(w.text()).toContain('Configurer les données')
  })
})
