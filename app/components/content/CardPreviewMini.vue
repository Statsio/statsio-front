<script setup lang="ts">
import { computed } from 'vue'
import type { CardPreview } from '@/types/catalog'
import { getStatsDataPalette } from '@/utils/statsDataVisuals'
import { formatCompactNumber } from '@/utils/number'
import AppSparkline from '@/components/ui/AppSparkline.vue'

/**
 * Rendu pur d'un `CardPreview` (mini-graphe réel d'une carte Statsdata). Partagé
 * par `StatsDataCardChart` (carte de catalogue) et la carte de réglage
 * « Visuel de la carte ».
 */
const props = defineProps<{ preview: CardPreview; categories?: string[]; label?: string }>()

const palette = computed(() => getStatsDataPalette(props.categories))
const series = computed(() => props.preview.series ?? [])
const labels = computed(() => props.preview.labels ?? [])
const unit = computed(() => props.preview.unit ?? '')
const singleSeries = computed(() => series.value.length === 1)

const flatValues = computed(() => series.value.flatMap((s) => s.values))
const maxVal = computed(() => Math.max(0, ...flatValues.value))
const minVal = computed(() => Math.min(0, ...flatValues.value))

const headerLabel = computed(() => {
  if (props.label) return props.label
  if (singleSeries.value && series.value[0]?.name) return series.value[0].name
  return 'Aperçu'
})

const topRows = computed(() => {
  const values = series.value[0]?.values ?? []
  return labels.value
    .map((label, i) => ({ label, value: values[i] ?? 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6)
})

function fmt(v: number) {
  return formatCompactNumber(v) + unit.value
}

function barHeight(v: number) {
  if (maxVal.value <= 0) return '2%'
  return `${Math.max(2, (Math.max(0, v) / maxVal.value) * 100)}%`
}

function rowWidth(v: number) {
  const max = Math.max(...topRows.value.map((r) => Math.abs(r.value)), 1)
  return `${Math.max(4, (Math.abs(v) / max) * 100)}%`
}

function linePoints(values: number[]) {
  const n = values.length
  const range = maxVal.value - minVal.value || 1
  return values
    .map((v, i) => {
      const x = n <= 1 ? 0 : (i / (n - 1)) * 300
      const y = 72 - ((v - minVal.value) / range) * 68 - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

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
    <div class="mb-2.5 flex items-baseline justify-between gap-3">
      <span
        class="mono truncate text-[9px] font-extrabold tracking-[0.08em] uppercase text-slate-400"
      >
        {{ headerLabel }}
      </span>
      <span v-if="unit" class="mono shrink-0 text-[9px] font-semibold text-slate-400">{{
        unit.trim()
      }}</span>
    </div>

    <AppSparkline
      v-if="preview.kind === 'line' && singleSeries"
      :points="series[0]!.values"
      :labels="labels"
      :unit="unit"
      :color="palette[0]"
      :height="72"
      show-axis
    />

    <div v-else-if="preview.kind === 'pie'" class="flex items-center gap-4">
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

    <div v-else-if="preview.orientation === 'horizontal'" class="flex flex-col gap-[9px]">
      <div
        v-for="r in topRows"
        :key="r.label"
        class="grid grid-cols-[76px_1fr_46px] items-center gap-2.5"
      >
        <span class="truncate text-[11.5px] font-semibold text-slate-600">{{ r.label }}</span>
        <span class="relative h-2 overflow-hidden rounded-[5px] bg-[#eeebf6]">
          <span
            class="absolute inset-y-0 left-0 rounded-[5px]"
            :style="{ width: rowWidth(r.value), background: palette[0] }"
          />
        </span>
        <span class="mono truncate text-right text-[11px] text-slate-500">{{ fmt(r.value) }}</span>
      </div>
    </div>

    <template v-else-if="preview.kind === 'bar' && singleSeries">
      <div class="flex h-[74px] items-end gap-1">
        <span
          v-for="(v, i) in series[0]!.values"
          :key="i"
          class="min-w-0 flex-1 rounded-t-[3px]"
          :style="{ height: barHeight(v), background: palette[0] }"
        />
      </div>
      <div class="mono mt-[7px] flex justify-between text-[9.5px] text-slate-400">
        <span class="truncate">{{ labels[0] }}</span>
        <span class="truncate">{{ labels[labels.length - 1] }}</span>
      </div>
    </template>

    <template v-else>
      <svg viewBox="0 0 300 74" preserveAspectRatio="none" class="block h-[74px] w-full">
        <polyline
          v-for="(s, si) in series"
          :key="si"
          :points="linePoints(s.values)"
          fill="none"
          :stroke="palette[si % palette.length]"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </svg>
      <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
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
