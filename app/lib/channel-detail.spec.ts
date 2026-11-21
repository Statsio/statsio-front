import { describe, expect, it } from 'vitest'
import {
  activityDaysFromDates,
  countryLabel,
  emphasizeChannelName,
  groupChannelDossiers,
  matchesChannelQuery,
  paceFromRecentCount,
} from './channel-detail'
import type { CatalogItem } from '@/types/catalog'

describe('channel detail helpers', () => {
  it('emphasizes the last words of a channel name', () => {
    expect(emphasizeChannelName('Le Labo des prix')).toEqual({ lead: 'Le Labo', accent: 'des prix' })
    expect(emphasizeChannelName('Data Desk')).toEqual({ lead: 'Data', accent: 'Desk' })
    expect(emphasizeChannelName('Insee')).toEqual({ lead: 'Insee', accent: '' })
  })

  it('maps country codes and keeps unknown labels', () => {
    expect(countryLabel('fr')).toBe('France')
    expect(countryLabel('Québec')).toBe('Québec')
    expect(countryLabel(null)).toBeNull()
  })

  it('places publication days on a 30-day strip', () => {
    const now = new Date('2026-11-21T12:00:00Z')
    expect(activityDaysFromDates(['2026-11-21T08:00:00Z', '2026-10-01T08:00:00Z'], now)).toEqual([29])
    expect(paceFromRecentCount(12)).toBe('jour')
    expect(paceFromRecentCount(3)).toBe('semaine')
    expect(paceFromRecentCount(0)).toBe('mois')
  })

  it('filters titles without accents and groups dossiers', () => {
    const item = {
      title: 'Prix des carburants',
      description: 'Gazole',
      dossier: { slug: 'pouvoir', name: "Pouvoir d'achat" },
      type: 'statsdata',
    } as CatalogItem
    expect(matchesChannelQuery(item, 'carburant')).toBe(true)
    expect(matchesChannelQuery(item, 'loyer')).toBe(false)
    expect(groupChannelDossiers([item, { ...item, type: 'article' }])).toEqual([
      {
        slug: 'pouvoir',
        name: "Pouvoir d'achat",
        count: 2,
        byType: { statsdata: 1, article: 1, survey: 0 },
      },
    ])
  })
})
