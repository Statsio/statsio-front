import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import SurveyCard from './SurveyCard.vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentManageMeta } from '@/types/content-card'

vi.mock('@/composables/useContentBasePath', () => ({
  useContentBasePath: () => ({ value: '' }),
}))

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: '1',
    slug: 'mon-sondage',
    title: 'Mon sondage',
    description: null,
    type: 'survey',
    categories: ['societe'],
    category: 'societe',
    format: null,
    tags: [],
    reading_minutes: 0,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    updated_at: '2026-08-01T00:00:00Z',
    publisher: { name: 'Institut X', initials: 'IX', is_channel: true, verified: false },
    is_favorited: false,
    ...overrides,
  }
}

const manage: ContentManageMeta = {
  statusLabel: 'Publié',
  statusBg: '#dff',
  statusColor: '#070',
  live: true,
  ownerKind: 'chaine',
  ownerLabel: 'Institut X',
  date: '1 août',
  viewsCount: 10,
  studioPath: '/studio/survey/mon-sondage',
  propertiesPath: '/contenu/mon-sondage/proprietes',
  publicPath: '/sondages/mon-sondage',
}

const global = { stubs: { NuxtLink: RouterLinkStub, CatalogSubBrandTag: true } }

describe('SurveyCard', () => {
  it('single_question: renders the option bars', () => {
    const w = mount(SurveyCard, {
      props: {
        item: item({
          survey_kind: 'single_question',
          responses_count: 900,
          primary_options: [
            { label: 'Oui', pct: 62 },
            { label: 'Non', pct: 38 },
          ],
        }),
      },
      global,
    })
    expect(w.text()).toContain('Oui')
    expect(w.text()).toContain('62 %')
    expect(w.text()).toContain('SONDAGE RAPIDE')
  })

  it('petition: renders the goal gauge and sign CTA', () => {
    const w = mount(SurveyCard, {
      props: { item: item({ survey_kind: 'petition', responses_count: 5000, petition_goal: 10000 }) },
      global,
    })
    expect(w.text()).toContain('SIGNER LA PÉTITION')
    expect(w.text()).toContain('50 % atteint')
  })

  it('long: renders the questionnaire panel', () => {
    const w = mount(SurveyCard, {
      props: { item: item({ survey_kind: 'long', questions_count: 8, estimated_minutes: 4 }) },
      global,
    })
    expect(w.text()).toContain('8 questions')
  })

  it('degraded (no survey_kind / options): title + status only, no bars', () => {
    const w = mount(SurveyCard, { props: { item: item() }, global })
    expect(w.text()).toContain('Mon sondage')
    expect(w.text()).not.toContain('RÉPONDRE AU QUESTIONNAIRE')
    expect(w.text()).not.toContain('SIGNER LA PÉTITION')
  })

  it('manage: status badge + Studio link, no fav star, no CTA', () => {
    const w = mount(SurveyCard, {
      props: { item: item({ survey_kind: 'single_question', primary_options: [{ label: 'Oui', pct: 60 }] }), mode: 'manage', manage },
      global,
    })
    expect(w.text()).toContain('Publié')
    expect(w.text()).toContain('Studio')
    expect(w.text()).not.toContain('☆')
    expect(w.text()).not.toContain('Participation')
  })

  it('feature dark: renders the à la une hero', () => {
    const w = mount(SurveyCard, {
      props: { item: item({ survey_kind: 'single_question' }), format: 'row', feature: true, tone: 'dark' },
      global,
    })
    expect(w.text()).toContain('À LA UNE · SONDAGE RAPIDE')
  })
})
