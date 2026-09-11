import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SidebarBlocks from './SidebarBlocks.vue'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('SidebarBlocks', () => {
  it('shows the real offer name (from the CRUD, not a hardcoded label) on a block flagged premium', () => {
    const studio = useStudioStore()
    studio.premiumBlockTypes.push('map')
    studio.premiumBlockOffers.map = { id: 2, key: 'pro', name: 'Pro' }

    const w = mount(SidebarBlocks)

    const mapCard = w.find('[data-block-type="map"]')
    expect(mapCard.text()).toContain('Pro')
    expect(mapCard.text()).not.toContain('Premium')
  })

  it('does not add the block and opens the upsell when a freemium user clicks a premium block', async () => {
    const studio = useStudioStore()
    studio.premiumBlockTypes.push('map')
    const initialCount = studio.blocks.length

    const w = mount(SidebarBlocks)
    await w.find('[data-block-type="map"]').trigger('click')

    expect(studio.blocks).toHaveLength(initialCount)
    expect(studio.premiumUpsellBlockType).toBe('map')
  })

  it('adds the block normally for a premium user', async () => {
    const studio = useStudioStore()
    studio.premiumBlockTypes.push('map')
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'premium@example.com', is_premium: true, profile: null }
    const initialCount = studio.blocks.length

    const w = mount(SidebarBlocks)
    await w.find('[data-block-type="map"]').trigger('click')

    expect(studio.blocks).toHaveLength(initialCount + 1)
    expect(studio.premiumUpsellBlockType).toBeNull()
  })

  it('does not show a pill on a freemium block', () => {
    const studio = useStudioStore()
    studio.premiumBlockTypes.push('map')

    const w = mount(SidebarBlocks)

    const barCard = w.find('[data-block-type="bar"]')
    expect(barCard.text()).not.toContain('Premium')
  })

  it('hides the form category entirely for a petition', () => {
    const studio = useStudioStore()
    studio.initPage({ id: 'c1', type: 'survey', survey_kind: 'petition', title: 'Pétition' })

    const w = mount(SidebarBlocks)

    expect(w.find('[data-block-type="choice"]').exists()).toBe(false)
    expect(w.find('[data-block-type="scale"]').exists()).toBe(false)
  })

  it('shows the form category for a single_question survey', () => {
    const studio = useStudioStore()
    studio.initPage({ id: 'c1', type: 'survey', survey_kind: 'single_question', title: 'Sondage' })

    const w = mount(SidebarBlocks)

    expect(w.find('[data-block-type="choice"]').exists()).toBe(true)
  })

  it('blocks adding a second form block on a single_question survey', async () => {
    const studio = useStudioStore()
    studio.initPage({ id: 'c1', type: 'survey', survey_kind: 'single_question', title: 'Sondage' })
    studio.addBlock('choice', `${studio.sections[0]!.id}-0`)
    const countAfterFirst = studio.blocks.length

    const w = mount(SidebarBlocks)
    await w.find('[data-block-type="checkboxes"]').trigger('click')

    expect(studio.blocks).toHaveLength(countAfterFirst)
  })
})
