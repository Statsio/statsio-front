import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import {
  fetchDossiers,
  fetchPinnedDossiers,
  fetchDossierSuggestions,
  fetchContentDossiers,
  syncContentDossiers,
  fetchDossierCatalog,
  fetchDossierDetail,
} from './dossiers'

describe('app/api/dossiers', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
  })
  afterEach(() => {
    apiMock.restore()
  })

  it('maps snake_case fields to camelCase on fetchDossiers', async () => {
    apiMock.onGet('/dossiers').reply(200, {
      success: true,
      data: [
        { id: 3, slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine', description: 'x', image_url: 'http://img/1.jpg', category_slugs: ['monde'] },
      ],
    })

    const list = await fetchDossiers()

    expect(list).toEqual([
      { id: 3, slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine', description: 'x', imageUrl: 'http://img/1.jpg', icon: null, categorySlugs: ['monde'] },
    ])
  })

  it('keeps only identity fields on fetchPinnedDossiers', async () => {
    apiMock.onGet('/dossiers/pinned').reply(200, {
      success: true,
      data: [
        { id: 5, slug: 'presidentielle-2027', name: 'Présidentielle 2027', description: 'x', is_pinned: true },
      ],
    })

    const list = await fetchPinnedDossiers()

    expect(list).toEqual([{ id: 5, slug: 'presidentielle-2027', name: 'Présidentielle 2027', icon: null }])
  })

  it('fetches suggestions for a document', async () => {
    apiMock.onGet('/studio/content/my-slug/dossier-suggestions').reply(200, {
      success: true,
      data: [{ id: 1, slug: 'a', name: 'A' }],
    })

    const list = await fetchDossierSuggestions('my-slug')

    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: 1, name: 'A', imageUrl: null, categorySlugs: [] })
  })

  it('fetches the current dossiers of a document', async () => {
    apiMock.onGet('/studio/content/42/dossiers').reply(200, {
      success: true,
      data: [{ id: 7, slug: 'g', name: 'G' }],
    })

    const list = await fetchContentDossiers('42')

    expect(list.map((d) => d.id)).toEqual([7])
  })

  it('sends dossier_ids as the body on sync', async () => {
    let sentBody: unknown
    apiMock.onPut('/studio/content/my-slug/dossiers').reply((config) => {
      sentBody = JSON.parse(config.data)
      return [200, { success: true, data: [{ id: 2, slug: 'b', name: 'B' }] }]
    })

    const list = await syncContentDossiers('my-slug', [2])

    expect(sentBody).toEqual({ dossier_ids: [2] })
    expect(list.map((d) => d.id)).toEqual([2])
  })

  it('unwraps the nested catalog envelope and forwards filters', async () => {
    let sentParams: unknown
    apiMock.onGet('/dossiers/catalog').reply((config) => {
      sentParams = config.params
      return [
        200,
        {
          success: true,
          data: {
            data: [{ id: 1, slug: 'a', name: 'A', category: null, content_count: 3 }],
            featured: { id: 9, slug: 'f', name: 'F', category: null, content_count: 12 },
            meta: { total: 1, shown: 2, per_page: 12, has_more: false },
            facets: { categories: [{ value: '', label: 'Toutes', count: 1 }] },
            stats: { dossiers: 1, contents: 3, categories: 0, last_updated_at: null },
          },
        },
      ]
    })

    const res = await fetchDossierCatalog({ q: 'ukr', category: 'monde', sort: 'count' })

    expect(sentParams).toEqual({ q: 'ukr', category: 'monde', sort: 'count' })
    expect(res.data[0]?.slug).toBe('a')
    expect(res.featured?.slug).toBe('f')
  })

  it('returns the detail payload for a dossier slug', async () => {
    apiMock.onGet('/dossiers/public/guerre-en-ukraine').reply(200, {
      success: true,
      data: {
        dossier: { id: 1, slug: 'guerre-en-ukraine', name: 'Guerre en Ukraine', category: null, content_count: 2, contributors_count: 1 },
        items: [],
        counts: { all: 2, article: 1, statsdata: 1, survey: 0 },
        related: [],
      },
    })

    const res = await fetchDossierDetail('guerre-en-ukraine')

    expect(res.dossier.name).toBe('Guerre en Ukraine')
    expect(res.counts.article).toBe(1)
  })
})
