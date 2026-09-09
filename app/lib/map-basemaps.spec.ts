import { describe, it, expect } from 'vitest'
import { BASEMAPS, basemapStyle } from './map-basemaps'

describe('map-basemaps', () => {
  it('expose 6 fonds de carte', () => {
    expect(BASEMAPS.map((b) => b.id)).toEqual(['clair', 'plan', 'sombre', 'couleur', 'aerien', 'relief'])
  })

  it('renvoie un style raster CARTO pour les fonds clair / plan / sombre / couleur', () => {
    expect(JSON.stringify(basemapStyle('clair'))).toMatch(/light_nolabels/)
    expect(JSON.stringify(basemapStyle(undefined))).toMatch(/light_nolabels/)
    expect(JSON.stringify(basemapStyle('plan'))).toMatch(/light_all/)
    expect(JSON.stringify(basemapStyle('sombre'))).toMatch(/dark_all/)
    expect(JSON.stringify(basemapStyle('couleur'))).toMatch(/voyager/)
  })

  it('renvoie un style raster pour aérien et relief', () => {
    const aerien = basemapStyle('aerien')
    expect(typeof aerien).toBe('object')
    expect(JSON.stringify(aerien)).toMatch(/World_Imagery/)

    const relief = basemapStyle('relief')
    expect(JSON.stringify(relief)).toMatch(/opentopomap/)
  })
})
