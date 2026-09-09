import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MapBlock from './MapBlock.vue'
import AppWorldScatterMap from '@/components/ui/AppWorldScatterMap.vue'
import { fetchBlockData } from '@/api/studio'
import type { StudioBlock } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  fetchPublicBlockData: vi.fn<(...a: unknown[]) => Promise<unknown>>().mockResolvedValue({ columns: [], rows: [], totalRows: 0 }),
}))

function mapBlock(over: Partial<StudioBlock> = {}): StudioBlock {
  return {
    id: 'm1', type: 'map', zoneId: 'z', datasetId: '7',
    sources: [{ id: '7', datasetId: '7' }], primarySourceId: '7',
    fieldMapping: { latColumn: 'latitude', lngColumn: 'longitude' },
    config: {},
    ...over,
  }
}

const stubs = { AppWorldScatterMap: true }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(fetchBlockData).mockReset()
})

describe('MapBlock', () => {
  it('affiche un placeholder tant que les colonnes lat / lon ne sont pas mappées', async () => {
    const w = mount(MapBlock, { props: { block: mapBlock({ fieldMapping: {} }) }, global: { stubs } })
    await flushPromises()
    expect(w.text()).toContain('Configurer la source')
    expect(fetchBlockData).not.toHaveBeenCalled()
  })

  it('construit un point par ligne et écarte les lignes sans coordonnées valides', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue({
      columns: ['latitude', 'longitude', 'enseigne', 'prix'],
      rows: [
        { latitude: 45.75, longitude: 4.85, enseigne: 'Alpha', prix: 1.8 },
        { latitude: null, longitude: 4.85, enseigne: 'Sans GPS', prix: 1.9 },
      ],
      columnMap: {},
      totalRows: 2,
    })

    const w = mount(MapBlock, {
      props: {
        block: mapBlock({
          fieldMapping: {
            latColumn: 'latitude', lngColumn: 'longitude', mapTitleColumn: 'enseigne',
            columns: ['prix'], columnLabels: { prix: 'Prix' },
          },
          config: { mapMarkerColor: '#ef4444' },
        }),
      },
      global: { stubs },
    })
    await flushPromises()

    const map = w.findComponent(AppWorldScatterMap)
    const points = map.props('points') as unknown as Array<Record<string, unknown>>
    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({ lat: 45.75, lon: 4.85, fill: '#ef4444', label: 'Alpha' })
    expect(points[0]!.popupHtml).toContain('Alpha')
    expect(points[0]!.popupHtml).toContain('Prix : ')
  })

  it('échappe le HTML des valeurs dans la fiche de survol', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue({
      columns: ['latitude', 'longitude', 'enseigne'],
      rows: [{ latitude: 1, longitude: 2, enseigne: '<img src=x onerror=alert(1)>' }],
      columnMap: {},
      totalRows: 1,
    })

    const w = mount(MapBlock, {
      props: { block: mapBlock({ fieldMapping: { latColumn: 'latitude', lngColumn: 'longitude', mapTitleColumn: 'enseigne' } }) },
      global: { stubs },
    })
    await flushPromises()

    const points = w.findComponent(AppWorldScatterMap).props('points') as unknown as Array<Record<string, unknown>>
    expect(points[0]!.popupHtml).not.toContain('<img')
    expect(points[0]!.popupHtml).toContain('&lt;img')
  })

  it('lit les coordonnées depuis une colonne unique (geo_point_2d)', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue({
      columns: ['geo_point_2d', 'nom'],
      rows: [
        { geo_point_2d: '48.8566, 2.3522', nom: 'Paris' },
        { geo_point_2d: 'POINT(4.85 45.75)', nom: 'Lyon' },
        { geo_point_2d: 'n/a', nom: 'Inconnu' },
      ],
      columnMap: {},
      totalRows: 3,
    })

    const w = mount(MapBlock, {
      props: { block: mapBlock({ fieldMapping: { mapPointColumn: 'geo_point_2d', mapTitleColumn: 'nom' } }) },
      global: { stubs },
    })
    await flushPromises()

    const points = w.findComponent(AppWorldScatterMap).props('points') as unknown as Array<Record<string, number>>
    expect(points).toHaveLength(2)
    expect(points[0]).toMatchObject({ lat: 48.8566, lon: 2.3522 })
    expect(points[1]).toMatchObject({ lat: 45.75, lon: 4.85 })
  })

  it('transmet le fond de carte choisi à AppWorldScatterMap', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue({
      columns: ['latitude', 'longitude'], rows: [{ latitude: 1, longitude: 2 }], columnMap: {}, totalRows: 1,
    })
    const w = mount(MapBlock, {
      props: { block: mapBlock({ config: { mapBasemap: 'aerien' } }) },
      global: { stubs },
    })
    await flushPromises()
    const style = w.findComponent(AppWorldScatterMap).props('mapStyle')
    expect(JSON.stringify(style)).toMatch(/World_Imagery/)
  })

  it('colore les points par valeur distincte quand mapColorColumn est défini', async () => {
    vi.mocked(fetchBlockData).mockResolvedValue({
      columns: ['latitude', 'longitude', 'marque'],
      rows: [
        { latitude: 1, longitude: 1, marque: 'A' },
        { latitude: 2, longitude: 2, marque: 'B' },
        { latitude: 3, longitude: 3, marque: 'A' },
      ],
      columnMap: {},
      totalRows: 3,
    })

    const w = mount(MapBlock, {
      props: { block: mapBlock({ fieldMapping: { latColumn: 'latitude', lngColumn: 'longitude', mapColorColumn: 'marque' } }) },
      global: { stubs },
    })
    await flushPromises()

    const points = w.findComponent(AppWorldScatterMap).props('points') as Array<{ fill: string }>
    expect(points[0]!.fill).toBe(points[2]!.fill)
    expect(points[0]!.fill).not.toBe(points[1]!.fill)
  })
})
