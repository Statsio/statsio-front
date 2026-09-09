import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DashboardUpgradeCard from './DashboardUpgradeCard.vue'
import { useAuthStore } from '@/stores/auth'

const global = { stubs: { NuxtLink: RouterLinkStub } }

describe('DashboardUpgradeCard', () => {
  it('renders the upgrade card linking to /offres for a freemium user', () => {
    setActivePinia(createPinia())
    const w = mount(DashboardUpgradeCard, { global })

    expect(w.text()).toContain('Passez à Statsio Pro')
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/offres')
  })

  it('emits "navigate" when the CTA is clicked', async () => {
    setActivePinia(createPinia())
    const w = mount(DashboardUpgradeCard, { global })

    await w.findComponent(RouterLinkStub).trigger('click')

    expect(w.emitted('navigate')).toHaveLength(1)
  })

  it('renders nothing for a premium user', () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'premium@example.com', is_premium: true, profile: null }

    const w = mount(DashboardUpgradeCard, { global })

    expect(w.text()).toBe('')
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
  })
})
