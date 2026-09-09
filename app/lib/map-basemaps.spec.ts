import { describe, it, expect } from 'vitest'
import { BASEMAPS, basemapStyle } from './map-basemaps'

describe('map-basemaps', () => {
  it('expose 6 fonds de carte', () => {
    expect(BASEMAPS.map((b) => b.id)).toEqual(['clair', 'plan', 'sombre', 'couleur', 'aerien', 'relief'])
  })

  it('renvoie un style raster Esri (sans clé) pour clair / plan / sombre / couleur', () => {
    expect(JSON.stringify(basemapStyle('clair'))).toMatch(/World_Light_Gray_Base/)
    expect(JSON.stringify(basemapStyle(undefined))).toMatch(/World_Light_Gray_Base/)
    expect(JSON.stringify(basemapStyle('plan'))).toMatch(/World_Street_Map/)
    expect(JSON.stringify(basemapStyle('sombre'))).toMatch(/World_Dark_Gray_Base/)
    expect(JSON.stringify(basemapStyle('couleur'))).toMatch(/World_Topo_Map/)
  })

  it('n\'utilise plus aucune tuile nécessitant une clé (CARTO)', () => {
    for (const id of ['clair', 'plan', 'sombre', 'couleur', 'aerien', 'relief'] as const) {
      expect(JSON.stringify(basemapStyle(id))).not.toMatch(/cartocdn|api_key|apikey|access_token/i)
    }
  })

  it('renvoie un style raster pour aérien et relief', () => {
    const aerien = basemapStyle('aerien')
    expect(typeof aerien).toBe('object')
    expect(JSON.stringify(aerien)).toMatch(/World_Imagery/)

    const relief = basemapStyle('relief')
    expect(JSON.stringify(relief)).toMatch(/opentopomap/)
  })
})
