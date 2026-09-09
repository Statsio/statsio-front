import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import OfferPlanCard from './OfferPlanCard.vue'
import type { Offer } from '@/types/offer'

const baseOffer: Offer = {
  id: 1,
  key: 'freemium',
  name: 'Freemium',
  tagline: 'Pour démarrer.',
  priceCents: 0,
  currency: 'EUR',
  period: 'mois',
  ctaLabel: 'Continuer avec Freemium',
  ctaUrl: null,
  badgeLabel: null,
  isHighlighted: false,
  isActive: true,
  position: 1,
  features: [
    { label: 'Toutes les fonctionnalités du Studio, sauf le block Carte', included: true },
    { label: '1 chaîne éditoriale maximum', included: false },
  ],
}

const global = { stubs: { 'router-link': RouterLinkStub } }

describe('OfferPlanCard', () => {
  it('renders the price, features and CTA of a freemium offer', () => {
    const w = mount(OfferPlanCard, { props: { offer: baseOffer, href: '/register' }, global })

    expect(w.text()).toContain('0 €')
    expect(w.text()).toContain('Continuer avec Freemium')
    expect(w.text()).toContain('Toutes les fonctionnalités du Studio, sauf le block Carte')
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/register')
  })

  it('renders the highlighted variant with its badge', () => {
    const premium: Offer = {
      ...baseOffer,
      key: 'premium',
      name: 'Premium',
      priceCents: 200,
      ctaLabel: 'Passer à Premium',
      badgeLabel: 'RECOMMANDÉ',
      isHighlighted: true,
    }

    const w = mount(OfferPlanCard, { props: { offer: premium, href: '/contact' }, global })

    expect(w.text()).toContain('2 €')
    expect(w.text()).toContain('RECOMMANDÉ')
    expect(w.classes()).toContain('bg-slate-950')
  })

  it('renders an external href as a plain link, not a router-link', () => {
    const w = mount(OfferPlanCard, {
      props: { offer: baseOffer, href: 'https://example.com/checkout' },
      global,
    })

    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
    expect(w.find('a[href="https://example.com/checkout"]').exists()).toBe(true)
  })

  it('renders a button emitting "checkout" instead of a link when checkout is true', async () => {
    const w = mount(OfferPlanCard, {
      props: { offer: baseOffer, href: '/register', checkout: true },
      global,
    })

    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
    const button = w.find('button[type="button"]')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    expect(w.emitted('checkout')).toHaveLength(1)
  })

  it('disables the checkout button and shows a loading label while redirecting', () => {
    const w = mount(OfferPlanCard, {
      props: { offer: baseOffer, href: '/register', checkout: true, loading: true },
      global,
    })

    expect(w.find('button[type="button"]').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Redirection…')
  })
})
