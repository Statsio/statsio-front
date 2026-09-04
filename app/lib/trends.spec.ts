import { describe, it, expect } from 'vitest'
import { emptyCatalogItem } from '@/lib/content-card'
import {
  itemType,
  rankTrends,
  seededSparkline,
  trendPollLead,
  trendScore,
  trendTag,
} from '@/lib/trends'
import type { CatalogItem } from '@/types/catalog'
import type { CatalogContentType } from '@/types/catalog'

const NOW = Date.parse('2026-09-04T12:00:00Z')

function item(
  id: string,
  type: CatalogContentType,
  views: number,
  updatedAt: string | null = null,
  extra: Partial<CatalogItem> = {},
): CatalogItem {
  return {
    ...emptyCatalogItem(id, type),
    slug: id,
    title: `Titre ${id}`,
    views_count: views,
    updated_at: updatedAt,
    ...extra,
  }
}

describe('itemType', () => {
  it('defaults to statsdata when the type is missing', () => {
    expect(itemType(emptyCatalogItem('x', 'article'))).toBe('article')
    const noType = { ...emptyCatalogItem('x', 'article'), type: undefined }
    expect(itemType(noType)).toBe('statsdata')
  })
})

describe('trendTag', () => {
  it('returns a distinct label and list path per type', () => {
    expect(trendTag(item('a', 'article', 0)).label).toBe('ARTICLE')
    expect(trendTag(item('s', 'survey', 0)).listPath).toBe('/sondages')
    expect(trendTag(item('d', 'statsdata', 0)).listPath).toBe('/statsdata')
  })
})

describe('trendScore', () => {
  it('rewards a recently updated content over a stale one with equal audience', () => {
    const fresh = item('fresh', 'article', 100, '2026-09-04T09:00:00Z')
    const stale = item('stale', 'article', 100, '2026-06-01T09:00:00Z')
    expect(trendScore(fresh, 'today', NOW)).toBeGreaterThan(trendScore(stale, 'today', NOW))
  })

  it('scores a given content higher on a wider window (less decay)', () => {
    const monthOld = item('m', 'article', 100, '2026-08-05T12:00:00Z')
    expect(trendScore(monthOld, 'month', NOW)).toBeGreaterThan(trendScore(monthOld, 'today', NOW))
  })

  it('keeps a highly-read but old content ahead of a barely-read fresh one', () => {
    const bigOld = item('big', 'article', 5000, '2026-05-01T12:00:00Z')
    const tinyFresh = item('tiny', 'article', 3, '2026-09-04T11:30:00Z')
    expect(trendScore(bigOld, 'today', NOW)).toBeGreaterThan(trendScore(tinyFresh, 'today', NOW))
  })

  it('is deterministic for a given now', () => {
    const it = item('a', 'article', 42, '2026-09-01T12:00:00Z')
    expect(trendScore(it, 'week', NOW)).toBe(trendScore(it, 'week', NOW))
  })
})

describe('rankTrends', () => {
  const items = [
    item('a1', 'article', 300, '2026-09-04T10:00:00Z'),
    item('d1', 'statsdata', 500, '2026-09-04T11:00:00Z'),
    item('s1', 'survey', 120, '2026-09-04T09:00:00Z'),
    item('a2', 'article', 90, '2026-09-02T10:00:00Z'),
  ]

  it('merges every type and assigns 1-based ranks by score', () => {
    const ranked = rankTrends(items, 'all', 'today', NOW)
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3, 4])
    expect(ranked[0]!.item.id).toBe('d1')
  })

  it('filters to a single type while keeping a global rank sequence', () => {
    const ranked = rankTrends(items, 'article', 'today', NOW)
    expect(ranked.map((e) => e.item.id)).toEqual(['a1', 'a2'])
    expect(ranked.map((e) => e.rank)).toEqual([1, 2])
  })

  it('drops duplicate ids', () => {
    const ranked = rankTrends([...items, item('a1', 'article', 300)], 'all', 'today', NOW)
    expect(ranked.filter((e) => e.item.id === 'a1')).toHaveLength(1)
  })

  it('returns an empty list when nothing matches', () => {
    expect(rankTrends([], 'all', 'today', NOW)).toEqual([])
  })
})

describe('trendPollLead', () => {
  it('reads the leading option from primary_options', () => {
    const survey = item('s', 'survey', 0, null, {
      primary_options: [
        { label: 'Oui', pct: 53.6 },
        { label: 'Non', pct: 46.4 },
      ],
    })
    expect(trendPollLead(survey)).toEqual({ label: 'Oui', pct: 54 })
  })

  it('returns null when there are no aggregated results', () => {
    expect(trendPollLead(item('s', 'survey', 0))).toBeNull()
  })
})

describe('seededSparkline', () => {
  it('is stable for a given seed and stays within ]0, 1]', () => {
    const a = seededSparkline('abc', 10)
    const b = seededSparkline('abc', 10)
    expect(a).toEqual(b)
    expect(a).toHaveLength(10)
    for (const v of a) {
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('differs between seeds', () => {
    expect(seededSparkline('abc')).not.toEqual(seededSparkline('xyz'))
  })
})
