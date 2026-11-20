import { describe, expect, it } from 'vitest'
import {
  activityCells,
  activitySummary,
  CHANNEL_KINDS,
  channelActiveFilters,
  channelBannerArt,
  channelKindCaption,
  channelKindPie,
  channelMix,
  isNewChannel,
  segmentOptions,
} from './channels-listing'

const kindFacets = [
  { value: '', label: 'Tous', count: 6 },
  { value: 'redaction', label: 'Rédaction', count: 4 },
  { value: 'institution', label: 'Institution', count: 0 },
  { value: 'independant', label: 'Indépendant', count: 2 },
]

describe('segmentOptions', () => {
  it('« Toutes » en tête, libellés de la charte, options vides retirées', () => {
    expect(segmentOptions(kindFacets, CHANNEL_KINDS, '')).toEqual([
      { value: '', label: 'Toutes', count: 6 },
      { value: 'redaction', label: 'Rédaction', count: 4 },
      { value: 'independant', label: 'Indépendant', count: 2 },
    ])
  })
  it("garde l'option active même vide", () => {
    expect(segmentOptions(kindFacets, CHANNEL_KINDS, 'institution').map((o) => o.value)).toContain(
      'institution',
    )
  })
})

it('channelMix retire les parts vides', () => {
  expect(
    channelMix({ statsdata_count: 3, articles_count: 0, surveys_count: 2 }).map((p) => [
      p.key,
      p.count,
    ]),
  ).toEqual([
    ['statsdata', 3],
    ['survey', 2],
  ])
})

describe('activité', () => {
  it('30 cases, la dernière parution marquée', () => {
    const cells = activityCells([3, 10, 29, 42])
    expect(cells).toHaveLength(30)
    expect(cells.filter((c) => c.on)).toHaveLength(3)
    expect(cells[29]).toEqual({ on: true, last: true })
    expect(cells[10]).toEqual({ on: true, last: false })
  })
  it('résumé', () => {
    expect(
      activitySummary({ pace: 'semaine', activity_days: [1, 2], last_published_at: null }),
    ).toEqual({
      pace: 'Publie chaque semaine',
      detail: '2 jours de parution sur 30',
    })
  })
})

it('isNewChannel : ouverte depuis moins de 30 jours', () => {
  const now = new Date('2026-11-19T12:00:00Z')
  expect(isNewChannel({ created_at: '2026-11-14T00:00:00Z' }, now)).toBe(true)
  expect(isNewChannel({ created_at: '2026-09-01T00:00:00Z' }, now)).toBe(false)
  expect(isNewChannel({ created_at: null }, now)).toBe(false)
})

it('channelBannerArt : couleurs personnalisées, 3 tranches, 4 barres dans le cadre', () => {
  const art = channelBannerArt(
    { id: 3, custom_color_primary: '#111111', custom_color_secondary: '#222222' },
    { width: 400, height: 92 },
  )
  expect(art.slices.map((s) => s.fill)).toEqual(['#111111', '#222222', '#111111'])
  expect(art.bars).toHaveLength(4)
  for (const b of art.bars) expect(b.y + b.h).toBe(92)
})

describe('hero', () => {
  it('camembert sans type vide', () => {
    expect(channelKindPie(kindFacets).map((s) => s.label)).toEqual(['Rédaction', 'Indépendant'])
  })
  it('légende accordée', () => {
    expect(channelKindCaption(kindFacets)).toBe(
      "4 rédactions · 2 indépendants. La vérification confirme l'identité de l'éditeur, pas ses opinions.",
    )
    expect(channelKindCaption([])).toBeNull()
  })
})

it('channelActiveFilters suit l’ordre de la barre d’outils', () => {
  const out = channelActiveFilters(
    { q: 'eau', kind: 'institution', theme: 'env', pace: 'jour', verified: true, followed: true },
    () => 'Environnement',
  )
  expect(out.map((f) => f.label)).toEqual([
    '« eau »',
    'Institution',
    'Environnement',
    'Quotidien',
    'Chaînes vérifiées',
    'Mes abonnements',
  ])
})
