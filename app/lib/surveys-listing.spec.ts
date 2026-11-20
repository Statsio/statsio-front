import { describe, expect, it } from 'vitest'
import {
  surveyActiveFilters,
  surveyCta,
  surveyDial,
  surveyDialLabel,
  surveyKindCaption,
  surveyKindOptions,
  surveyKindPie,
  surveyState,
} from './surveys-listing'
import type { CatalogItem } from '@/types/catalog'

const NOW = new Date('2026-11-19T12:00:00Z')
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000).toISOString()

function survey(over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'urgences',
    title: 'Combien de temps attendez-vous aux urgences ?',
    categories: [],
    category: 'sante',
    format: null,
    reading_minutes: 0,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    publisher: { name: 'Medistats', initials: 'M', is_channel: true, verified: true },
    is_favorited: false,
    survey_kind: 'single_question',
    ...over,
  }
}

describe('surveyState', () => {
  it('sans échéance → ouvert, sans date de clôture', () => {
    expect(surveyState(survey(), NOW)).toEqual({
      open: true,
      closing: 'sans date de clôture',
      short: '—',
    })
  })
  it('échéance future → compte à rebours', () => {
    expect(surveyState(survey({ response_deadline: inDays(12) }), NOW)).toMatchObject({
      open: true,
      short: 'dans 12 j',
    })
    expect(surveyState(survey({ response_deadline: inDays(0.5) }), NOW).closing).toBe(
      'clôture demain',
    )
  })
  it('échéance passée ou is_closed → clos', () => {
    expect(surveyState(survey({ response_deadline: inDays(-3) }), NOW)).toMatchObject({
      open: false,
      short: 'clos',
    })
    expect(surveyState(survey({ is_closed: true }), NOW).closing).toBe('clos')
  })
  it('pétition close objectif atteint', () => {
    const s = surveyState(
      survey({
        survey_kind: 'petition',
        is_closed: true,
        petition_goal: 100,
        responses_count: 120,
      }),
      NOW,
    )
    expect(s.closing).toBe('objectif atteint, clos')
  })
})

it('surveyCta', () => {
  const open = { open: true, closing: '', short: '' }
  expect(surveyCta(survey({ has_participated: true }), open)).toEqual({
    kind: 'done',
    label: 'Vous avez participé',
  })
  expect(surveyCta(survey(), { ...open, open: false }).kind).toBe('results')
  expect(surveyCta(survey({ survey_kind: 'petition' }), open).label).toBe('Signer')
  expect(surveyCta(survey({ survey_kind: 'long' }), open).label).toBe('Répondre')
  expect(surveyCta(survey(), open).label).toBe('Voter')
})

describe('surveyDial', () => {
  it('sondage rapide : options complètes, légende triée, « Autres » au-delà de 4', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map((label, i) => ({
      label,
      pct: [10, 40, 20, 15, 10, 5][i]!,
      count: 0,
    }))
    const dial = surveyDial(
      survey({ responses_count: 50, question_previews: [{ type: 'choice', label: 'Q', rows }] }),
    )
    expect(dial.kind).toBe('results')
    if (dial.kind !== 'results') return
    expect(dial.options.map((o) => o.label)).toEqual(['a', 'b', 'c', 'd', 'Autres'])
    expect(dial.options.at(-1)!.pct).toBe(15)
    expect(dial.ranked[0]!.label).toBe('b')
  })
  it('questionnaire', () => {
    expect(
      surveyDial(
        survey({
          survey_kind: 'long',
          questions_count: 6,
          estimated_minutes: 3,
          responses_count: 4,
        }),
      ),
    ).toEqual({
      kind: 'questions',
      questions: 6,
      minutes: 3,
      participants: 4,
    })
  })
  it('pétition : progression plafonnée à 1', () => {
    const dial = surveyDial(
      survey({ survey_kind: 'petition', petition_goal: 100, responses_count: 250 }),
    )
    expect(dial).toMatchObject({ kind: 'signatures', progress: 1 })
    expect(surveyDialLabel(dial)).toBe('250 signatures sur 100')
  })
  it('aucune réponse', () => {
    expect(surveyDialLabel(surveyDial(survey({ responses_count: 0 })))).toBe(
      'Aucune réponse pour le moment',
    )
  })
})

describe('types (hero et filtre)', () => {
  const facets = [
    { value: '', label: 'Tous', count: 6 },
    { value: 'single_question', label: 'Sondage rapide', count: 3 },
    { value: 'long', label: 'Questionnaire', count: 2 },
    { value: 'petition', label: 'Pétition', count: 1 },
  ]
  it('options : « Tous » en tête avec le total', () => {
    expect(surveyKindOptions(facets).map((o) => [o.value, o.count])).toEqual([
      ['', 6],
      ['single_question', 3],
      ['long', 2],
      ['petition', 1],
    ])
    expect(surveyKindOptions(undefined)[0]!.count).toBe(0)
  })
  it('camembert sans « Tous » ni type vide', () => {
    const opts = surveyKindOptions([
      ...facets.slice(0, 3),
      { value: 'petition', label: 'Pétition', count: 0 },
    ])
    expect(surveyKindPie(opts).map((s) => s.label)).toEqual(['Sondage rapide', 'Questionnaire'])
  })
  it('légende accordée', () => {
    expect(surveyKindCaption(surveyKindOptions(facets))).toBe(
      '3 sondages rapides, 2 questionnaires et 1 pétition.',
    )
    expect(surveyKindCaption(surveyKindOptions([]))).toBeNull()
  })
})

it('surveyActiveFilters suit l’ordre de la barre d’outils', () => {
  const out = surveyActiveFilters(
    { q: 'urgences', kind: 'petition', category: 'sante', status: 'clos', notParticipated: true },
    () => 'Santé',
  )
  expect(out.map((f) => f.label)).toEqual([
    '« urgences »',
    'Pétition',
    'Santé',
    'Clos',
    'Pas encore participé',
  ])
})
