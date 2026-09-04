import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsDataHero from './StatsDataHero.vue'
import type { StatsDataDocument } from '@/api/studio'

const stubs = {
  ContentCoverImage: { name: 'ContentCoverImage', props: ['doc'], template: '<div />' },
  ContentCreatorByline: { name: 'ContentCreatorByline', props: ['doc', 'isFollowing', 'canFollow'], template: '<div />' },
  StatsDataActionButton: { name: 'StatsDataActionButton', template: '<button @click="$emit(\'click\')"><slot /></button>' },
}

function makeDoc(overrides: Partial<StatsDataDocument> = {}): StatsDataDocument {
  return { id: '1', title: 'Prix des carburants', categories: ['energie'], ...overrides }
}

const baseProps = {
  title: 'Prix des carburants',
  isFavorite: false,
  isFollowing: false,
  canFollow: false,
}

describe('StatsDataHero', () => {
  it('renders one button per search / param action, labelled by placeholder / title', () => {
    const w = mount(StatsDataHero, {
      props: {
        ...baseProps,
        doc: makeDoc(),
        actions: [
          { id: 'b1', label: 'Chercher ma commune', otherPage: false, path: '/statsdata/x/p1' },
          { id: 'b2', label: 'Choisir un carburant', otherPage: true, path: '/statsdata/x/p2' },
        ],
      },
      global: { stubs },
    })
    expect(w.text()).toContain('Chercher ma commune')
    expect(w.text()).toContain('Choisir un carburant')
  })

  it('emits activate with the action when a button is clicked', async () => {
    const action = { id: 'b1', label: 'Chercher ma commune', otherPage: false, path: '/statsdata/x/p1' }
    const w = mount(StatsDataHero, {
      props: { ...baseProps, doc: makeDoc(), actions: [action] },
      global: { stubs },
    })
    await w.findAll('button').at(-1)!.trigger('click')
    expect(w.emitted('activate')?.[0]).toEqual([action])
  })
})
