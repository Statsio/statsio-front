import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import { fetchDataSource, createApiDataSource, updateDataSource, refreshDataSource, mapPaginationToApi } from './data-sources'
import type { DataSourcePagination } from './data-sources'

describe('app/api/data-sources', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    apiMock.restore()
  })

  describe('fetchDataSource', () => {
    it('maps the raw response into a DataSourceDetail, including nested apiConfig', async () => {
      apiMock.onGet(STATSIO_API.dataSources.one('42')).reply(200, {
        data: {
          id: 42,
          name: 'My source',
          source_kind: 'api',
          materialization: 'live',
          is_owner: false,
          api_config: {
            url: 'https://example.com',
            method: 'GET',
            auth_type: 'bearer',
            headers: {},
            pagination: { style: 'page', param_name: 'page' },
          },
        },
      })

      const result = await fetchDataSource('42')

      expect(result.id).toBe('42')
      expect(result.sourceKind).toBe('api')
      expect(result.materialization).toBe('live')
      expect(result.isOwner).toBe(false)
      expect(result.apiConfig).toMatchObject({ url: 'https://example.com', authType: 'bearer' })
      expect(result.apiConfig!.pagination).toMatchObject({ style: 'page', paramName: 'page' })
    })

    it('defaults isOwner to true unless is_owner is explicitly false', async () => {
      apiMock.onGet(STATSIO_API.dataSources.one('1')).reply(200, { data: { id: 1, name: 'x' } })
      const result = await fetchDataSource('1')
      expect(result.isOwner).toBe(true)
      expect(result.apiConfig).toBeNull()
    })
  })

  describe('createApiDataSource', () => {
    it('POSTs the payload to the api-sources collection endpoint', async () => {
      apiMock.onPost(STATSIO_API.apiSources.collection).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ name: 'x', url: 'https://example.com' })
        return [200, { data: { id: 5, name: 'x' } }]
      })

      const result = await createApiDataSource({ name: 'x', url: 'https://example.com' })
      expect(result.id).toBe('5')
    })
  })

  describe('updateDataSource', () => {
    it('PATCHes a plain JSON payload when no file is provided', async () => {
      apiMock.onPatch(STATSIO_API.dataSources.one('7')).reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ name: 'renamed' })
        return [200, { data: { id: 7, name: 'renamed' } }]
      })

      const result = await updateDataSource('7', { name: 'renamed' })
      expect(result.name).toBe('renamed')
    })

    it('POSTs multipart with _method=PATCH when a file is provided', async () => {
      apiMock.onPost(STATSIO_API.dataSources.one('7')).reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        expect(config.data).toBeInstanceOf(FormData)
        return [200, { data: { id: 7, name: 'renamed' } }]
      })

      const file = new File(['a'], 'a.csv')
      const result = await updateDataSource('7', { name: 'renamed' }, file)
      expect(result.name).toBe('renamed')
      expect(apiMock.history.patch).toHaveLength(0)
    })
  })

  describe('refreshDataSource', () => {
    it('POSTs to the refresh endpoint and returns the mapped source', async () => {
      apiMock.onPost(STATSIO_API.dataSources.refresh('9')).reply(200, { data: { id: 9, name: 'x', status: 'refreshing' } })
      const result = await refreshDataSource('9')
      expect(result.status).toBe('refreshing')
    })
  })

  describe('mapPaginationToApi', () => {
    it('returns { style: "none" } for style "none"', () => {
      expect(mapPaginationToApi({ style: 'none' })).toEqual({ style: 'none' })
    })

    it('maps "offset"/"page" style with defaults applied per style', () => {
      const offset: DataSourcePagination = { style: 'offset' }
      expect(mapPaginationToApi(offset)).toEqual({ style: 'offset', param_name: 'offset', param_start: 0, page_size: 100 })

      const page: DataSourcePagination = { style: 'page', paramName: 'p', paramStart: 2, pageSize: 20, sizeParam: 'size', totalPath: 'meta.total' }
      expect(mapPaginationToApi(page)).toEqual({
        style: 'page',
        param_name: 'p',
        param_start: 2,
        page_size: 20,
        size_param: 'size',
        total_path: 'meta.total',
        total_mode: 'items',
      })
    })

    it('maps "cursor" style with cursor_param/cursor_path defaults', () => {
      const cursor: DataSourcePagination = { style: 'cursor' }
      expect(mapPaginationToApi(cursor)).toEqual({
        style: 'cursor',
        cursor_param: 'cursor',
        cursor_path: 'next_cursor',
        page_size: 100,
      })
    })

    it('maps "next_link" style, only including next_link_path for source "body"', () => {
      const bodyLink: DataSourcePagination = { style: 'next_link' }
      expect(mapPaginationToApi(bodyLink)).toEqual({
        style: 'next_link',
        next_link_source: 'body',
        next_link_path: 'next_page_url',
      })

      const headerLink: DataSourcePagination = { style: 'next_link', nextLinkSource: 'header' }
      expect(mapPaginationToApi(headerLink)).toEqual({ style: 'next_link', next_link_source: 'header' })
    })

    it('includes max_pages when set, regardless of style', () => {
      const withMax: DataSourcePagination = { style: 'offset', maxPages: 3 }
      expect(mapPaginationToApi(withMax)).toMatchObject({ max_pages: 3 })
    })
  })
})
