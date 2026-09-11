<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import type {
  Map as MaplibreMap,
  Marker as MaplibreMarker,
  Popup as MaplibrePopup,
  LngLatBounds as MaplibreLngLatBounds,
  StyleSpecification,
} from 'maplibre-gl'

import { basemapStyle } from '@/lib/map-basemaps'

export interface WorldScatterPoint {
  lat: number
  lon: number
  r?: number
  fill: string
  stroke?: string
  label?: string
  /** Contenu HTML (déjà échappé par l'appelant) d'une infobulle affichée au survol. */
  popupHtml?: string
  onClick?: () => void
}

const props = withDefaults(
  defineProps<{
    points: WorldScatterPoint[]
    height?: number
    /** Ajuste le cadrage pour englober tous les points à chaque rendu. */
    fitBounds?: boolean
    /** Fond de carte : URL de style vecteur ou objet de style raster. */
    mapStyle?: string | StyleSpecification
  }>(),
  {
    height: 300,
    fitBounds: false,
    // Fond par défaut : CARTO clair en tuiles raster (le style vecteur CARTO ne charge plus).
    mapStyle: () => basemapStyle('clair'),
  },
)

const mapContainer = ref<HTMLDivElement | null>(null)

let MarkerCtor: typeof MaplibreMarker | null = null
let PopupCtor: typeof MaplibrePopup | null = null
let LngLatBoundsCtor: typeof MaplibreLngLatBounds | null = null
let map: MaplibreMap | null = null
let markers: MaplibreMarker[] = []

function renderMarkers() {
  if (!map || !MarkerCtor) return
  markers.forEach((m) => m.remove())
  markers = []

  for (const p of props.points) {
    const el = document.createElement('div')
    const size = (p.r ?? 6) * 2
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.borderRadius = '50%'
    el.style.background = p.fill
    el.style.border = p.stroke ? `1.5px solid ${p.stroke}` : 'none'
    el.style.boxSizing = 'border-box'
    if (p.onClick) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', p.onClick)
    }
    // Infobulle native seulement en l'absence de fiche riche (sinon les deux se superposent).
    if (p.label && !p.popupHtml) el.title = p.label

    const marker = new MarkerCtor({ element: el }).setLngLat([p.lon, p.lat]).addTo(map)

    if (p.popupHtml && PopupCtor) {
      const popup = new PopupCtor({
        offset: 14,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '280px',
      }).setHTML(p.popupHtml)
      el.style.cursor = el.style.cursor || 'pointer'
      el.addEventListener('mouseenter', () => marker.setPopup(popup).togglePopup())
      el.addEventListener('mouseleave', () => { if (popup.isOpen()) popup.remove() })
    }

    markers.push(marker)
  }

  if (props.fitBounds && props.points.length && LngLatBoundsCtor) {
    const bounds = new LngLatBoundsCtor()
    props.points.forEach((p) => bounds.extend([p.lon, p.lat]))
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 })
  }
}

onMounted(async () => {
  const { Map, NavigationControl, AttributionControl, GeolocateControl, Marker, Popup, LngLatBounds } =
    await import('maplibre-gl')
  MarkerCtor = Marker
  PopupCtor = Popup
  LngLatBoundsCtor = LngLatBounds
  if (!mapContainer.value) return

  map = new Map({
    container: mapContainer.value,
    style: props.mapStyle,
    center: [10, 20],
    zoom: 1.1,
    attributionControl: false,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(
    new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
    'top-right',
  )
  map.addControl(new AttributionControl({ compact: true }))
  map.on('load', renderMarkers)
})

watch(
  () => props.points,
  () => {
    if (map?.loaded()) renderMarkers()
  },
  { deep: true },
)

// Changement de fond de carte : les marqueurs DOM survivent à setStyle, on relance
// juste le rendu (relief / aérien n'ont pas d'event `styledata` fiable au 1er tick).
watch(
  () => props.mapStyle,
  (style) => {
    if (!map) return
    map.setStyle(style)
    map.once('styledata', renderMarkers)
  },
)

onBeforeUnmount(() => {
  markers.forEach((m) => m.remove())
  markers = []
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="mapContainer" class="overflow-hidden rounded-[10px]" :style="{ height: `${height}px` }" />
</template>
