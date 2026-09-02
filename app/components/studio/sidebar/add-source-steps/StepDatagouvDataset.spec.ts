import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import StepDatagouvDataset from './StepDatagouvDataset.vue'

const searchDataGouvDatasets = vi.fn<(...a: unknown[]) => unknown>()
const fetchDataGouvDataset = vi.fn<(...a: unknown[]) => unknown>()

vi.mock('@/api/datagouv', () => ({
  searchDataGouvDatasets: (...args: unknown[]) => searchDataGouvDatasets(...args),
  fetchDataGouvDataset: (...args: unknown[]) => fetchDataGouvDataset(...args),
}))

function mountStep(props: Partial<{ datagouvInput: string; datagouvName: string }> = {}) {
  return mount(StepDatagouvDataset, {
    props: { datagouvInput: '', datagouvName: '', ...props },
  })
}

describe('StepDatagouvDataset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('recherche, ouvre un jeu de données et importe une ressource requêtable', async () => {
    searchDataGouvDatasets.mockResolvedValue({
      total: 1,
      page: 1,
      page_size: 20,
      datasets: [
        { id: 'abc', slug: 'le-prix-des-carburants', title: 'Le prix des carburants', page_url: '', organization: { name: 'Min', page_url: null }, last_update: null, resources_count: 2 },
      ],
    })
    fetchDataGouvDataset.mockResolvedValue({
      id: 'abc',
      slug: 'le-prix-des-carburants',
      title: 'Le prix des carburants',
      description: null,
      page_url: 'https://www.data.gouv.fr/fr/datasets/le-prix-des-carburants/',
      organization: { name: 'Min', page_url: null },
      last_update: null,
      preselect_resource_id: null,
      resources: [
        { id: 'd368c882-bb1f-429a-86c1-021e5c01fdf6', title: 'CSV', format: 'csv', filesize: 1024, tabular_available: true, tabular_url: 'https://tabular-api.data.gouv.fr/api/resources/d368c882-bb1f-429a-86c1-021e5c01fdf6/data/' },
        { id: 'jsonres', title: 'JSON', format: 'json', filesize: null, tabular_available: false, tabular_url: null },
      ],
    })

    const wrapper = mountStep()

    await wrapper.get('input[type="search"]').setValue('carburants')
    vi.advanceTimersByTime(400)
    await flushPromises()

    expect(searchDataGouvDatasets).toHaveBeenCalledWith('carburants')

    await wrapper.get('button.text-left').trigger('click')
    await flushPromises()

    const importButtons = wrapper.findAll('button').filter((b) => b.text() === 'Importer')
    expect(importButtons).toHaveLength(1)

    await importButtons[0]!.trigger('click')

    expect(wrapper.emitted('update:datagouvInput')?.at(-1)).toEqual(['d368c882-bb1f-429a-86c1-021e5c01fdf6'])
    expect(wrapper.emitted('update:datagouvName')?.at(-1)).toEqual(['Le prix des carburants'])
  })

  it('résout directement une URL data.gouv.fr collée', async () => {
    fetchDataGouvDataset.mockResolvedValue({
      id: 'abc', slug: 'le-prix-des-carburants', title: 'Le prix des carburants', description: null,
      page_url: '', organization: { name: null, page_url: null }, last_update: null,
      preselect_resource_id: null, resources: [],
    })

    const wrapper = mountStep()
    await wrapper.get('input[type="search"]').setValue('https://www.data.gouv.fr/fr/datasets/le-prix-des-carburants/')
    vi.advanceTimersByTime(400)
    await flushPromises()

    expect(searchDataGouvDatasets).not.toHaveBeenCalled()
    expect(fetchDataGouvDataset).toHaveBeenCalledWith('https://www.data.gouv.fr/fr/datasets/le-prix-des-carburants/')
  })

  it('affiche la ressource sélectionnée quand datagouvInput est rempli', () => {
    const wrapper = mountStep({ datagouvInput: 'd368c882-bb1f-429a-86c1-021e5c01fdf6' })
    expect(wrapper.text()).toContain('d368c882-bb1f-429a-86c1-021e5c01fdf6')
    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
  })
})
