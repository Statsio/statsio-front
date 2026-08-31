import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MentionPicker from './MentionPicker.vue'
import { fetchContentMentions } from '@/api/studio'

vi.mock('@/api/studio', () => ({
  fetchContentMentions: vi.fn<(...args: unknown[]) => unknown>(),
}))

const rows = [
  { id: '1', type: 'statsdata' as const, slug: 'carburants', title: 'Le prix des carburants', publisher: { name: 'Éco', is_channel: true } },
  { id: '2', type: 'article' as const, slug: 'enquete', title: 'Carburants : enquête', publisher: { name: 'MJ', is_channel: false } },
]

/** Monte le picker et laisse passer le debounce interne (200 ms). */
async function mountReady(query: string) {
  const wrapper = mount(MentionPicker, { props: { query } })
  await vi.advanceTimersByTimeAsync(250)
  await flushPromises()
  return wrapper
}

describe('MentionPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(fetchContentMentions).mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('does not search for a query shorter than 2 chars', async () => {
    const wrapper = await mountReady('c')
    expect(fetchContentMentions).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('au moins 2 caractères')
  })

  it('searches (debounced) and lists results with a type badge', async () => {
    vi.mocked(fetchContentMentions).mockResolvedValue(rows)
    const wrapper = await mountReady('carbu')

    expect(fetchContentMentions).toHaveBeenCalledWith('carbu')
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.text()).toContain('Statsdata')
    expect(wrapper.text()).toContain('Le prix des carburants')
  })

  it('emits select for the active row via keyboard helpers', async () => {
    vi.mocked(fetchContentMentions).mockResolvedValue(rows)
    const wrapper = await mountReady('carbu')

    wrapper.vm.moveDown()
    wrapper.vm.selectActive()

    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ slug: 'enquete' })
  })

  it('emits select on click (mousedown)', async () => {
    vi.mocked(fetchContentMentions).mockResolvedValue(rows)
    const wrapper = await mountReady('carbu')

    await wrapper.findAll('button')[0]!.trigger('mousedown')
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ slug: 'carburants' })
  })
})
