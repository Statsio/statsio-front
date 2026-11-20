<script setup lang="ts">
import { computed } from 'vue'
import { sectorPath } from '@/lib/ds/pie'
import { thumbSeed } from '@/lib/dossiers-listing'
import type { DossierContentType } from '@/types/dossier'

/**
 * Vignette d'un contenu rangé : sa miniature si elle existe, sinon une illustration
 * générée selon son type (mini-graphique pour un StatsData, une illustrée pour un
 * article, camembert pour un sondage). Le dessin est stable pour un même `seed`.
 * Décorative : le titre du contenu est toujours donné à côté.
 */
const props = defineProps<{
  type: DossierContentType
  src?: string | null
  seed: string | number
}>()

const s = computed(() => thumbSeed(props.seed))
/** pseudo-aléatoire déterministe dans [0, 1[ */
const r = (i: number) => {
  const x = Math.sin((s.value * 13 + i) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const bars = computed(() =>
  Array.from({ length: 8 }, (_, i) => {
    const v = 16 + r(i + 5) * 48 + i * 2
    return { x: 14 + i * 17, y: 88 - v, h: v, last: i === 7, opacity: 0.3 + (0.6 * i) / 7 }
  }),
)
const line = computed(() => {
  const pts = Array.from({ length: 9 }, (_, i) => [12 + i * 17, 80 - (r(i + 3) * 26 + i * 3.2)] as const)
  return { points: pts.map((p) => `${p[0]},${p[1].toFixed(1)}`).join(' '), end: pts[8]! }
})

const ARTICLE_COLORS = ['#8b5cf6', '#3b82f6', '#c4b5fd', '#1d4ed8']
const strips = computed(() =>
  Array.from({ length: 5 }, (_, i) => {
    const len = 30 + r(i + 1) * 70
    return { x: 18 + i * 26, y: 30 - len / 2, h: len, fill: ARTICLE_COLORS[(i + s.value) % 4] }
  }),
)

const PIE_COLORS = ['var(--ds-violet-500)', 'var(--ds-blue-500)', 'var(--ds-violet-300)']
const pie = computed(() => {
  const shares = [0.3 + r(1) * 0.25, 0.2 + r(2) * 0.15]
  shares.push(1 - shares[0]! - shares[1]!)
  let a = -90
  return shares.map((v, i) => {
    const a0 = a
    a += 360 * v
    return { d: sectorPath(48, 52, 31, a0, a), fill: PIE_COLORS[i]!, w: 22 + r(i + 6) * 16 }
  })
})
</script>

<template>
  <img v-if="src" :src="src" alt="" loading="lazy" class="dthumb" />
  <svg
    v-else
    viewBox="0 0 160 100"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    class="dthumb"
  >
    <template v-if="type === 'statsdata'">
      <rect width="160" height="100" class="f-surface" />
      <rect x="12" y="11" :width="52 + r(1) * 40" height="6" rx="1" class="f-text" opacity=".75" />
      <rect x="12" y="22" :width="28 + r(2) * 22" height="4" rx="1" class="f-muted" opacity=".5" />
      <template v-if="s % 2">
        <rect
          v-for="b in bars"
          :key="b.x"
          :x="b.x"
          :y="b.y"
          width="13"
          :height="b.h"
          :class="b.last ? 'f-blue' : 'f-violet'"
          :opacity="b.last ? 1 : b.opacity"
        />
      </template>
      <template v-else>
        <polygon :points="`12,88 ${line.points} 148,88`" class="f-violet-200" opacity=".6" />
        <polyline :points="line.points" class="s-line" />
        <circle :cx="line.end[0]" :cy="line.end[1]" r="4.5" class="f-blue s-surface" />
      </template>
      <line x1="12" y1="88.5" x2="148" y2="88.5" class="s-ol" />
    </template>

    <template v-else-if="type === 'article'">
      <rect width="160" height="100" fill="#dbeafe" />
      <g transform="rotate(-45 80 30)">
        <rect v-for="st in strips" :key="st.x" :x="st.x" :y="st.y" width="14" :height="st.h" :fill="st.fill" />
      </g>
      <circle :cx="28 + r(9) * 30" cy="22" r="13" :fill="ARTICLE_COLORS[(s + 1) % 4]" opacity=".85" />
      <rect y="58" width="160" height="42" class="f-surface" />
      <line x1="0" y1="58" x2="160" y2="58" class="s-ol" />
      <rect x="12" y="67" :width="110 + r(4) * 30" height="7" rx="1" class="f-text" opacity=".8" />
      <rect x="12" y="79" :width="70 + r(5) * 40" height="7" rx="1" class="f-text" opacity=".8" />
      <rect x="12" y="91" width="54" height="3.5" rx="1" class="f-muted" opacity=".5" />
    </template>

    <template v-else>
      <rect width="160" height="100" class="f-tint" />
      <path v-for="(p, i) in pie" :key="i" :d="p.d" :style="{ fill: p.fill }" class="s-tint" />
      <circle cx="48" cy="52" r="32" fill="none" class="s-ol" />
      <template v-for="(p, i) in pie" :key="`l${i}`">
        <rect x="94" :y="32 + i * 16" width="8" height="8" :style="{ fill: p.fill }" class="s-ol-thin" />
        <rect x="108" :y="33.5 + i * 16" :width="p.w" height="5" rx="1" class="f-text" opacity=".6" />
      </template>
    </template>
  </svg>
</template>

<style scoped>
.dthumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.f-surface {
  fill: var(--ds-surface);
}
.f-tint {
  fill: var(--ds-tint);
}
.f-text {
  fill: var(--ds-text);
}
.f-muted {
  fill: var(--ds-muted);
}
.f-violet {
  fill: var(--ds-violet-500);
}
.f-violet-200 {
  fill: var(--ds-violet-200);
}
.f-blue {
  fill: var(--ds-blue-500);
}
.s-line {
  fill: none;
  stroke: var(--ds-violet-500);
  stroke-width: 2.5;
  stroke-linejoin: round;
}
.s-surface {
  stroke: var(--ds-surface);
  stroke-width: 2;
}
.s-tint {
  stroke: var(--ds-tint);
  stroke-width: 2;
}
.s-ol {
  stroke: var(--ds-ol);
  stroke-width: 1.5;
}
.s-ol-thin {
  stroke: var(--ds-ol);
  stroke-width: 1;
}
</style>
