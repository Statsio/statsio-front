import { describe, expect, it } from 'vitest'
import {
  buildDayFigure,
  buildLiveFeed,
  filterFeed,
  interleave,
  mergeThemeFacets,
  pickDailyQuestion,
  plural,
  relabelThemes,
  splitThemes,
} from './home-tranches'
import type { CatalogItem } from '@/types/catalog'

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'contenu',
    title: 'Contenu',
    categories: [],
    category: '',
    format: null,
    reading_minutes: 0,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    publisher: { name: 'Statsio', initials: 'S', is_channel: true, verified: true },
    is_favorited: false,
    ...overrides,
  } as CatalogItem
}

describe('mergeThemeFacets / splitThemes', () => {
  it('sums facets across types and sorts by count', () => {
    const themes = mergeThemeFacets([
      [
        { value: 'sante', label: 'Santé', count: 2 },
        { value: 'tv', label: 'TV', count: 1 },
      ],
      [{ value: 'tv', label: 'TV', count: 4 }],
      undefined,
      [{ value: 'vide', label: 'Vide', count: 0 }],
    ])
    expect(themes).toEqual([
      { value: 'tv', label: 'TV', count: 5 },
      { value: 'sante', label: 'Santé', count: 2 },
    ])
  })

  it('keeps 5 slices at most', () => {
    const themes = Array.from({ length: 7 }, (_, i) => ({ value: `t${i}`, label: `T${i}`, count: 10 - i }))
    const { top, others } = splitThemes(themes)
    expect(top).toHaveLength(5)
    expect(others.map((t) => t.value)).toEqual(['t5', 't6'])
  })
})

describe('buildDayFigure', () => {
  it('gives the share of published contents on the leading theme', () => {
    const fig = buildDayFigure([{ value: 'sante', label: 'Santé', count: 9 }], 18)
    expect(fig).toEqual({ theme: { value: 'sante', label: 'Santé', count: 9 }, total: 18, pct: 50 })
  })

  it('is null without themes or contents', () => {
    expect(buildDayFigure([], 10)).toBeNull()
    expect(buildDayFigure([{ value: 'a', label: 'A', count: 2 }], 0)).toBeNull()
  })
})

describe('buildLiveFeed', () => {
  const src = {
    articles: [item({ id: 'a', slug: 'a', title: 'Article', created_at: '2026-11-18T10:00:00Z' })],
    statsdata: [
      item({
        id: 'd',
        slug: 'd',
        title: 'Données',
        created_at: '2026-11-01T10:00:00Z',
        freshness: { last_refreshed_at: '2026-11-19T08:00:00Z' },
      }),
    ],
    surveys: [item({ id: 's', slug: 's', title: 'Sondage', created_at: '2026-11-10T10:00:00Z' })],
  }

  it('merges publications and source syncs, newest first', () => {
    const feed = buildLiveFeed(src)
    expect(feed.map((e) => e.key)).toEqual(['data:d', 'article:a', 'survey:s', 'statsdata:d'])
    expect(feed[0]).toMatchObject({ label: 'Mise à jour', href: '/statsdata/d' })
    expect(feed[2]).toMatchObject({ kind: 'sondage', label: 'Consultation ouverte', href: '/sondages/s' })
  })

  it('filters by kind', () => {
    const feed = buildLiveFeed(src)
    expect(filterFeed(feed, 'data').map((e) => e.key)).toEqual(['data:d'])
    expect(filterFeed(feed, 'pub').map((e) => e.key)).toEqual(['article:a', 'statsdata:d'])
    expect(filterFeed(feed, 'sondage').map((e) => e.key)).toEqual(['survey:s'])
  })
})

describe('pickDailyQuestion', () => {
  const opts = [
    { label: 'Oui', pct: 60 },
    { label: 'Non', pct: 40 },
  ]

  it('prefers an open single-question poll with options', () => {
    const long = item({ id: 'l', survey_kind: 'long', primary_options: opts })
    const quick = item({ id: 'q', survey_kind: 'single_question', primary_options: opts })
    expect(pickDailyQuestion([long, quick])?.id).toBe('q')
  })

  it('skips closed polls and polls without a breakdown', () => {
    const closed = item({ id: 'c', is_closed: true, primary_options: opts })
    const bare = item({ id: 'b', primary_options: [] })
    expect(pickDailyQuestion([closed, bare])).toBeNull()
  })
})

describe('interleave', () => {
  it('alternates lists up to the limit', () => {
    expect(interleave([[1, 4], [2], [3, 5, 6]], 5)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('relabelThemes / plural', () => {
  it('replaces slug labels by category names', () => {
    expect(relabelThemes([{ value: 'societe', label: 'societe', count: 2 }], { societe: 'Société' })).toEqual([
      { value: 'societe', label: 'Société', count: 2 },
    ])
  })

  it('pluralises French nouns', () => {
    expect(plural(1, 'chaîne')).toBe('chaîne')
    expect(plural(3, 'chaîne')).toBe('chaînes')
  })
})
