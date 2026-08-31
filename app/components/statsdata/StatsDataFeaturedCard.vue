<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { seededSparklinePoints } from '@/utils/statsDataVisuals'

const props = defineProps<{
  item: CatalogItem
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('statsdata', props.item.slug, basePath.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const pubRadius = computed(() => props.item.publisher.is_channel ? '11px' : '50%')
const pubMeta = computed(() => `${props.item.publisher.is_channel ? 'Chaîne' : 'Auteur'} · ${formatRelativePublished(props.item.updated_at)}`)

const FREQ_LABELS = ['LIVE · 10 MIN', 'QUOTIDIEN', 'HEBDO', 'MENSUEL'] as const
const FREQ_DOTS = ['#34d399', '#3b82f6', '#8b5cf6', 'rgba(255,255,255,0.25)'] as const
const FREQ_FG = ['#6ee7b7', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)'] as const

function hash(str: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}
const seed = computed(() => hash(props.item.id + '|feat'))
const freqIdx = computed(() => seed.value % 4)
const freqLabel = computed(() => FREQ_LABELS[freqIdx.value])
const freqDot = computed(() => FREQ_DOTS[freqIdx.value])
const freqFg = computed(() => FREQ_FG[freqIdx.value])

const up = computed(() => seed.value % 2 === 0)

const kpiLabel = computed(() => {
  if (!props.item.category) return 'INDICATEUR CLÉ'
  const map: Record<string, string> = {
    sante: 'Passage urgences médian',
    economie: 'Budget suivi',
    societe: 'Loyer médian',
    medias: 'PDA leader',
    climat: 'Bassins en alerte',
    energie: 'Prix moyen national',
  }
  return map[props.item.category] || props.item.category.toUpperCase()
})
const kpiValue = computed(() => {
  const base = (props.item.charts_count || 1) * 137.42 + (props.item.linked_datasets_count || 0) * 12.8
  if (props.item.category === 'sante') return (base * 0.02).toFixed(0) + ' h ' + Math.round((base * 1.2) % 60)
  if (props.item.category === 'economie') return formatCatalogCount(Math.round(base * 3.5)) + ' €'
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
const deltaFg = computed(() => up.value ? '#fda4af' : '#6ee7b7')

const featuredStats = computed(() => ([
  { label: 'Consultations', value: formatCatalogCount(props.item.views_count) },
  { label: 'Sources', value: String(props.item.linked_datasets_count || (seed.value % 4) + 1) },
  { label: 'Graphiques', value: String(props.item.charts_count || (seed.value % 6) + 2) },
]))

const sparklinePts = computed(() => seededSparklinePoints(props.item.id, 16, seed.value))
function toSeriesPairs(points: number[]): [number, number][] {
  if (!points.length) return []
  const vals = points.map(v => (v % 100) / 100)
  const mn = Math.min(...vals), mx = Math.max(...vals)
  const lastIdx = vals.length - 1
  return vals.map((v, i) => {
    const norm = mx - mn === 0 ? 0.5 : (v - mn) / (mx - mn)
    const scaled = 0.28 + norm * 0.5 + (lastIdx === 0 ? 0 : i / lastIdx) * 0.28
    return [lastIdx === 0 ? 0 : i / lastIdx, Math.min(1, scaled)] as [number, number]
  })
}
function seriesFillArea(points: number[]) {
  const pairs = toSeriesPairs(points)
  if (pairs.length < 2) return ''
  const h = 110
  const w = 300
  return `0,${h} ` + pairs.map(p => {
    const x = (p[0] * w).toFixed(1)
    const y = (h - 4 - p[1] * (h - 12)).toFixed(1)
    return x + ',' + y
  }).join(' ') + ` ${w},${h}`
}
function seriesStroke(points: number[]) {
  const pairs = toSeriesPairs(points)
  const h = 110
  const w = 300
  return pairs.map(p => {
    const x = (p[0] * w).toFixed(1)
    const y = (h - 4 - p[1] * (h - 12)).toFixed(1)
    return x + ',' + y
  }).join(' ')
}
const axisFrom = computed(() => props.item.category === 'climat' || props.item.category === 'energie' ? '2019' : props.item.category === 'economie' ? 'J-14' : '2024')
const axisTo = computed(() => '2026')
</script>

<template>
  <NuxtLink
    :to="to"
    class="mb-[22px] grid gap-[34px] items-center overflow-hidden rounded-[22px] p-[30px] text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5"
    style="background:linear-gradient(135deg,#18181f,#2c2440);grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)"
  >
    <span class="min-w-0 block">
      <span class="mb-[14px] flex items-center gap-[9px]">
        <span class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-slate-950" style="background:#c4b5fd">À LA UNE</span>
        <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em]" :style="{ color: freqFg }">
          <span class="h-[6px] w-[6px] shrink-0 rounded-full" :style="{ background: freqDot }" />
          {{ freqLabel }}
        </span>
      </span>
      <span class="block text-[30px] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty">
        {{ item.title }}
      </span>
      <span v-if="item.description" class="mt-3 block max-w-[54ch] text-[14.5px] leading-[1.6] text-white/68">
        {{ item.description }}
      </span>
      <span class="mt-[22px] flex flex-wrap gap-[26px]">
        <span v-for="s in featuredStats" :key="s.label" class="block">
          <span class="block text-[9px] font-extrabold tracking-[0.08em] uppercase text-white/50">{{ s.label }}</span>
          <span class="mt-[5px] block font-mono text-[15px] font-semibold">{{ s.value }}</span>
        </span>
      </span>
      <span class="mt-[22px] flex items-center gap-2.5">
        <span
          class="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden text-xs font-extrabold text-white"
          :style="{ borderRadius: pubRadius, background: `linear-gradient(135deg,${theme.dot},#3b82f6)` }"
        >
          <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" :alt="item.publisher.name" class="h-full w-full object-cover" />
          <span v-else>{{ item.publisher.initials }}</span>
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1 text-[13px] font-bold">
            {{ item.publisher.name }}
            <span v-if="item.publisher.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="mt-0.5 block font-mono text-[10.5px] text-white/50">{{ pubMeta }}</span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 rounded-full px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)">
        OUVRIR LE STATSDATA →
      </span>
    </span>

    <span
      class="block min-w-0 rounded-[16px] border border-white/14 p-5 box-border"
      style="background:rgba(255,255,255,0.06)"
    >
      <span class="flex items-baseline justify-between gap-3">
        <span class="text-[10px] font-extrabold tracking-[0.09em] uppercase text-white/55">{{ kpiLabel }}</span>
        <span class="font-mono text-[11.5px] font-semibold" :style="{ color: deltaFg }">{{ delta }}</span>
      </span>
      <span class="mt-2 mb-4 block font-mono text-[34px] font-semibold tracking-[-0.02em]">{{ kpiValue }}</span>
      <svg viewBox="0 0 300 110" preserveAspectRatio="none" class="block h-[118px] w-full">
        <polyline :points="seriesFillArea(sparklinePts)" fill="rgba(196,181,253,0.22)" stroke="none" />
        <polyline :points="seriesStroke(sparklinePts)" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
      <span class="mt-[10px] flex justify-between font-mono text-[10px] text-white/55">
        <span>{{ axisFrom }}</span><span>{{ axisTo }}</span>
      </span>
    </span>
  </NuxtLink>
</template>
