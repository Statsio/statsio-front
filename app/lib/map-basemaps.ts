/**
 * Fonds de carte (« calques ») proposés dans le Studio pour le bloc Carte.
 * Tous en tuiles raster publiques **sans clé** : Esri ArcGIS Online (basemaps
 * gratuits) + OpenTopoMap pour le relief.
 *
 * Historique : les styles vecteur CARTO (`*-gl-style/style.json`) ne rendaient plus
 * leurs tuiles (4xx), puis les tuiles raster CARTO (`basemaps.cartocdn.com`) ont
 * exigé une clé API → on est passé entièrement sur Esri, qui servait déjà l'aérien
 * sans souci.
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

const ESRI_ATTR = '© Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors'

/** Tuile raster d'un service ArcGIS Online public (sans clé). Ordre Esri : {z}/{y}/{x}. */
const esri = (service: string, attribution = ESRI_ATTR) =>
  rasterStyle(
    [`https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`],
    attribution,
  )

/** Objet de style raster prêt pour `new maplibregl.Map({ style })`. */
export function basemapStyle(id: BasemapId | undefined | null): string | StyleSpecification {
  switch (id) {
    case 'plan':
      return esri('World_Street_Map')
    case 'sombre':
      return esri('Canvas/World_Dark_Gray_Base', '© Esri, HERE, Garmin, © OpenStreetMap contributors')
    case 'couleur':
      return esri('World_Topo_Map')
    case 'aerien':
      return esri('World_Imagery', '© Esri, Maxar, Earthstar Geographics')
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
      return esri('Canvas/World_Light_Gray_Base', '© Esri, HERE, Garmin, © OpenStreetMap contributors')
  }
}
