import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp, publicHttp } from '@/lib/http'
import {
  fetchDatasets,
  fetchBlockData,
  fetchPublicBlockData,
  fetchDistinctValues,
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
