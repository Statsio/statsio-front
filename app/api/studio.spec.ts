import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp, publicHttp } from '@/lib/http'
import {
  fetchDatasets,
  fetchBlockData,
  fetchPublicBlockData,
  fetchDistinctValues,
  fetchScalarAggregate,
  fetchPublicScalarAggregate,
  fetchPublicCatalog,
  saveStatsDataDocument,
} from './studio'
import { STATSIO_API } from './statsio-endpoints'

describe('app/api/studio', () => {
  let apiMock: AxiosMockAdapter
  let publicMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
    publicMock = new AxiosMockAdapter(publicHttp)
  })

  afterEach(() => {
    apiMock.restore()
    publicMock.restore()
  })

  describe('fetchDatasets', () => {
    it('maps each raw dataset via mapDatasetMeta', async () => {
      apiMock.onGet(STATSIO_API.datasets.collection).reply(200, {
        data: [{ id: 1, name: 'Ventes', row_count: 42, status: 'ready', is_owner: false, source_kind: 'api' }],
      })

      const result = await fetchDatasets()

      expect(result).toEqual([
        {
          id: '1',
          name: 'Ventes',
          description: null,
          rowCount: 42,
          status: 'ready',
          progress: undefined,
          createdAt: undefined,
          isOwner: false,
          dataSourceId: undefined,
          sourceKind: 'api',
          refreshFrequency: undefined,
          lastRefreshedAt: null,
          nextRefreshAt: null,
        },
      ])
    })

    it('returns [] when data.data is missing', async () => {
      apiMock.onGet(STATSIO_API.datasets.collection).reply(200, {})
      expect(await fetchDatasets()).toEqual([])
    })

    it('defaults isOwner to true unless is_owner is explicitly false', async () => {
      apiMock.onGet(STATSIO_API.datasets.collection).reply(200, {
        data: [{ id: 2, name: 'Autre' }],
      })
      const [dataset] = await fetchDatasets()
      expect(dataset!.isOwner).toBe(true)
    })
  })

  describe('fetchBlockData / fetchPublicBlockData', () => {
    it('fetchBlockData falls back to empty columns/rows and totalRows 0 when data.data is missing', async () => {
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply(200, {})

      const result = await fetchBlockData('42')

      expect(result).toEqual({ columns: [], rows: [], totalRows: 0 })
    })

    it('fetchBlockData maps columns/rows/totalRows from the response', async () => {
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply(200, {
        data: { columns: ['a'], rows: [[1]], total_rows: 1 },
      })

      const result = await fetchBlockData('42')

      expect(result).toEqual({ columns: ['a'], rows: [[1]], totalRows: 1 })
    })

    it('fetchPublicBlockData uses publicHttp (not apiHttp)', async () => {
      publicMock.onGet(STATSIO_API.studioContent.publicDatasetQuery('my-slug', '42')).reply(200, {
        data: { columns: ['a'], rows: [], total_rows: 0 },
      })

      const result = await fetchPublicBlockData('my-slug', '42')

      expect(result.columns).toEqual(['a'])
      expect(apiMock.history.get).toHaveLength(0)
    })

    it('sends complex filters/joins through the paramsSerializer', async () => {
      let capturedQuery = ''
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply((config) => {
        const serializer = config.paramsSerializer as { serialize: (p: unknown) => string }
        capturedQuery = serializer.serialize(config.params)
        return [200, { data: { columns: [], rows: [], total_rows: 0 } }]
      })

      await fetchBlockData('42', {
        filters: [{ column: 'city', operator: '=', value: 'Paris' }],
        joins: [{ datasetId: '7', leftColumn: 'a', rightColumn: 'b', type: 'inner', columns: ['c'] }],
      })

      expect(capturedQuery).toContain('filters[0][column]=city')
      expect(capturedQuery).toContain('filters[0][operator]=%3D')
      expect(capturedQuery).toContain('filters[0][value]=Paris')
      expect(capturedQuery).toContain('joins[0][dataset_id]=7')
      expect(capturedQuery).toContain('joins[0][type]=inner')
      expect(capturedQuery).toContain('joins[0][columns][]=c')
    })
  })

  describe('fetchDistinctValues', () => {
    it('dedupes values and skips null/undefined/empty-string entries', async () => {
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply(200, {
        data: { rows: [{ city: 'Paris' }, { city: 'Paris' }, { city: null }, { city: '' }, { city: 'Lyon' }] },
      })

      const values = await fetchDistinctValues('42', 'city', '')

      expect(values).toEqual(['Paris', 'Lyon'])
    })
  })

  describe('fetchScalarAggregate / fetchPublicScalarAggregate', () => {
    it('sends an aggregate query with no group_by and unwraps the single value', async () => {
      let capturedQuery = ''
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply((config) => {
        const serializer = config.paramsSerializer as { serialize: (p: unknown) => string }
        capturedQuery = serializer.serialize(config.params)
        return [200, { data: { columns: ['prix'], rows: [{ prix: 1.712 }], total_rows: 1 } }]
      })

      const value = await fetchScalarAggregate('42', {
        fn: 'avg',
        column: 'prix',
        filters: [{ column: 'carburant', operator: '=', value: 'gazole' }],
      })

      expect(value).toBe(1.712)
      expect(capturedQuery).toContain('aggregate=avg')
      expect(capturedQuery).toContain('aggregate_columns[]=prix')
      expect(capturedQuery).not.toContain('group_by')
      expect(capturedQuery).toContain('filters[0][value]=gazole')
    })

    it('returns null when the result is empty or non-numeric', async () => {
      apiMock.onGet(STATSIO_API.datasets.query('42')).reply(200, { data: { columns: ['x'], rows: [], total_rows: 0 } })
      expect(await fetchScalarAggregate('42', { fn: 'sum', column: 'x' })).toBeNull()

      apiMock.onGet(STATSIO_API.datasets.query('43')).reply(200, { data: { rows: [{ x: 'n/a' }] } })
      expect(await fetchScalarAggregate('43', { fn: 'min', column: 'x' })).toBeNull()
    })

    it('fetchPublicScalarAggregate uses publicHttp', async () => {
      publicMock.onGet(STATSIO_API.studioContent.publicDatasetQuery('slug', '42')).reply(200, {
        data: { columns: ['n'], rows: [{ n: 42 }], total_rows: 1 },
      })

      expect(await fetchPublicScalarAggregate('slug', '42', { fn: 'count', column: 'n' })).toBe(42)
      expect(apiMock.history.get).toHaveLength(0)
    })
  })

  describe('fetchPublicCatalog', () => {
    it('maps the catalog envelope from publicHttp', async () => {
      publicMock.onGet(STATSIO_API.studioContent.publicCatalog).reply(200, {
        success: true,
        data: [{ id: '1', slug: 'a', title: 'Hello', categories: [], tags: [], reading_minutes: 4, linked_datasets_count: 0, charts_count: 0, views_count: 2, publisher: { name: 'X', initials: 'X', is_channel: false, verified: false }, is_favorited: false }],
        meta: { total: 1, shown: 1, per_page: 9, has_more: false },
        facets: { categories: [{ value: '', label: 'Toutes', count: 1 }], formats: [] },
        stats: { published: 1, channels: 0, charts: 0, last_published_at: null },
        featured: null,
      })

      const result = await fetchPublicCatalog({ type: 'article', q: 'hello' })

      expect(result.meta.total).toBe(1)
      expect(result.data[0]?.title).toBe('Hello')
      expect(apiMock.history.get).toHaveLength(0)
    })
  })

  describe('saveStatsDataDocument', () => {
    it('PATCHes with a plain JSON payload when no thumbnail is provided', async () => {
      apiMock.onPatch(STATSIO_API.studioContent.one('doc-1')).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ title: 'New title' })
        return [200, { data: { id: 'doc-1', title: 'New title' } }]
      })

      const result = await saveStatsDataDocument('doc-1', { title: 'New title' })

      expect(result.id).toBe('doc-1')
    })

    it('POSTs multipart with _method=PATCH when a thumbnail is provided', async () => {
      apiMock.onPost(STATSIO_API.studioContent.one('doc-1')).reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        expect(config.data).toBeInstanceOf(FormData)
        return [200, { data: { id: 'doc-1', title: 'With thumbnail' } }]
      })

      const thumbnail = new File(['x'], 'thumb.png')
      const result = await saveStatsDataDocument('doc-1', { title: 'With thumbnail' }, thumbnail)

      expect(result.title).toBe('With thumbnail')
      expect(apiMock.history.patch).toHaveLength(0)
    })
  })
})
