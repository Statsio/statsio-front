<script setup lang="ts">
import { computed } from 'vue'
import type { CardPreview } from '@/types/catalog'
import { getStatsDataPalette } from '@/utils/statsDataVisuals'
import StatsDataMiniChart from '@/components/content/StatsDataMiniChart.vue'

/**
 * Rendu pur d'un `CardPreview` (mini-graphe réel d'une carte Statsdata). Partagé
 * par `StatsDataCardChart` (carte de catalogue) et la carte de réglage
 * « Visuel de la carte ».
 *
 * Les graphes `line` / `bar` sont tracés par `StatsDataMiniChart` (Chart.js, comme
 * les blocs du Studio). Le `pie` garde un rendu `conic-gradient`, identique au
 * `PieChartBlock` du Studio.
 */
const props = defineProps<{ preview: CardPreview; categories?: string[]; label?: string }>()

const palette = computed(() => getStatsDataPalette(props.categories))
const series = computed(() => props.preview.series ?? [])
const labels = computed(() => props.preview.labels ?? [])
const unit = computed(() => props.preview.unit ?? '')
const singleSeries = computed(() => series.value.length === 1)

// Titre = libellé explicite éventuel, sinon le vrai titre du bloc Studio
// (`preview.title` = `config.title`). Si le bloc n'a pas de titre, on n'affiche
// rien (pas de repli « Valeur » / nom de série générique).
const headerLabel = computed(() => props.label || props.preview.title || '')

// Remonte StatsDataMiniChart quand le type de graphe change (useChart fige le type).
const chartKey = computed(() => `${props.preview.kind ?? 'line'}|${props.preview.orientation ?? ''}|${series.value.length}`)

const pieSlices = computed(() => {
  const values = series.value[0]?.values ?? []
  const total = values.reduce((a, b) => a + Math.abs(b), 0) || 1
  let acc = 0
  return labels.value.map((label, i) => {
    const value = Math.abs(values[i] ?? 0)
    const from = (acc / total) * 100
    acc += value
    const to = (acc / total) * 100
    return {
      label,
      pct: Math.round((value / total) * 100),
      color: palette.value[i % palette.value.length],
      from,
      to,
    }
  })
})
const pieGradient = computed(
  () =>
    `conic-gradient(${pieSlices.value.map((s) => `${s.color} ${s.from.toFixed(2)}% ${s.to.toFixed(2)}%`).join(',')})`,
)
</script>

<template>
  <div class="rounded-[14px] bg-[#faf9fd] p-3.5">
    <div
      v-if="headerLabel || unit"
      class="mb-2.5 flex items-baseline gap-3"
      :class="headerLabel ? 'justify-between' : 'justify-end'"
    >
      <span
        v-if="headerLabel"
        class="mono truncate text-[9px] font-extrabold tracking-[0.08em] uppercase text-slate-400"
      >
        {{ headerLabel }}
      </span>
      <span v-if="unit" class="mono shrink-0 text-[9px] font-semibold text-slate-400">{{
        unit.trim()
      }}</span>
    </div>

    <div v-if="preview.kind === 'pie'" class="flex items-center gap-4">
      <span class="h-[76px] w-[76px] shrink-0 rounded-full" :style="{ background: pieGradient }" />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div v-for="s in pieSlices.slice(0, 4)" :key="s.label" class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ background: s.color }" />
          <span class="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-700">{{
            s.label
          }}</span>
          <span class="mono text-[11px] text-slate-500">{{ s.pct }} %</span>
        </div>
      </div>
    </div>

    <template v-else>
      <StatsDataMiniChart :key="chartKey" :preview="preview" :palette="palette" />
      <div v-if="!singleSeries" class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        <span
          v-for="(s, si) in series"
          :key="si"
          class="flex items-center gap-1.5 text-[10px] text-slate-500"
        >
          <span
            class="inline-block h-2 w-2 shrink-0 rounded-[3px]"
            :style="{ background: palette[si % palette.length] }"
          />
          <span class="truncate">{{ s.name }}</span>
        </span>
      </div>
    </template>
  </div>
</template>
