import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const fetchColumnFacets = vi.fn<(...a: unknown[]) => Promise<unknown>>()

vi.mock('@/api/studio', () => ({
  fetchColumnFacets: (...a: unknown[]) => fetchColumnFacets(...a),
}))

import FieldValueLabels from './FieldValueLabels.vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

function seed(fieldMapping: StudioBlock['fieldMapping'] = {}): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('bar', `${section.id}-0`)
  Object.assign(block, {
    datasetId: 'ds1',
    sources: [{ id: 'ds1', datasetId: 'ds1' }],
    primarySourceId: 'ds1',
    fieldMapping: { xAxis: 'sexe', ...fieldMapping },
  })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchColumnFacets.mockReset()
  fetchColumnFacets.mockResolvedValue({
    column: 'sexe',
    values: [
      { value: 'M', count: 12 },
      { value: 'F', count: 8 },
    ],
    total: 2,
    offset: 0,
    limit: 50,
    hasCounts: true,
    partial: false,
  })
})

describe('FieldValueLabels', () => {
  it("ne charge les facettes qu'à l'ouverture", async () => {
    const block = seed()
    const w = mount(FieldValueLabels, { props: { block, columnRef: 'sexe' } })
    expect(fetchColumnFacets).not.toHaveBeenCalled()

    await w.find('button').trigger('click')
    await flushPromises()
    expect(fetchColumnFacets).toHaveBeenCalledWith(
      'ds1',
      'sexe',
      expect.objectContaining({ limit: 50 }),
    )
    expect(w.text()).toContain('M')
    expect(w.text()).toContain('F')
  })

  it('écrit fieldMapping.valueLabels[ref][valeur] à la saisie', async () => {
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(FieldValueLabels, { props: { block, columnRef: 'sexe' } })

    await w.find('button').trigger('click')
    await flushPromises()

    const input = w.findAll('input[type="text"]')[0]!
    await input.setValue('Hommes')
    await input.trigger('change')

    expect(spy).toHaveBeenCalledWith(block.id, { valueLabels: { sexe: { M: 'Hommes' } } })
  })

  it('retire la clé quand le libellé est vidé', async () => {
    const block = seed({ valueLabels: { sexe: { M: 'Hommes' } } })
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(FieldValueLabels, { props: { block, columnRef: 'sexe' } })

    await w.find('button').trigger('click')
    await flushPromises()

    const input = w.findAll('input[type="text"]')[0]!
    await input.setValue('')
    await input.trigger('change')

    expect(spy).toHaveBeenCalledWith(block.id, { valueLabels: undefined })
  })

  it('affiche le compteur de libellés définis', () => {
    const block = seed({ valueLabels: { sexe: { M: 'Hommes', F: 'Femmes' } } })
    const w = mount(FieldValueLabels, { props: { block, columnRef: 'sexe' } })
    expect(w.text()).toContain('2')
  })
})
