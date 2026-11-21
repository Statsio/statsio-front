import { describe, expect, it } from 'vitest'
import type { CatalogItem } from '@/types/catalog'
import {
  accentLastWord,
  buildDossierFrise,
  filterDossierItems,
  groupDossierByMonth,
  orderDossierItems,
} from '@/lib/dossier-detail'

function item(partial: Partial<CatalogItem> & Pick<CatalogItem, 'id' | 'title'>): CatalogItem {
  return {
    slug: partial.id,
    categories: [],
    category: null,
    format: null,
    reading_minutes: 4,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 10,
    publisher: { name: 'Statsio', initials: 'ST', is_channel: true, verified: true },
    is_favorited: false,
    ...partial,
  }
}

const items = [
  item({ id: 'a', title: 'Surface brûlée', type: 'statsdata', created_at: '2026-11-21T10:00:00Z' }),
  item({
    id: 'b',
    title: 'Gironde, un été hors norme',
    type: 'article',
    description: 'Retour sur Landiras',
    created_at: '2026-11-16T10:00:00Z',
  }),
  item({ id: 'c', title: 'Votre commune', type: 'survey', created_at: '2026-08-02T10:00:00Z' }),
]

describe('dossier detail', () => {
  it('met le dernier mot du titre en accent', () => {
    expect(accentLastWord('Feux de forêt')).toEqual([
      { text: 'Feux de ' },
      { text: 'forêt', em: true },
    ])
  })

  it('filtre par type et par recherche sans accent', () => {
    expect(filterDossierItems(items, 'article', '').map((entry) => entry.id)).toEqual(['b'])
    expect(filterDossierItems(items, '', 'ete landiras').map((entry) => entry.id)).toEqual(['b'])
  })

  it('groupe le fil du plus récent au plus ancien', () => {
    const groups = groupDossierByMonth(orderDossierItems(items, 'new'), '2026-08-02')
    expect(groups.map((group) => group.label)).toEqual(['novembre 2026', 'août 2026'])
    expect(groups[0]?.items.map((entry) => entry.id)).toEqual(['a', 'b'])
    expect(groups[0]?.summary).toContain('2 ajouts')
    expect(groups[1]?.opened).toBe(true)
  })

  it('pose les contenus trop proches sur des voies différentes de la frise', () => {
    const frise = buildDossierFrise(items, new Date('2026-11-21T12:00:00Z'))
    expect(frise).not.toBeNull()
    const november = frise!.marks.filter((mark) => mark.id === 'a' || mark.id === 'b')
    expect(new Set(november.map((mark) => mark.lane)).size).toBe(2)
    expect(frise!.nowLeft).not.toBeNull()
  })
})
