import { describe, expect, it } from 'vitest'
import { buildSearchRows, highlightParts, navRowsOf } from './search-rows'
import type { GlobalSearchGroup } from '@/types/search'
import type { CatalogItem } from '@/types/catalog'

const content = (id: string) => ({ id, slug: `s-${id}`, title: `T${id}` }) as CatalogItem

const groups: GlobalSearchGroup[] = [
  { type: 'article', label: 'Articles', total: 3, items: [content('1'), content('2')] },
  {
    type: 'channel',
    label: 'Chaînes',
    total: 1,
    items: [{ id: 'c', name: 'Chaîne', handle: 'chaine', description: null, verified: true, followers_count: 3, categories: [], logo_url: null, is_following: false }],
  },
]

describe('buildSearchRows', () => {
  it('builds headers, rows and a « more » link with keyboard indexes', () => {
    const rows = buildSearchRows(groups, 'prix carburant')
    expect(rows.map((r) => r.kind)).toEqual(['header', 'content', 'content', 'more', 'header', 'channel'])
    expect(navRowsOf(rows).map((r) => r.navIndex)).toEqual([0, 1, 2, 3])
    expect(rows[3]).toMatchObject({ to: '/articles?q=prix%20carburant' })
    expect(rows[5]).toMatchObject({ to: '/channels/chaine' })
  })

  it('filters by scope and caps rows per group', () => {
    const rows = buildSearchRows(groups, 'x', '/tvstats', { scope: 'article', maxPerGroup: 1 })
    expect(rows.map((r) => r.kind)).toEqual(['header', 'content', 'more'])
    expect(rows[1]).toMatchObject({ to: '/tvstats/articles/s-1' })
  })
})

describe('highlightParts', () => {
  it('marks every query word, ignoring case and accents', () => {
    expect(highlightParts('Prix de l’Énergie', 'energie prix')).toEqual([
      { text: 'Prix', hit: true },
      { text: ' de l’', hit: false },
      { text: 'Énergie', hit: true },
    ])
  })

  it('returns the text untouched without a usable query', () => {
    expect(highlightParts('Titre', 'a')).toEqual([{ text: 'Titre', hit: false }])
  })
})
