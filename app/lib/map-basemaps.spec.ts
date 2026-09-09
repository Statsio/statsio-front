import { describe, it, expect } from 'vitest'
import { BASEMAPS, basemapStyle } from './map-basemaps'

describe('map-basemaps', () => {
  it('expose 6 fonds de carte', () => {
    expect(BASEMAPS.map((b) => b.id)).toEqual(['clair', 'plan', 'sombre', 'couleur', 'aerien', 'relief'])
  })

  it('renvoie une URL de style vecteur pour les fonds CARTO', () => {
    expect(basemapStyle('clair')).toMatch(/positron-nolabels/)
    expect(basemapStyle(undefined)).toMatch(/positron-nolabels/)
    expect(basemapStyle('plan')).toMatch(/positron-gl-style/)
    expect(basemapStyle('sombre')).toMatch(/dark-matter/)
    expect(basemapStyle('couleur')).toMatch(/voyager/)
  })

  it('renvoie un style raster pour aérien et relief', () => {
    const aerien = basemapStyle('aerien')
    expect(typeof aerien).toBe('object')
    expect(JSON.stringify(aerien)).toMatch(/World_Imagery/)

    const relief = basemapStyle('relief')
    expect(JSON.stringify(relief)).toMatch(/opentopomap/)
  })
})
