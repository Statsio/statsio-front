import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
  fetchPublicCatalog: vi.fn<() => Promise<unknown>>().mockResolvedValue({ data: [] }),
}))

import MediaBlockInspector from './MediaBlockInspector.vue'
import { useStudioStore } from '@/stores/studio'
import type { BlockType, StudioBlock } from '@/types/studio'

function seed(type: BlockType): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock(type, `${section.id}-0`)
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('MediaBlockInspector — editorial blocks inline (no modal)', () => {
  it('button: renders label / URL fields inline', () => {
    const block = seed('button')
    const w = mount(MediaBlockInspector, { props: { block } })
    expect(w.text()).toContain('Label du bouton')
    expect(w.text()).toContain('URL de destination')
    expect(w.text()).toContain('Variante')
  })

  it('link-card: shows the destination mode segmented control inline', () => {
    const block = seed('link-card')
    const w = mount(MediaBlockInspector, { props: { block } })
    expect(w.text()).toContain('Type de lien')
    expect(w.text()).toContain('URL externe')
  })

  it('retenir: FieldList edits write config.retenirItems', async () => {
    const block = seed('retenir')
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockConfig')
    const w = mount(MediaBlockInspector, { props: { block } })

    await w.findAll('button').find((b) => b.text().includes('Ajouter un point'))!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, { retenirItems: [''] })
  })
})
