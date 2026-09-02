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

  it('expands fan-out params into one indexable URL per distinct slug value', async () => {
    stubFetch((url) => {
      if (url === `${API}/studio/content/public`) {
        return { data: [{
          slug: 'prix-carburants', visibility: 'public', updated_at: '2026-08-10T00:00:00Z',
          pages: [{
            slug: 'commune',
            params: [{ name: 'code_commune', slugColumn: 'nom_commune', datasetId: '7', fanOut: true }],
          }],
        }] }
      }
      // distinct query
      expect(url).toContain(`/studio/content/public/prix-carburants/datasets/7/query`)
      expect(url).toContain('columns[]=nom_commune')
      expect(url).toContain('distinct=true')
      return { data: { rows: [
        { nom_commune: 'Lyon' }, { nom_commune: 'Saint-Étienne' }, { nom_commune: 'Lyon' }, { nom_commune: '' },
      ] } }
    })

    const entries = await fetchPublicContentEntries(API, 'statsdata', '')
    expect(entries.map((e) => e.loc)).toEqual([
      '/statsdata/prix-carburants',
      '/statsdata/prix-carburants/lyon',
      '/statsdata/prix-carburants/saint-etienne',
    ])
  })

  it('builds composite fan-out segments from a multi-column search param', async () => {
    stubFetch((url) => {
      if (url === `${API}/studio/content/public`) {
        return { data: [{
          slug: 'annuaire', visibility: 'public', updated_at: '2026-09-01T00:00:00Z',
          pages: [{
            slug: 'personne',
            params: [{ name: 'q', columns: ['prenom', 'nom'], datasetId: '3', fanOut: true, hidden: true, searchBlockId: 'b1' }],
          }],
        }] }
      }
      expect(url).toContain('columns[]=prenom')
      expect(url).toContain('columns[]=nom')
      expect(url).not.toContain('distinct=true')
      return { data: { rows: [
        { prenom: 'Jean', nom: 'Dupond' },
        { prenom: 'Jean', nom: 'Dupond' },
        { prenom: 'Marie', nom: 'Martin' },
      ] } }
    })

    const entries = await fetchPublicContentEntries(API, 'statsdata', '')
    expect(entries.map((e) => e.loc)).toEqual([
      '/statsdata/annuaire',
      '/statsdata/annuaire/jean-dupond',
      '/statsdata/annuaire/marie-martin',
    ])
  })

  it('does not expand fan-out for non-statsdata types', async () => {
    stubFetch(() => ({ data: [{ slug: 's', visibility: 'public', pages: [{ params: [{ name: 'x', column: 'x', datasetId: '1', fanOut: true }] }] }] }))
    const entries = await fetchPublicContentEntries(API, 'survey', '')
    expect(entries).toEqual([{ loc: '/sondages/s', lastmod: undefined }])
  })
})
