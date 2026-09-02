import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return {
    ...actual,
    blockColumnGroups: () => [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'a' }, { name: 'b' }] }],
  }
})
vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import CalcColumnField from './CalcColumnField.vue'
import type { CalcColumn, StudioBlock } from '@/types/studio'

const block: StudioBlock = {
  id: 'b1', type: 'bar', zoneId: 'z', datasetId: 'ds1',
  sources: [{ id: 'ds1', datasetId: 'ds1' }], primarySourceId: 'ds1',
  fieldMapping: {}, config: {},
}

function mountField(calc: CalcColumn) {
  const w = mount(CalcColumnField, {
    props: {
      block,
      modelValue: calc,
      'onUpdate:modelValue': (v: CalcColumn) => w.setProps({ modelValue: v }),
    },
  })
  const last = () => (w.emitted('update:modelValue')!.at(-1)![0]) as CalcColumn
  return { w, last }
}

beforeEach(() => setActivePinia(createPinia()))

describe('CalcColumnField', () => {
  it('édite le libellé', async () => {
    const { w, last } = mountField({ id: 'x', label: '', operands: [{ column: 'a' }] })
    await w.find('input[type="text"]').setValue('Taux')
    expect(last().label).toBe('Taux')
  })

  it('ajoute une colonne, choisit un opérateur, ajoute une valeur, retire un opérande', async () => {
    const { w, last } = mountField({ id: 'x', label: 'T', operands: [{ column: 'a' }] })

    await w.findAll('button').find((b) => b.text() === '+ colonne')!.trigger('click')
    expect(last().operands).toEqual([{ column: 'a' }, { op: '+', column: '' }])

    await w.find('select').setValue('*')
    expect(last().operands[1]).toEqual({ op: '*', column: '' })

    await w.findAll('button').find((b) => b.text() === '+ valeur')!.trigger('click')
    expect(last().operands.at(-1)).toEqual({ op: '+', value: 0 })

    await w.find('button[aria-label="Retirer l\'opérande"]').trigger('click')
    expect(last().operands).toHaveLength(2)
  })

  it('un opérande numérique met à jour value', async () => {
    const { w, last } = mountField({ id: 'x', label: 'T', operands: [{ column: 'a' }, { op: '*', value: 1 }] })
    await w.find('input[type="number"]').setValue('100')
    expect(last().operands[1]).toEqual({ op: '*', value: 100 })
  })
})
