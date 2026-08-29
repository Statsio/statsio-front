<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { interpolateTokens } from '@/lib/studio-tokens'
import type { StudioBlock } from '@/types/studio'

/**
 * Point GPS unique. Rendu = vignette stylisée + coordonnées + lien « ouvrir dans
 * une carte » (OpenStreetMap, sans clé). lat/lon supportent les `{{jetons}}`.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const tk = (s?: string) => interpolateTokens(s ?? '', { ...studio.pageParams, ...props.scope })

const lat = computed(() => Number(tk(props.block.config.mapLat).replace(',', '.')))
const lng = computed(() => Number(tk(props.block.config.mapLng).replace(',', '.')))
const label = computed(() => tk(props.block.config.mapLabel))
const ok = computed(() => Number.isFinite(lat.value) && Number.isFinite(lng.value))

const coords = computed(() => `${lat.value.toFixed(5)}, ${lng.value.toFixed(5)}`)
const osmUrl = computed(() => `https://www.openstreetmap.org/?mlat=${lat.value}&mlon=${lng.value}#map=15/${lat.value}/${lng.value}`)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[var(--studio-line)]">
    <div
      class="relative flex h-[190px] items-center justify-center"
      style="background: repeating-linear-gradient(135deg, #f4f3f8 0 10px, #eceaf4 10px 20px)"
    >
      <template v-if="ok">
        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
        </span>
      </template>
      <span v-else class="mono text-[11px] text-[var(--studio-faint)]">Renseigner latitude / longitude →</span>
    </div>
    <div v-if="ok" class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
      <span class="mono text-[var(--studio-muted)]">{{ label ? label + ' · ' : '' }}{{ coords }}</span>
      <a :href="osmUrl" target="_blank" rel="noopener" class="font-semibold text-[var(--color-primary)] hover:underline">Ouvrir la carte →</a>
    </div>
  </div>
</template>
