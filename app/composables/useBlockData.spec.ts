import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useBlockData, resolveAggregationParams, rowKey } from './useBlockData'
import { STUDIO_EMBED_CONTEXT } from './studioEmbedContext'
import { useStudioStore } from '@/stores/studio'
import { fetchBlockData, fetchPublicBlockData } from '@/api/studio'
import type { StudioBlock, BlockQueryResult } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchBlockData: vi.fn<typeof fetchBlockData>(),
  fetchPublicBlockData: vi.fn<typeof fetchPublicBlockData>(),
}))

function makeBlock(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return {
    id: 'block-1',
    type: 'table',
    zoneId: 'zone-1',
    datasetId: 'dataset-1',
    fieldMapping: {},
    config: {},
    ...overrides,
  }
}

const result: BlockQueryResult = { columns: ['a'], rows: [{ a: 1 }], totalRows: 1 }

describe('useBlockData', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchBlockData).mockReset()
    vi.mocked(fetchPublicBlockData).mockReset()
  })

  it('load() sets data from fetchBlockData in authenticated (non-readonly) mode', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue(result)
    const block = makeBlock()

    const { data, reload } = useBlockData(() => block, false)
    await reload()

    expect(fetchBlockData).toHaveBeenCalledWith('dataset-1', expect.any(Object))
    expect(fetchPublicBlockData).not.toHaveBeenCalled()
    expect(data.value).toEqual(result)
  })

  it('load() sets data from fetchPublicBlockData when readonly and a doc slug is present', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't', slug: 'my-slug' }
    vi.mocked(fetchPublicBlockData).mockResolvedValue(result)
    const block = makeBlock()

    const { data, reload } = useBlockData(() => block, true)
    await reload()

    expect(fetchPublicBlockData).toHaveBeenCalledWith('my-slug', 'dataset-1', expect.any(Object))
    expect(fetchBlockData).not.toHaveBeenCalled()
    expect(data.value).toEqual(result)
  })

  it('load() catches fetch errors, sets a generic French error message and resets loading', async () => {
    vi.mocked(fetchBlockData).mockRejectedValue(new Error('network down'))
    const block = makeBlock()

    const { data, error, isLoading, reload } = useBlockData(() => block, false)
    await reload()

    expect(error.value).toBe('Impossible de charger les données.')
    expect(data.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('load() substitutes {{token}} filter values from scope, taking precedence over pageParams', async () => {
    const studio = useStudioStore()
    studio.pageParams = { item: 'FromParams' }
    vi.mocked(fetchBlockData).mockResolvedValue(result)
    const block = makeBlock({
      filters: [{ column: 'carburant', operator: '=', value: '{{item}}' }],
    })

    const { reload } = useBlockData(() => block, false, () => ({ item: 'Gazole' }))
    await reload()

    const params = vi.mocked(fetchBlockData).mock.calls[0]![1] as { filters: { value: string }[] }
    expect(params.filters[0]!.value).toBe('Gazole')
  })

  it('load() forwards overrides (interactive sort + server pagination) to the query params', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue(result)
    const block = makeBlock({ config: { sortColumn: 'a', sortDirection: 'asc' } })

    const { reload } = useBlockData(
      () => block, false, undefined,
      () => ({ sortColumn: 'b', sortDirection: 'desc', offset: 20, limit: 10 }),
    )
    await reload()

    const params = vi.mocked(fetchBlockData).mock.calls[0]![1] as {
      sortColumn?: string; sortDirection?: string; offset?: number; limit?: number
    }
    expect(params.sortColumn).toBe('b')
    expect(params.sortDirection).toBe('desc')
    expect(params.offset).toBe(20)
    expect(params.limit).toBe(10)
  })

  it('load() falls back to config sort when no override sort is given', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue(result)
    const block = makeBlock({ config: { sortColumn: 'a', sortDirection: 'desc' } })

    const { reload } = useBlockData(() => block, false, undefined, () => ({ offset: 0 }))
    await reload()

    const params = vi.mocked(fetchBlockData).mock.calls[0]![1] as { sortColumn?: string; sortDirection?: string }
    expect(params.sortColumn).toBe('a')
    expect(params.sortDirection).toBe('desc')
  })

  it('load() queries the source Statsdata slug when STUDIO_EMBED_CONTEXT is provided (bloc sd-embed)', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'article-1', type: 'article', title: 't', slug: 'my-article' }
    vi.mocked(fetchPublicBlockData).mockResolvedValue(result)
    const block = makeBlock()

    let api: ReturnType<typeof useBlockData> | undefined
    const Child = defineComponent({
      setup() {
        api = useBlockData(() => block, true)
        return () => h('div')
      },
    })
    const Parent = defineComponent({
      setup() {
        provide(STUDIO_EMBED_CONTEXT, { docSlug: 'source-statsdata', pages: [], params: {} })
        return () => h(Child)
      },
    })
    mount(Parent)
    await api!.reload()

    expect(fetchPublicBlockData).toHaveBeenCalledWith('source-statsdata', 'dataset-1', expect.any(Object))
  })

  it('load() resets data to null and does not fetch when datasetId is absent', async () => {
    const block = makeBlock({ datasetId: undefined })

    const { data, reload } = useBlockData(() => block, false)
    await reload()

    expect(data.value).toBeNull()
    expect(fetchBlockData).not.toHaveBeenCalled()
    expect(fetchPublicBlockData).not.toHaveBeenCalled()
  })

  it('load() sends sources[] + joins for a multi-source block', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue(result)
    const block = makeBlock({
      type: 'bar',
      sources: [{ id: '1', datasetId: 'dataset-1' }, { id: '2', datasetId: 'dataset-2' }],
      primarySourceId: '1',
      joins: [{ leftSourceId: '1', leftColumn: 'a', rightSourceId: '2', rightColumn: 'b', type: 'left' }],
      fieldMapping: { xAxis: 'x', yAxes: ['y@2'], aggregates: [{ column: 'y@2', fn: 'sum' }] },
    })
    const { reload } = useBlockData(() => block, false)
    await reload()

    const [urlDataset, params] = vi.mocked(fetchBlockData).mock.calls[0]!
    expect(urlDataset).toBe('dataset-1')
    expect(params?.sources).toHaveLength(2)
    expect(params?.primarySourceId).toBe('1')
    expect(params?.joins).toHaveLength(1)
    expect(params?.aggregates).toEqual([{ column: 'y@2', fn: 'sum' }])
  })
})

