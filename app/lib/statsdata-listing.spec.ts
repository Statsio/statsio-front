import { describe, expect, it } from 'vitest'
import {
  applyStatsDataToggles,
  buildPreviewChart,
  buildSpark,
  formatPreviewValue,
  freshBadge,
  hasStatsDataVisual,
  NO_TOGGLES,
  previewHeadline,
  statsDataActiveFilters,
} from './statsdata-listing'
import type { CardPreview, CatalogItem } from '@/types/catalog'

const NOW = new Date('2026-11-19T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString()

function item(over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'incendies',
    title: 'Incendies de forêt',
    categories: [],
    category: 'env',
    format: null,
    reading_minutes: 0,
    linked_datasets_count: 1,
    charts_count: 2,
    views_count: 10,
    publisher: { name: 'Statsio', initials: 'S', is_channel: true, verified: true },
    is_favorited: false,
    ...over,
  }
}

const bars: CardPreview = {
  kind: 'bar',
  title: 'Surface brûlée',
  labels: ['2023', '2024', '2025'],
  series: [{ name: 'ha', values: [910, 1203, 2550] }],
  unit: 'ha',
}

describe('applyStatsDataToggles', () => {
  const a = item({
    id: 'a',
    charts_count: 0,
    linked_datasets_count: 2,
    updated_at: hoursAgo(24 * 30),
  })
  const b = item({
    id: 'b',
    charts_count: 3,
    linked_datasets_count: 1,
    freshness: { last_refreshed_at: hoursAgo(2) },
  })

  it('ne filtre rien sans interrupteur', () => {
    expect(applyStatsDataToggles([a, b], NO_TOGGLES, NOW.getTime())).toEqual([a, b])
  })
  it('combine les interrupteurs actifs', () => {
    const now = NOW.getTime()
    expect(applyStatsDataToggles([a, b], { ...NO_TOGGLES, charts: true }, now)).toEqual([b])
    expect(applyStatsDataToggles([a, b], { ...NO_TOGGLES, multi: true }, now)).toEqual([a])
    expect(applyStatsDataToggles([a, b], { ...NO_TOGGLES, week: true }, now)).toEqual([b])
    expect(applyStatsDataToggles([a, b], { charts: true, multi: true, week: false }, now)).toEqual(
      [],
    )
  })
})

it('statsDataActiveFilters suit l’ordre de la barre d’outils', () => {
  const out = statsDataActiveFilters(
    { q: ' feux ', category: 'env', toggles: { charts: true, multi: false, week: true } },
    (v) => (v === 'env' ? 'Environnement' : v),
  )
  expect(out).toEqual([
    { key: 'q', label: '« feux »' },
    { key: 'category', label: 'Environnement' },
    { key: 'charts', label: 'Avec graphiques' },
    { key: 'week', label: 'Mis à jour cette semaine' },
  ])
})

describe('freshBadge', () => {
  it('source synchronisée récemment → vert', () => {
    const b = freshBadge(
      item({ freshness: { last_refreshed_at: hoursAgo(2), refresh_frequency: 'hourly' } }),
      NOW,
    )
    expect(b).toEqual({ text: 'il y a 2 h', title: 'Synchro horaire', live: true })
  })
  it('synchro ancienne → neutre', () => {
    const b = freshBadge(
      item({ freshness: { last_refreshed_at: hoursAgo(72), refresh_frequency: 'weekly' } }),
      NOW,
    )
    expect(b.live).toBe(false)
    expect(b.text).toBe('il y a 3 j')
  })
  it('sans synchro → date de publication', () => {
    const b = freshBadge(item({ freshness: null, created_at: null, updated_at: null }), NOW)
    expect(b.text).toBe('Publié —')
    expect(b.title).toBe('Pas de synchronisation automatique')
  })
  it('en direct', () => {
    expect(freshBadge(item({ freshness: { is_live: true } }), NOW).text).toBe('En direct')
  })
})

it('hasStatsDataVisual : miniature ou graphique', () => {
  expect(hasStatsDataVisual(item({ thumbnail_url: null, charts_count: 0 }))).toBe(false)
  expect(hasStatsDataVisual(item({ thumbnail_url: 'x.jpg', charts_count: 0 }))).toBe(true)
  expect(hasStatsDataVisual(item({ thumbnail_url: null, charts_count: 1 }))).toBe(true)
})

it('formatPreviewValue', () => {
  expect(formatPreviewValue(2550, 'ha')).toBe('2 550 ha')
  expect(formatPreviewValue(1.62)).toBe('1,62')
  expect(formatPreviewValue(1_325_000)).toBe('1,3 M')
})

describe('previewHeadline', () => {
  it('dernière valeur + titre du bloc', () => {
    expect(previewHeadline(bars)).toEqual({ value: '2 550 ha', label: 'Surface brûlée' })
  })
  it('classement horizontal → premier libellé', () => {
    expect(
      previewHeadline({ ...bars, orientation: 'horizontal', labels: ['Gabriel', 'Léo'] })?.value,
    ).toBe('Gabriel')
  })
  it('aperçu vide → null', () => {
    expect(previewHeadline({ empty: true })).toBeNull()
  })
})

describe('buildPreviewChart', () => {
  const box = { width: 320, height: 150 }

  it('barres : la dernière est mise en avant, hauteurs proportionnelles', () => {
    const m = buildPreviewChart(bars, box)
    expect(m?.kind).toBe('bars')
    if (m?.kind !== 'bars') return
    expect(m.bars).toHaveLength(3)
    expect(m.bars[2]!.color).toBe('var(--ds-accent)')
    expect(m.bars[0]!.color).toBe('var(--ds-t3)')
    expect(m.bars[2]!.h).toBeGreaterThan(m.bars[0]!.h)
    expect(m.axis.map((a) => a.text)).toEqual(['2023', '2025'])
  })
  it('classement horizontal : 6 lignes max', () => {
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const m = buildPreviewChart(
      {
        kind: 'bar',
        orientation: 'horizontal',
        labels,
        series: [{ name: 's', values: [7, 6, 5, 4, 3, 2, 1] }],
      },
      box,
    )
    expect(m?.kind === 'hbars' && m.rows.length).toBe(6)
  })
  it('courbes : une ligne par série (3 max), aire sous la première', () => {
    const m = buildPreviewChart(
      {
        kind: 'line',
        labels: ['a', 'b', 'c'],
        series: [
          { name: 'x', values: [1, 2, 3] },
          { name: 'y', values: [3, 2, 1] },
        ],
      },
      box,
    )
    expect(m?.kind).toBe('line')
    if (m?.kind !== 'line') return
    expect(m.lines).toHaveLength(2)
    expect(m.area.startsWith('M')).toBe(true)
  })
  it('camembert ou aperçu vide → pas de géométrie', () => {
    expect(buildPreviewChart({ ...bars, kind: 'pie' }, box)).toBeNull()
    expect(buildPreviewChart({ empty: true }, box)).toBeNull()
  })
})

it('buildSpark', () => {
  const s = buildSpark(bars, { width: 120, height: 34 })
  expect(s?.kind === 'bars' && s.bars.map((b) => b.emph)).toEqual([false, false, true])
  expect(buildSpark({ ...bars, kind: 'line' }, { width: 120, height: 34 })?.kind).toBe('line')
})
