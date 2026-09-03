import { describe, it, expect } from 'vitest'
import type { CatalogItem } from '@/types/catalog'
import { surveyCardMeta } from '@/lib/survey-card'
import { getSurveyKindMeta } from '@/lib/poll-visuals'

function item(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: '1',
    slug: 's',
    title: 'T',
    categories: [],
    category: null,
    format: null,
    reading_minutes: 1,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    publisher: { name: 'X', initials: 'X', is_channel: false, verified: false },
    is_favorited: false,
    ...overrides,
  }
}

describe('getSurveyKindMeta', () => {
  it('maps each kind and falls back to single_question', () => {
    expect(getSurveyKindMeta('petition').label).toBe('Pétition')
    expect(getSurveyKindMeta('long').label).toBe('Questionnaire')
    expect(getSurveyKindMeta(undefined).label).toBe('Sondage rapide')
    expect(getSurveyKindMeta('nope').label).toBe('Sondage rapide')
  })
})

describe('surveyCardMeta', () => {
  it('marks the leading option and computes participation label', () => {
    const meta = surveyCardMeta(item({
      survey_kind: 'single_question',
      responses_count: 1240,
      primary_options: [
        { label: 'Oui', pct: 54 },
        { label: 'Non', pct: 27 },
        { label: 'Selon', pct: 19 },
      ],
    }))
    expect(meta.options[0]?.lead).toBe(true)
    expect(meta.options[1]?.lead).toBe(false)
    expect(meta.participationLabel).toContain('réponses')
  })

  it('computes petition progress toward its goal', () => {
    const meta = surveyCardMeta(item({
      survey_kind: 'petition',
      responses_count: 25000,
      petition_goal: 50000,
    }))
    expect(meta.goalPct).toBe(50)
    expect(meta.participationLabel).toContain('signature')
  })

  it('reports a closed survey', () => {
    const meta = surveyCardMeta(item({ survey_kind: 'long', is_closed: true }))
    expect(meta.statusLabel).toBe('CLOS')
    expect(meta.goalPct).toBeNull()
  })
})
