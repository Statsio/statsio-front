import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KpiBlock from './KpiBlock.vue'
import { clearAggregateCache } from '@/composables/useResolvedTokens'
import { fetchBlockData, fetchScalarAggregate } from '@/api/studio'
import type { StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>().mockResolvedValue({ columns: ['v', 'v_prev'], rows: [{ v: 12, v_prev: 10 }], totalRows: 1 }),
  fetchPublicBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>().mockResolvedValue({ columns: [], rows: [], totalRows: 0 }),
  fetchScalarAggregate: vi.fn<(...a: unknown[]) => Promise<number | null>>(),
  fetchPublicScalarAggregate: vi.fn<(...a: unknown[]) => Promise<number | null>>(),
}))

function kpi(over: Partial<StudioBlock> = {}): StudioBlock {
  return {
    id: 'k1', type: 'kpi', zoneId: 'z', datasetId: '14',
    sources: [{ id: '14', datasetId: '14' }], primarySourceId: '14',
    fieldMapping: {}, config: {},
    ...over,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearAggregateCache()
  vi.mocked(fetchScalarAggregate).mockReset()
  vi.mocked(fetchBlockData).mockClear()
})

describe('KpiBlock — valeur combinée (kpiValue)', () => {
  it('résout MAX(prix) − MIN(prix) via des agrégats scalaires et applique le format', async () => {
    vi.mocked(fetchScalarAggregate).mockImplementation((_ds, params) => {
      const p = params as { fn: string }
      return Promise.resolve(p.fn === 'max' ? 90 : 12)
    })

    const w = mount(KpiBlock, {
      props: {
        block: kpi({
          fieldMapping: { kpiValue: [{ fn: 'max', column: 'prix' }, { op: '-', fn: 'min', column: 'prix' }] },
          config: { format: 'percent' },
        }),
      },
    })
    await flushPromises()

    expect(w.text()).toContain('78.0 %')
    // pas de requête de lignes quand la valeur est une combinaison d'agrégats
    expect(fetchBlockData).not.toHaveBeenCalled()
  })

  it('affiche le libellé de comparaison (avec jetons de boucle) après l\'écart', async () => {
    vi.mocked(fetchScalarAggregate).mockResolvedValue(10)

    const w = mount(KpiBlock, {
      props: {
        block: kpi({
          fieldMapping: { valueColumn: 'v', comparisonColumn: 'v_prev' },
          config: { comparisonLabel: 'vs {{annee}}' },
        }),
        scope: { annee: '2020' },
      },
    })
    await flushPromises()

    expect(w.text()).toContain('vs 2020')
  })

  it('applique les filtres du bloc aux agrégats', async () => {
    vi.mocked(fetchScalarAggregate).mockResolvedValue(5)

    mount(KpiBlock, {
      props: {
        block: kpi({
          fieldMapping: { kpiValue: [{ fn: 'sum', column: 'a' }] },
          filters: [{ column: 'Session', operator: '=', value: '2021' }],
        }),
      },
    })
    await flushPromises()

    const [, params] = vi.mocked(fetchScalarAggregate).mock.calls[0]!
    expect((params as { filters: unknown[] }).filters).toEqual([
      { column: 'Session', operator: '=', value: '2021' },
    ])
  })
})