describe('resolveAggregationParams', () => {
  const base: StudioBlock = { id: 'b', type: 'bar', zoneId: 'z', fieldMapping: {}, config: {} }

  it('returns nothing without any aggregate', () => {
    expect(resolveAggregationParams(base)).toEqual({})
  })

  it('per-column aggregates override the legacy uniform function', () => {
    const r = resolveAggregationParams({
      ...base,
      fieldMapping: { xAxis: 'country', yAxes: ['ca', 'marge'], aggregate: 'sum', aggregates: [{ column: 'marge', fn: 'avg' }] },
    })
    expect(r.aggregates).toEqual([{ column: 'ca', fn: 'sum' }, { column: 'marge', fn: 'avg' }])
    expect(r.groupBy).toEqual(['country'])
  })

  it('falls back to the legacy uniform aggregate for every value column', () => {
    const r = resolveAggregationParams({
      ...base, type: 'kpi',
      fieldMapping: { valueColumn: 'total', aggregate: 'sum' },
    })
    expect(r.aggregates).toEqual([{ column: 'total', fn: 'sum' }])
  })
})

describe('rowKey', () => {
  it('maps a ref through columnMap, falling back to the ref itself', () => {
    const res: BlockQueryResult = { columns: [], rows: [], totalRows: 0, columnMap: { 'nom@2': 'nom@2' } }
    expect(rowKey(res, 'nom@2')).toBe('nom@2')
    expect(rowKey(res, 'ville')).toBe('ville')
    expect(rowKey(null, 'ville')).toBe('ville')
  })
})
