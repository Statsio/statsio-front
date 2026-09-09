/**
 * Fonds de carte (« calques ») proposés dans le Studio pour le bloc Carte.
 * Tous en tuiles raster publiques sans clé : CARTO (basemaps), Esri, OpenTopoMap.
 * Les styles vecteur CARTO (`*-gl-style/style.json`) ne sont plus utilisés — leur
 * serveur de tuiles vecteur renvoyait des 4xx (seuls l'aérien et le relief, déjà
 * en raster, s'affichaient).
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

/** Tuiles raster CARTO (sans clé), déclinées sur les sous-domaines a–d. */
const carto = (variant: string) =>
  rasterStyle(
    ['a', 'b', 'c', 'd'].map((s) => `https://${s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`),
    '© CARTO, © OpenStreetMap contributors',
  )

/** Objet de style raster prêt pour `new maplibregl.Map({ style })`. */
export function basemapStyle(id: BasemapId | undefined | null): string | StyleSpecification {
  switch (id) {
    case 'plan':
      return carto('light_all')
    case 'sombre':
      return carto('dark_all')
    case 'couleur':
      return carto('rastertiles/voyager')
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
      return carto('light_nolabels')
  }
}
