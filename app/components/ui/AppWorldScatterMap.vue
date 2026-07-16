<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MaplibreMap, Marker as MaplibreMarker } from 'maplibre-gl'

export interface WorldScatterPoint {
  lat: number
  lon: number
  r?: number
  fill: string
  stroke?: string
  label?: string
  onClick?: () => void
}

const props = withDefaults(
  defineProps<{
    points: WorldScatterPoint[]
    height?: number
  }>(),
  {
    height: 300,
  },
)

const mapContainer = ref<HTMLDivElement | null>(null)

let MarkerCtor: typeof MaplibreMarker | null = null
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
    if (p.label) el.title = p.label

    const marker = new MarkerCtor({ element: el }).setLngLat([p.lon, p.lat]).addTo(map)
    markers.push(marker)
  }
}

onMounted(async () => {
  const { Map, NavigationControl, AttributionControl, Marker } = await import('maplibre-gl')
  MarkerCtor = Marker
  if (!mapContainer.value) return

  map = new Map({
    container: mapContainer.value,
    style: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
    center: [10, 20],
    zoom: 1.1,
    attributionControl: false,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
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
