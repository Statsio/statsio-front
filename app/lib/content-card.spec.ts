import { describe, it, expect } from 'vitest'
import {
  catalogItemFromAccountSummary,
  catalogItemFromDocument,
  catalogItemFromEnrichedPoll,
  catalogPublisherFromChannelOrAuthor,
  emptyCatalogItem,
} from '@/lib/content-card'
import type { StatsDataDocument } from '@/api/studio'
import type { AccountContentSummary } from '@/types/account'
import type { EnrichedPoll } from '@/lib/poll-enrich'

describe('catalogPublisherFromChannelOrAuthor', () => {
  it('prefers the channel and marks it as a channel publisher', () => {
    const p = catalogPublisherFromChannelOrAuthor(
      { id: 1, name: 'Medistats', handle: 'medistats', logo_url: 'x.png', verified: true },
      { name: 'Jean' },
    )
    expect(p).toMatchObject({ name: 'Medistats', is_channel: true, verified: true, handle: 'medistats' })
  })

  it('falls back to the author when there is no channel', () => {
    const p = catalogPublisherFromChannelOrAuthor(null, { name: 'Marie Curie' })
    expect(p).toMatchObject({ name: 'Marie Curie', is_channel: false, verified: false, initials: 'MC' })
  })

  it('falls back to the "Anonyme" publisher when nothing is provided', () => {
    expect(catalogPublisherFromChannelOrAuthor(null, null)).toMatchObject({ name: 'Anonyme', is_channel: false })
  })
})

describe('catalogItemFromDocument', () => {
  const base: StatsDataDocument = { id: 'd1', title: 'Doc', type: 'statsdata' }

  it('maps core fields and derives the primary category', () => {
    const item = catalogItemFromDocument({
      ...base,
      slug: 'doc',
      categories: ['sante', 'societe'],
      datasets: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      views_count: 42,
      author: { name: 'Anne' },
    })
    expect(item).toMatchObject({
      id: 'd1',
      slug: 'doc',
      type: 'statsdata',
      category: 'sante',
      categories: ['sante', 'societe'],
      linked_datasets_count: 2,
      views_count: 42,
    })
    expect(item.publisher.is_channel).toBe(false)
  })

  it('falls back to created_at when updated_at is missing', () => {
    const item = catalogItemFromDocument({ ...base, created_at: '2026-01-01T00:00:00Z' })
    expect(item.updated_at).toBe('2026-01-01T00:00:00Z')
  })

  it('leaves survey_kind undefined when the document has none', () => {
    const item = catalogItemFromDocument({ ...base, type: 'survey' })
    expect(item.survey_kind).toBeUndefined()
  })

  it('uses a provided publisher over the document channel/author', () => {
    const item = catalogItemFromDocument(base, { name: 'Forced', initials: 'F', is_channel: true, verified: false })
    expect(item.publisher.name).toBe('Forced')
  })
})

describe('catalogItemFromAccountSummary', () => {
  const summary: AccountContentSummary = {
    id: 's1',
    slug: null,
    title: 'Fav',
    type: 'article',
    thumbnail_url: null,
    channel: null,
    author: { name: 'Léa' },
  }

  it('produces a light item with safe defaults', () => {
    const item = catalogItemFromAccountSummary(summary)
    expect(item).toMatchObject({
      id: 's1',
      slug: '',
      type: 'article',
      views_count: 0,
      reading_minutes: 0,
      categories: [],
    })
    expect(item.publisher.name).toBe('Léa')
  })
})

describe('catalogItemFromEnrichedPoll', () => {
  it('fills primary_options / responses_count / is_closed from the enriched poll', () => {
    const enriched: EnrichedPoll = {
      poll: { id: 'p1', title: 'Poll', type: 'survey', slug: 'poll' },
      to: '/sondages/poll',
      category: 'Société',
      questionType: 'Choix unique',
      options: [{ label: 'Oui', pct: 60 }, { label: 'Non', pct: 40 }],
      totalVotes: 900,
      status: { closed: true, label: 'Clôturé', urgent: false },
    }
    const item = catalogItemFromEnrichedPoll(enriched)
    expect(item).toMatchObject({
      type: 'survey',
      responses_count: 900,
      is_closed: true,
      primary_options: [{ label: 'Oui', pct: 60 }, { label: 'Non', pct: 40 }],
    })
  })
})

describe('emptyCatalogItem', () => {
  it('fills every required CatalogItem field', () => {
    const item = emptyCatalogItem('x', 'article')
    expect(item.categories).toEqual([])
    expect(item.is_favorited).toBe(false)
    expect(item.publisher).toBeDefined()
  })
})
