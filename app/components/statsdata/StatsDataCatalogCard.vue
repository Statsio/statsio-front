<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogCount, formatCatalogItemMeta } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { seededSparklinePoints, getStatsDataPalette } from '@/utils/statsDataVisuals'
import CatalogFavButton from '@/components/listing/CatalogFavButton.vue'
import CatalogPublisherRow from '@/components/listing/CatalogPublisherRow.vue'

const props = defineProps<{
  item: CatalogItem
  favorited: boolean
}>()

const emit = defineEmits<{
  favorite: []
  'select-tag': [string]
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('statsdata', props.item.slug, basePath.value))
const theme = computed(() => catalogThemeStyle(props.item.category))

const FREQ_LABELS = ['LIVE · 10 MIN', 'QUOTIDIEN', 'HEBDO', 'MENSUEL'] as const
const FREQ_DOTS = ['#059669', '#3b82f6', '#8b5cf6', 'rgba(24,24,31,0.25)'] as const
const FREQ_FG = ['#047857', 'rgba(24,24,31,0.5)', 'rgba(24,24,31,0.5)', 'rgba(24,24,31,0.5)'] as const

function hash(str: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}
const seed = computed(() => hash(props.item.id + '|card'))
const freqIdx = computed(() => seed.value % 4)
const freqLabel = computed(() => FREQ_LABELS[freqIdx.value])
const freqDot = computed(() => FREQ_DOTS[freqIdx.value])
const freqFg = computed(() => FREQ_FG[freqIdx.value])

const palette = computed(() => getStatsDataPalette(props.item.categories))
const accent = computed(() => palette.value[0])
const chartMode = computed(() => {
  const modes = ['line', 'bars', 'hbars', 'pie', 'donut'] as const
  return modes[seed.value % modes.length]
})
const up = computed(() => seed.value % 2 === 0)
const deltaFg = computed(() => up.value ? '#e11d48' : '#059669')

const kpiLabel = computed(() => props.item.category?.toUpperCase() || 'INDICATEUR')
const kpiValue = computed(() => {
  const base = (props.item.charts_count || 1) * 137.42 + (props.item.linked_datasets_count || 0) * 12.8
  if (props.item.category === 'sante') return base.toFixed(1) + ' %'
  if (props.item.category === 'economie') return base.toFixed(0) + ' €'
  if (props.item.category === 'societe') return (base * 0.1).toFixed(1) + ' €/m²'
  if (props.item.category === 'medias') return (base * 0.07).toFixed(1) + ' %'
  if (props.item.category === 'climat') return String(Math.round(base * 0.4)) + ' / 96'
  if (props.item.category === 'energie') return (base * 0.007).toFixed(3) + ' €'
  return formatCatalogCount(Math.round(base * 10))
})
const delta = computed(() => {
  const d = ((seed.value % 35) + 2) / 10
  return (up.value ? '+' : '−') + d.toFixed(1) + ' %'
})

const sparklinePts = computed(() => seededSparklinePoints(props.item.id, 16, seed.value))
function toSeriesPairs(points: number[]): [number, number][] {
  if (!points.length) return []
  const lastIdx = points.length - 1
  return points.map((v, i) => [lastIdx === 0 ? 0 : i / lastIdx, (v % 100) / 100] as [number, number])
}
function seriesFillArea(points: number[]) {
  const pairs = toSeriesPairs(points)
  if (pairs.length < 2) return ''
  const h = 74
  const w = 300
  return `0,${h} ` + pairs.map(p => {
    const x = (p[0] * w).toFixed(1)
    const y = (h - 4 - p[1] * (h - 12)).toFixed(1)
    return x + ',' + y
  }).join(' ') + ` ${w},${h}`
}
function seriesStroke(points: number[]) {
  const pairs = toSeriesPairs(points)
  const h = 74
  const w = 300
  return pairs.map(p => {
    const x = (p[0] * w).toFixed(1)
    const y = (h - 4 - p[1] * (h - 12)).toFixed(1)
    return x + ',' + y
  }).join(' ')
}
const chartFill = computed(() => up.value ? 'rgba(139,92,246,0.12)' : 'rgba(5,150,105,0.12)')
const axisFrom = computed(() => props.item.category === 'climat' ? '2019' : props.item.category === 'economie' ? 'J-14' : '2024')
const axisTo = computed(() => props.item.category === 'climat' ? '2026' : props.item.category === 'economie' ? 'auj.' : '2026')
const chartLabel = computed(() => {
  if (chartMode.value === 'bars') return '14 derniers jours'
  if (chartMode.value === 'hbars') return 'Par catégorie'
  if (chartMode.value === 'pie' || chartMode.value === 'donut') return 'Répartition'
  return 'Évolution 2 ans'
})

