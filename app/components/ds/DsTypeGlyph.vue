<script setup lang="ts">
import { computed } from 'vue'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import { sectorPath } from '@/lib/ds/pie'
import type { DsGlyphKind } from '@/lib/ds/types'

/**
 * Pictogrammes de type.
 * StatsData / Article / Sondage = mêmes icônes que la nav du header (AppNavIcon,
 * couleurs de la marque). Dossier = quart · Chaîne = trois quarts · data = flèche
 * de mise à jour, découpés dans le disque du logo (couleur = `currentColor`).
 *
 * `mono` : les icônes de la nav passent en `currentColor` (nuances par opacité)
 * pour ressortir sur un fond coloré/foncé. Automatique dans une pastille ou un
 * segment actif (fond `--ds-action`) et en mode sombre.
 */
const props = withDefaults(defineProps<{ kind: DsGlyphKind; size?: number; mono?: boolean }>(), {
  size: 14,
  mono: false,
})

const NAV_ICON = { statsdata: 'stats', article: 'articles', sondage: 'polls' } as const
const navIcon = computed(() =>
  props.kind in NAV_ICON ? NAV_ICON[props.kind as keyof typeof NAV_ICON] : null,
)

type Shape = { d: string; opacity?: number; stroke?: boolean }

const shapes = computed<Shape[]>(() => {
  switch (props.kind) {
    case 'dossier':
      return [
        { d: sectorPath(12, 12, 10.5, -90, 0) },
        { d: sectorPath(12, 12, 10.5, 0, 270), opacity: 0.2 },
      ]
    case 'chaine':
      return [
        { d: sectorPath(12, 12, 10.5, 0, 270) },
        { d: sectorPath(12, 12, 10.5, -90, 0), opacity: 0.2 },
      ]
    case 'data':
      return [
        { d: 'M4 12 A8 8 0 1 1 7 18.2', stroke: true },
        { d: 'M3.5 19 L7 18.2 L6.5 14.6', stroke: true },
      ]
    default:
      return []
  }
})
</script>

<template>
  <AppNavIcon
    v-if="navIcon"
    :kind="navIcon"
    :class="mono ? 'ds-glyph ds-glyph--mono' : 'ds-glyph'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
  <svg v-else viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true" class="ds-glyph">
    <path
      v-for="(s, i) in shapes"
      :key="i"
      :d="s.d"
      :fill="s.stroke ? 'none' : 'currentColor'"
      :stroke="s.stroke ? 'currentColor' : undefined"
      :stroke-width="s.stroke ? 2.2 : undefined"
      stroke-linecap="round"
      :opacity="s.opacity"
    />
  </svg>
</template>

<style scoped>
.ds-glyph {
  flex: none;
  display: inline-block;
}
</style>

<style>
/* Variante monochrome des icônes de la nav (non scopée : déclenchée par l'ancêtre). */
.ds-glyph--mono .fill-primary,
.ds-seg__btn[aria-pressed='true'] .ds-glyph .fill-primary,
.ds-chip.is-on:not(.ds-chip--scope) .ds-glyph .fill-primary,
:root[data-color-scheme='dark'] .ds-glyph .fill-primary {
  fill: currentColor;
}
.ds-glyph--mono .fill-accent,
.ds-seg__btn[aria-pressed='true'] .ds-glyph .fill-accent,
.ds-chip.is-on:not(.ds-chip--scope) .ds-glyph .fill-accent,
:root[data-color-scheme='dark'] .ds-glyph .fill-accent {
  fill: currentColor;
  opacity: 0.7;
}
.ds-glyph--mono .fill-secondary,
.ds-seg__btn[aria-pressed='true'] .ds-glyph .fill-secondary,
.ds-chip.is-on:not(.ds-chip--scope) .ds-glyph .fill-secondary,
:root[data-color-scheme='dark'] .ds-glyph .fill-secondary {
  fill: currentColor;
  opacity: 0.42;
}
.ds-glyph--mono .stroke-accent,
.ds-seg__btn[aria-pressed='true'] .ds-glyph .stroke-accent,
.ds-chip.is-on:not(.ds-chip--scope) .ds-glyph .stroke-accent,
:root[data-color-scheme='dark'] .ds-glyph .stroke-accent {
  stroke: currentColor;
}
</style>
