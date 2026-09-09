import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups }
})
vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import MapBlockInspector from './MapBlockInspector.vue'
import { useStudioStore } from '@/stores/studio'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { StudioBlock } from '@/types/studio'

function seed(withSource = true): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock('map', `${section.id}-0`)
  if (withSource) Object.assign(block, { datasetId: 'ds1', sources: [{ id: 'ds1', datasetId: 'ds1' }], primarySourceId: 'ds1' })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'ville' }, { name: 'prix' }] }]
})

describe('MapBlockInspector', () => {
  it('invite à choisir une source quand aucune n\'est connectée', () => {
    const block = seed(false)
    const w = mount(MapBlockInspector, { props: { block, activeTab: 'data' } })
    expect(w.text()).toContain('Choisissez une source de données')
  })

  it('mappe la colonne latitude via le drill-in', async () => {
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(MapBlockInspector, { props: { block, activeTab: 'data' } })

    const latRow = w.findAllComponents({ name: 'AxisFieldRow' }).find((c) => c.props('label') === 'Latitude')
    await latRow!.find('button').trigger('click')

    const drill = useColumnDrillIn()
    drill.pickColumn('latitude')
    expect(spy).toHaveBeenCalledWith(block.id, { latColumn: 'latitude' })
  })

  it('monte le champ de filtres sur l\'onglet Filtres', () => {
    const block = seed()
    const w = mount(MapBlockInspector, { props: { block, activeTab: 'filters' } })
    expect(w.findComponent({ name: 'BlockFiltersField' }).exists()).toBe(true)
  })

  it('auto-détecte les colonnes latitude / longitude sur connexion de la source', () => {
    groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'latitude' }, { name: 'longitude' }, { name: 'nom' }] }]
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    mount(MapBlockInspector, { props: { block, activeTab: 'data' } })
    expect(spy).toHaveBeenCalledWith(block.id, { latColumn: 'latitude', lngColumn: 'longitude' })
  })

  it('auto-détecte une colonne unique de coordonnées (geo_point_2d)', () => {
    groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'geo_point_2d' }, { name: 'nom' }] }]
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    mount(MapBlockInspector, { props: { block, activeTab: 'data' } })
    expect(spy).toHaveBeenCalledWith(block.id, { mapPointColumn: 'geo_point_2d' })
  })

  it('écrit config.mapBasemap au clic sur un fond de carte', async () => {
    const block = seed()
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockConfig')
    const w = mount(MapBlockInspector, { props: { block, activeTab: 'style' } })

    await w.findAll('button').find((b) => b.text().trim() === 'Aérien')!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, { mapBasemap: 'aerien' })
  })

  it('bascule en mode « une colonne » et efface latColumn / lngColumn', async () => {
    const block = seed()
    Object.assign(block.fieldMapping, { latColumn: 'lat', lngColumn: 'lng' })
    const store = useStudioStore()
    const spy = vi.spyOn(store, 'updateBlockFieldMapping')
    const w = mount(MapBlockInspector, { props: { block, activeTab: 'data' } })

    await w.findAll('button').find((b) => b.text().trim() === 'Une colonne')!.trigger('click')
    expect(spy).toHaveBeenCalledWith(block.id, { latColumn: undefined, lngColumn: undefined })
  })
})
