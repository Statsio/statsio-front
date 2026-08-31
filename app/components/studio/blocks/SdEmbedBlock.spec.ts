import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SdEmbedBlock from './SdEmbedBlock.vue'
import { fetchPublicStatsDataBlock } from '@/api/studio'
import type { StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchPublicStatsDataBlock: vi.fn(),
}))

vi.mock('@/composables/useContentBasePath', () => ({
  useContentBasePath: () => ({ value: '' }),
}))

const stubs = {
  BlockRenderer: { name: 'BlockRenderer', props: ['block', 'readonly', 'scope'], template: '<div class="stub-renderer" />' },
  RouterLink: { name: 'RouterLink', props: ['to'], template: '<a :href="to"><slot /></a>' },
}

function makeBlock(config: Record<string, unknown> = {}): StudioBlock {
  return { id: 'emb-1', type: 'sd-embed', zoneId: 'z', fieldMapping: {}, config }
}

describe('SdEmbedBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPublicStatsDataBlock).mockReset()
  })

  it('renders an empty state and does not fetch when not configured', async () => {
    const wrapper = mount(SdEmbedBlock, { props: { block: makeBlock() }, global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Bloc Statsdata')
    expect(fetchPublicStatsDataBlock).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'BlockRenderer' }).exists()).toBe(false)
  })

  it('resolves the source block, renders the "Statsdata lié" chrome + inner BlockRenderer + source link', async () => {
    vi.mocked(fetchPublicStatsDataBlock).mockResolvedValue({
      block: { id: 'blk1', type: 'kpi', zoneId: 'z', fieldMapping: {}, config: {} },
      doc: { id: '5', slug: 'carburants', title: 'Le prix des carburants' },
      pages: [],
      datasets: [],
      params: [],
    })

    const wrapper = mount(SdEmbedBlock, {
      props: { block: makeBlock({ sourceSlug: 'carburants', sourceBlockId: 'blk1' }) },
      global: { stubs },
    })
    await flushPromises()

    expect(fetchPublicStatsDataBlock).toHaveBeenCalledWith('carburants', 'blk1')
    expect(wrapper.text()).toContain('Statsdata lié')
    expect(wrapper.text()).toContain('Le prix des carburants')
    expect(wrapper.findComponent({ name: 'BlockRenderer' }).props('block')).toMatchObject({ id: 'blk1', type: 'kpi' })
    const link = wrapper.findComponent({ name: 'RouterLink' })
    expect(link.props('to')).toBe('/statsdata/carburants')
  })

  it('hides the source link when showSourceLink is false', async () => {
    vi.mocked(fetchPublicStatsDataBlock).mockResolvedValue({
      block: { id: 'blk1', type: 'bar', zoneId: 'z', fieldMapping: {}, config: {} },
      doc: { id: '5', slug: 'carburants', title: 'Carburants' },
      pages: [],
      datasets: [],
      params: [],
    })

    const wrapper = mount(SdEmbedBlock, {
      props: { block: makeBlock({ sourceSlug: 'carburants', sourceBlockId: 'blk1', showSourceLink: false }) },
      global: { stubs },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(false)
  })

  it('shows a discreet error when the source block can no longer be resolved', async () => {
    vi.mocked(fetchPublicStatsDataBlock).mockRejectedValue(new Error('gone'))

    const wrapper = mount(SdEmbedBlock, {
      props: { block: makeBlock({ sourceSlug: 'carburants', sourceBlockId: 'blk1', sourceDocTitle: 'Carburants' }) },
      global: { stubs },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'BlockRenderer' }).exists()).toBe(false)
    expect(wrapper.text().toLowerCase()).toContain('disponible')
  })
})
