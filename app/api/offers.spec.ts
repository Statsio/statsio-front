import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { publicHttp } from '@/lib/http'
import { fetchOffers, EMPTY_OFFERS } from './offers'

describe('offers api', () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(publicHttp)
  })

  afterEach(() => {
    mock.restore()
  })

  it('maps the snake_case payload to camelCase', async () => {
    mock.onGet('/offers').reply(200, {
      success: true,
      data: {
        offers: [
          {
            id: 2,
            key: 'premium',
            name: 'Premium',
            tagline: 'Sans aucune limite.',
            price_cents: 200,
            currency: 'EUR',
            period: 'mois',
            cta_label: 'Passer à Premium',
            cta_url: null,
            badge_label: 'RECOMMANDÉ',
            is_highlighted: true,
            is_active: true,
            position: 2,
            features: [{ label: 'Chaînes illimitées', included: true }],
          },
        ],
        comparison_rows: [
          {
            id: 1,
            label: 'Chaînes éditoriales',
            hint: null,
            free_value: '1 max',
            premium_value: 'Illimitées',
            position: 0,
          },
        ],
      },
    })

    const result = await fetchOffers()

    expect(result).toEqual({
      offers: [
        {
          id: 2,
          key: 'premium',
          name: 'Premium',
          tagline: 'Sans aucune limite.',
          priceCents: 200,
          currency: 'EUR',
          period: 'mois',
          ctaLabel: 'Passer à Premium',
          ctaUrl: null,
          badgeLabel: 'RECOMMANDÉ',
          isHighlighted: true,
          isActive: true,
          position: 2,
          features: [{ label: 'Chaînes illimitées', included: true }],
        },
      ],
      comparisonRows: [
        {
          id: 1,
          label: 'Chaînes éditoriales',
          hint: null,
          freeValue: '1 max',
          premiumValue: 'Illimitées',
          position: 0,
        },
      ],
    })
  })

  it('falls back to empty lists when fields are missing', async () => {
    mock.onGet('/offers').reply(200, { success: true, data: {} })

    await expect(fetchOffers()).resolves.toEqual(EMPTY_OFFERS)
  })
})
