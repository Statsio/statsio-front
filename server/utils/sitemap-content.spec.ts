import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchPublicContentEntries } from './sitemap-content'

const API = 'http://api.test/api'

function stubFetch(handler: (url: string, opts?: unknown) => unknown) {
  vi.stubGlobal('$fetch', vi.fn((url: string, opts?: unknown) => Promise.resolve(handler(url, opts))))
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchPublicContentEntries', () => {
  it('hits the studio public endpoint and maps base URLs', async () => {
    stubFetch((url) => {
      expect(url).toBe(`${API}/studio/content/public`)
      return { data: [
        { slug: 'a', visibility: 'public', updated_at: '2026-08-01T00:00:00Z' },
        { slug: 'b', visibility: 'private' },
      ] }
    })

    const entries = await fetchPublicContentEntries(API, 'article', '')
    expect(entries).toEqual([{ loc: '/articles/a', lastmod: '2026-08-01T00:00:00Z' }])
  })

  it('never emits fan-out URLs (parameter values are noindex)', async () => {
    const fetchSpy = vi.fn<(url: string) => Promise<unknown>>(() =>
      Promise.resolve({ data: [{
        slug: 'prix-carburants', visibility: 'public', updated_at: '2026-08-10T00:00:00Z',
        pages: [{ slug: 'commune', params: [{ name: 'c', slugColumn: 'nom', datasetId: '7', fanOut: true }] }],
      }] }),
    )
    vi.stubGlobal('$fetch', fetchSpy)

    const entries = await fetchPublicContentEntries(API, 'statsdata', '')
    expect(entries).toEqual([{ loc: '/statsdata/prix-carburants', lastmod: '2026-08-10T00:00:00Z' }])
    // aucune requête de valeurs distinctes
    expect(fetchSpy.mock.calls.every(([url]) => !String(url).includes('/query'))).toBe(true)
  })

  it('does not expand fan-out for non-statsdata types', async () => {
    stubFetch(() => ({ data: [{ slug: 's', visibility: 'public', pages: [{ params: [{ name: 'x', column: 'x', datasetId: '1', fanOut: true }] }] }] }))
    const entries = await fetchPublicContentEntries(API, 'survey', '')
    expect(entries).toEqual([{ loc: '/sondages/s', lastmod: undefined }])
  })
})