const barHeights = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const r = (hash(props.item.id + 'b' + i) % 100) / 100
    const h = 20 + r * 75
    const accent = i >= 9
    return { h: h.toFixed(1) + '%', color: accent ? palette.value[0] : '#dcd6ee' }
  })
)

const PAL = ['#8b5cf6', '#3b82f6', '#c4b5fd', '#e9e6f5']
const sliceLabels = computed(() => {
  const dflt = [
    ['Principal', 'Majoritaire', 'Secondaire', 'Autres'],
    ['A', 'B', 'C', 'D'],
    ['Catégorie 1', 'Catégorie 2', 'Catégorie 3', 'Catégorie 4'],
  ]
  return dflt[seed.value % dflt.length] ?? dflt[0]!
})
const slices = computed(() => {
  const vals = [42 + (seed.value % 10), 21 + (seed.value % 6), 15 + (seed.value % 5), 22 - ((seed.value) % 5)]
  const tot = vals.reduce((a, b) => a + b, 0)
  return sliceLabels.value.map((label, i) => ({
    label,
    value: Math.round((vals[i]! / tot) * 100) + ' %',
    color: PAL[i % 4],
  }))
})
const donutCenter = computed(() => (slices.value[0]?.value || '50 %'))
function conicGrad() {
  let acc = 0
  const tot = 100
  const stops = slices.value.map((s, i) => {
    const from = (acc / tot) * 100
    acc += parseInt(s.value, 10) || 25
    const to = Math.min(100, (acc / tot) * 100)
    return PAL[i % 4] + ' ' + from.toFixed(2) + '% ' + to.toFixed(2) + '%'
  })
  return 'conic-gradient(' + stops.join(',') + ')'
}
const pieGradient = computed(() => conicGrad())

const rowLabels = computed(() => {
  const dflt = [['Loire', 'Rhône', 'Seine', 'Garonne'], ['Finance', 'Industrie', 'Commerce', 'Services'], ['PACA', 'IdF', 'AURA', 'HDF']]
  return dflt[seed.value % dflt.length] ?? dflt[0]!
})
const rows = computed(() =>
  rowLabels.value.map((label, i) => {
    const w = 90 - i * 17 - (seed.value % 10)
    const t = w + ' %'
    return {
      label,
      w: Math.max(20, w) + '%',
      value: t,
      color: i === 0 ? palette.value[0] : '#c4b5fd',
    }
  })
)

const pubMeta = computed(() => formatCatalogItemMeta(props.item.views_count, props.item.updated_at))
</script>

