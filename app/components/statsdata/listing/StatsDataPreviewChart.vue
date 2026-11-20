<script setup lang="ts">
import { computed } from 'vue'
import DsPie from '@/components/ds/DsPie.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import {
  buildPreviewChart,
  formatPreviewValue,
  previewHeadline,
  SERIES_COLORS,
} from '@/lib/statsdata-listing'
import type { CardPreview } from '@/types/catalog'

/**
 * Graphique d'aperçu d'un StatsData, charte « Tranches » : chiffre clé + titre du
 * bloc, puis le graphique réel (barres, classement, courbes ou camembert) tracé
 * en SVG avec les tokens de la charte. `size="lg"` pour la carte « À la une ».
 */
const props = withDefaults(defineProps<{ preview: CardPreview; size?: 'md' | 'lg' }>(), {
  size: 'md',
})

const box = computed(() => ({ width: 320, height: props.size === 'lg' ? 190 : 150 }))
const model = computed(() => buildPreviewChart(props.preview, box.value))
const headline = computed(() => previewHeadline(props.preview))
const ariaLabel = computed(
  () =>
    [props.preview.title, headline.value?.value].filter(Boolean).join(' : ') ||
    'Aperçu du graphique',
)

const PIE_MAX = 5
const pie = computed(() => {
  if (props.preview.kind !== 'pie') return []
  const labels = props.preview.labels ?? []
  const values = props.preview.series?.[0]?.values ?? []
  const colors = ['var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t3)', 'var(--ds-t4)', 'var(--ds-t5)']
  return labels
    .slice(0, PIE_MAX)
    .map((label, i) => ({ label, value: Math.abs(values[i] ?? 0), color: colors[i]! }))
})
const legend = computed(() =>
  (props.preview.series ?? []).length > 1 && props.preview.kind !== 'pie'
    ? props.preview
        .series!.slice(0, SERIES_COLORS.length)
        .map((s, i) => ({ name: s.name, color: SERIES_COLORS[i]! }))
    : [],
)
</script>

<template>
  <div class="sdchart" :class="`sdchart--${size}`">
    <div v-if="headline" class="sdchart__kp">
      <b class="ds-tnum">{{ headline.value }}</b>
      <span v-if="headline.label">{{ headline.label }}</span>
    </div>

    <div v-if="preview.kind === 'pie'" class="sdchart__pie" role="img" :aria-label="ariaLabel">
      <DsPie
        :segments="pie"
        :size="size === 'lg' ? 120 : 96"
        animate="mount"
        label=""
        aria-hidden="true"
      />
      <ul>
        <li v-for="s in pie" :key="s.label">
          <DsSwatch :color="s.color" :size="10" />
          <span>{{ s.label }}</span>
          <b class="ds-tnum">{{ formatPreviewValue(s.value) }}</b>
        </li>
      </ul>
    </div>

    <svg
      v-else-if="model"
      :viewBox="`0 0 ${box.width} ${box.height}`"
      role="img"
      :aria-label="ariaLabel"
    >
      <template v-if="model.kind !== 'hbars'">
        <line
          v-for="g in model.grid"
          :key="g.y"
          class="sdchart__grid"
          :x1="g.x1"
          :x2="g.x2"
          :y1="g.y"
          :y2="g.y"
        />
      </template>

      <template v-if="model.kind === 'bars'">
        <rect
          v-for="(b, i) in model.bars"
          :key="i"
          class="sdchart__bar"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          :style="{ fill: b.color }"
        />
        <text v-if="model.value" class="sdchart__txt" :x="model.value.x" :y="model.value.y">
          {{ model.value.text }}
        </text>
      </template>

      <template v-else-if="model.kind === 'hbars'">
        <g v-for="(row, i) in model.rows" :key="i">
          <text class="sdchart__txt" :x="row.label.x" :y="row.label.y">{{ row.label.text }}</text>
          <rect
            class="sdchart__bar"
            :x="row.bar.x"
            :y="row.bar.y"
            :width="row.bar.w"
            :height="row.bar.h"
            :style="{ fill: row.bar.color }"
          />
          <text class="sdchart__txt" :x="row.value.x" :y="row.value.y">{{ row.value.text }}</text>
        </g>
      </template>

      <template v-else>
        <path class="sdchart__area" :d="model.area" />
        <g v-for="(line, i) in [...model.lines].reverse()" :key="i">
          <polyline class="sdchart__line" :points="line.points" :style="{ stroke: line.color }" />
          <circle
            class="sdchart__dot"
            :cx="line.end.x"
            :cy="line.end.y"
            r="4"
            :style="{ fill: line.color }"
          />
          <text class="sdchart__txt" :x="line.value.x" :y="line.value.y">
            {{ line.value.text }}
          </text>
        </g>
      </template>

      <template v-if="model.kind !== 'hbars'">
        <text
          v-for="a in model.axis"
          :key="a.anchor ?? 'start'"
          class="sdchart__txt"
          :x="a.x"
          :y="a.y"
          :text-anchor="a.anchor ?? 'start'"
        >
          {{ a.text }}
        </text>
      </template>
    </svg>

    <p v-if="legend.length" class="sdchart__legend" aria-hidden="true">
      <span v-for="s in legend" :key="s.name"
        ><DsSwatch :color="s.color" :size="9" />{{ s.name }}</span
      >
    </p>
  </div>
</template>

<style scoped>
.sdchart {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sdchart svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.sdchart__kp {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sdchart__kp b {
  overflow: hidden;
  color: var(--ds-accent);
  font: 800 26px/1 var(--ds-display);
  font-stretch: 110%;
  letter-spacing: -0.02em;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sdchart--lg .sdchart__kp b {
  font-size: clamp(40px, 5vw, 64px);
}
.sdchart__kp span {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ds-muted);
  font: 500 10.5px/1.25 var(--ds-num);
  letter-spacing: 0.06em;
  text-align: right;
  text-transform: uppercase;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.sdchart--lg .sdchart__kp span {
  max-width: 22ch;
  font-size: 12px;
}
.sdchart__grid {
  stroke: var(--ds-divide);
  stroke-width: 1;
}
.sdchart__bar {
  stroke: var(--ds-ol);
  stroke-width: 1.5;
}
.sdchart__area {
  fill: var(--ds-t3);
  opacity: 0.22;
}
.sdchart__line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.sdchart__dot {
  stroke: var(--ds-surface);
  stroke-width: 2;
}
.sdchart__txt {
  fill: var(--ds-muted);
  font: 500 10px var(--ds-num);
}
.sdchart--lg .sdchart__txt {
  font-size: 11px;
}
.sdchart__pie {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding-block: 6px;
}
.sdchart__pie ul {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sdchart__pie li {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 13px;
}
.sdchart__pie li:last-child {
  border-bottom: 0;
}
.sdchart__pie li span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sdchart__pie li b {
  font: 500 12px var(--ds-num);
}
.sdchart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 2px 0 0;
  color: var(--ds-muted);
  font-size: 11.5px;
}
.sdchart__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
