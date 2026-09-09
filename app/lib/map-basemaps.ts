/**
 * Fonds de carte (« calques ») proposés dans le Studio pour le bloc Carte.
 * Vecteur = styles CARTO (sans clé) ; raster = tuiles publiques (Esri, OpenTopoMap).
 */
import type { StyleSpecification } from 'maplibre-gl'

export type BasemapId = 'clair' | 'plan' | 'sombre' | 'couleur' | 'aerien' | 'relief'

export const DEFAULT_BASEMAP: BasemapId = 'clair'

export const BASEMAPS: { id: BasemapId; label: string; hint: string }[] = [
  { id: 'clair', label: 'Clair', hint: 'Fond épuré sans étiquettes' },
  { id: 'plan', label: 'Plan', hint: 'Fond clair avec rues et noms' },
  { id: 'sombre', label: 'Sombre', hint: 'Fond foncé' },
  { id: 'couleur', label: 'Couleur', hint: 'Fond détaillé type atlas' },
  { id: 'aerien', label: 'Aérien', hint: 'Imagerie satellite' },
  { id: 'relief', label: 'Relief', hint: 'Topographie et courbes de niveau' },
]

const rasterStyle = (tiles: string[], attribution: string): StyleSpecification => ({
  version: 8,
  sources: { base: { type: 'raster', tiles, tileSize: 256, attribution } },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
})

/** URL de style vecteur ou objet de style raster prêt pour `new maplibregl.Map({ style })`. */
export function basemapStyle(id: BasemapId | undefined | null): string | StyleSpecification {
  switch (id) {
    case 'plan':
      return 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
    case 'sombre':
      return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    case 'couleur':
      return 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    case 'aerien':
      return rasterStyle(
        ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        '© Esri, Maxar, Earthstar Geographics',
      )
    case 'relief':
      return rasterStyle(
        [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
        ],
        '© OpenTopoMap (CC-BY-SA)',
      )
    case 'clair':
    default:
      return 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json'
  }
}