<template>
  <article class="flex flex-col rounded-[18px] border-[1.5px] border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]">
    <div class="mb-3.5 flex items-center gap-2">
      <span
        class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
        :style="{ color: theme.fg, background: theme.bg }"
      >
        {{ (item.category || 'STATS').toUpperCase() }}
      </span>
      <span class="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold tracking-[0.07em]" :style="{ color: freqFg }">
        <span class="h-[5px] w-[5px] shrink-0 rounded-full" :style="{ background: freqDot }" />
        {{ freqLabel }}
      </span>
      <span class="flex-1" />
      <CatalogFavButton compact :active="favorited" @toggle="emit('favorite')" />
    </div>

    <NuxtLink :to="to" class="block text-[17.5px] font-extrabold leading-[1.28] tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary">
      {{ item.title }}
    </NuxtLink>
    <p v-if="item.description" class="mt-2.5 text-[13px] leading-[1.55] text-slate-600">{{ item.description }}</p>

    <div class="my-4 rounded-[14px] bg-[#faf9fd] p-3.5">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <div class="text-[9px] font-extrabold tracking-[0.08em] uppercase text-slate-400">{{ kpiLabel }}</div>
          <div class="mt-1 font-mono text-[23px] font-semibold tracking-[-0.02em]" style="color:#18181f">{{ kpiValue }}</div>
        </div>
        <div class="text-right">
          <div class="font-mono text-[11.5px] font-semibold" :style="{ color: deltaFg }">{{ delta }}</div>
          <div class="mt-1 font-mono text-[9px] tracking-[0.07em] uppercase text-slate-400">{{ chartLabel }}</div>
        </div>
      </div>

      <div v-if="chartMode === 'line'">
        <svg viewBox="0 0 300 74" preserveAspectRatio="none" class="h-[74px] w-full block">
          <polyline :points="seriesFillArea(sparklinePts)" :fill="chartFill" stroke="none" />
          <polyline :points="seriesStroke(sparklinePts)" fill="none" :stroke="accent" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <div class="mt-[7px] flex justify-between font-mono text-[9.5px] text-slate-400">
          <span>{{ axisFrom }}</span><span>{{ axisTo }}</span>
        </div>
      </div>

      <div v-else-if="chartMode === 'bars'">
        <div class="h-[74px] flex items-end gap-1">
          <span
            v-for="(b, i) in barHeights"
            :key="i"
            class="min-w-0 flex-1 rounded-t-[4px]"
            :style="{ height: b.h, background: b.color }"
          />
        </div>
        <div class="mt-[7px] flex justify-between font-mono text-[9.5px] text-slate-400">
          <span>{{ axisFrom }}</span><span>{{ axisTo }}</span>
        </div>
      </div>

      <div v-else-if="chartMode === 'hbars'">
        <div class="flex flex-col gap-[9px]">
          <div v-for="r in rows" :key="r.label" class="grid grid-cols-[84px_1fr_44px] items-center gap-2.5">
            <span class="truncate text-[11.5px] font-semibold text-slate-600">{{ r.label }}</span>
            <span class="relative h-2 overflow-hidden rounded-[5px] bg-[#eeebf6]">
              <span class="absolute inset-y-0 left-0 rounded-[5px]" :style="{ width: r.w, background: r.color }" />
            </span>
            <span class="text-right font-mono text-[11px] text-slate-500">{{ r.value }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="chartMode === 'pie'">
        <div class="flex items-center gap-4">
          <span class="h-[78px] w-[78px] shrink-0 rounded-full" :style="{ background: pieGradient }" />
          <div class="min-w-0 flex-1 flex flex-col gap-1.5">
            <div v-for="s in slices" :key="s.label" class="flex items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ background: s.color }" />
              <span class="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-700">{{ s.label }}</span>
              <span class="font-mono text-[11px] text-slate-500">{{ s.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="chartMode === 'donut'">
        <div class="flex items-center gap-4">
          <span class="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full" :style="{ background: pieGradient }">
            <span class="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#faf9fd] font-mono text-[12px] font-semibold text-slate-950">{{ donutCenter }}</span>
          </span>
          <div class="min-w-0 flex-1 flex flex-col gap-1.5">
            <div v-for="s in slices.slice(0, 3)" :key="s.label" class="flex items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ background: s.color }" />
              <span class="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-700">{{ s.label }}</span>
              <span class="font-mono text-[11px] text-slate-500">{{ s.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="item.tags.length" class="mb-4 flex flex-wrap gap-1.5">
      <button
        v-for="tag in item.tags"
        :key="tag"
        type="button"
        class="rounded-[6px] bg-[#f4f3f8] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-[#f2ecfd] hover:text-primary"
        @click="emit('select-tag', tag)"
      >
        #{{ tag }}
      </button>
    </div>

    <CatalogPublisherRow :publisher="item.publisher" :meta="pubMeta" :to="to" />
  </article>
</template>
