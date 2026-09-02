import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import { searchDataGouvDatasets, fetchDataGouvDataset } from './datagouv'

describe('app/api/datagouv', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    apiMock.restore()
  })

  it('searchDataGouvDatasets passes q + page and unwraps data.data', async () => {
    apiMock.onGet(STATSIO_API.dataSources.datagouvSearch).reply((config) => {
      expect(config.params).toEqual({ q: 'carburants', page: 2 })
      return [200, { success: true, data: { total: 3, page: 2, page_size: 20, datasets: [{ slug: 'x' }] } }]
    })

    const result = await searchDataGouvDatasets('carburants', 2)
    expect(result.total).toBe(3)
    expect(result.datasets).toHaveLength(1)
  })

  it('fetchDataGouvDataset passes the ref and unwraps data.data', async () => {
    apiMock.onGet(STATSIO_API.dataSources.datagouvDataset).reply((config) => {
      expect(config.params).toEqual({ ref: 'le-prix-des-carburants' })
      return [
        200,
        {
          success: true,
          data: { slug: 'le-prix-des-carburants', title: 'Le prix des carburants', resources: [], preselect_resource_id: null },
        },
      ]
    })

    const result = await fetchDataGouvDataset('le-prix-des-carburants')
    expect(result.slug).toBe('le-prix-des-carburants')
    expect(result.resources).toEqual([])
  })
})
