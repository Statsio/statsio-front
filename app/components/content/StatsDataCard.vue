<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentCardMode, ContentCardTone, ContentManageMeta } from '@/types/content-card'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogCount, formatCatalogItemMeta, formatCatalogViews, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { channelPatternStyle } from '@/lib/channel-brand'
import { seededSparklinePoints, getStatsDataVisual } from '@/utils/statsDataVisuals'
import ContentCardFavButton from '@/components/content/ContentCardFavButton.vue'
import ContentCardOwner from '@/components/content/ContentCardOwner.vue'
import ContentCardActions from '@/components/content/ContentCardActions.vue'
import CatalogSubBrandTag from '@/components/listing/CatalogSubBrandTag.vue'
import StatsDataSyntheticViz from '@/components/content/StatsDataSyntheticViz.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'

const props = withDefaults(
  defineProps<{
    item: CatalogItem
    format?: ContentCardFormat
    mode?: ContentCardMode
    favorited?: boolean
    manage?: ContentManageMeta
    tone?: ContentCardTone
    feature?: boolean
    basePath?: string
    /** Affiche le KPI + mini-graphe factices. Défaut : carte publique uniquement. */
    showSyntheticViz?: boolean
  }>(),
  // `showSyntheticViz: undefined` — garde l'état tri-valué (Vue caste sinon un booléen absent en `false`).
  { format: 'card', mode: 'public', favorited: false, feature: false, tone: 'light', showSyntheticViz: undefined },
)

const emit = defineEmits<{
  favorite: []
  'select-tag': [string]
  edit: []
  remove: [string]
}>()

const injectedBase = useContentBasePath()
const base = computed(() => props.basePath ?? injectedBase.value)
const to = computed(() => publicContentPath('statsdata', props.item.slug, base.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const isManage = computed(() => props.mode === 'manage' && !!props.manage)
const showViz = computed(() => props.showSyntheticViz ?? (props.mode === 'public' && props.format === 'card' && !props.feature))
const pubMeta = computed(() => formatCatalogItemMeta(props.item.views_count, props.item.updated_at))

const visual = computed(() => getStatsDataVisual(props.item.categories))
const sparklinePoints = computed(() => seededSparklinePoints(props.item.id, 7))

const FREQ_LABELS = ['LIVE · 10 MIN', 'QUOTIDIEN', 'HEBDO', 'MENSUEL'] as const
const FREQ_DOTS = ['#059669', '#3b82f6', '#8b5cf6', 'rgba(24,24,31,0.25)'] as const
const FREQ_FG = ['#047857', 'rgba(24,24,31,0.5)', 'rgba(24,24,31,0.5)', 'rgba(24,24,31,0.5)'] as const
function hash(str: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const seed = computed(() => hash(props.item.id + '|card'))
const freqIdx = computed(() => seed.value % 4)
const freqLabel = computed(() => FREQ_LABELS[freqIdx.value])
const freqDot = computed(() => FREQ_DOTS[freqIdx.value])
const freqFg = computed(() => FREQ_FG[freqIdx.value])

// ── Hero « à la une » (format row feature) — logique dédiée ──────────────────
const fSeed = computed(() => hash(props.item.id + '|feat'))
const fUp = computed(() => fSeed.value % 2 === 0)
const fFreqLabel = computed(() => FREQ_LABELS[fSeed.value % 4])
const fFreqDot = computed(() => (['#34d399', '#3b82f6', '#8b5cf6', 'rgba(255,255,255,0.25)'] as const)[fSeed.value % 4])
const fFreqFg = computed(() => (['#6ee7b7', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)'] as const)[fSeed.value % 4])
const fKpiLabel = computed(() => {
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
const fKpiValue = computed(() => {
  const b = (props.item.charts_count || 1) * 137.42 + (props.item.linked_datasets_count || 0) * 12.8
  if (props.item.category === 'sante') return (b * 0.02).toFixed(0) + ' h ' + Math.round((b * 1.2) % 60)
  if (props.item.category === 'economie') return formatCatalogCount(Math.round(b * 3.5)) + ' €'
  if (props.item.category === 'societe') return (b * 0.1).toFixed(1) + ' €/m²'
  if (props.item.category === 'medias') return (b * 0.07).toFixed(1) + ' %'
  if (props.item.category === 'climat') return String(Math.round(b * 0.4)) + ' / 96'
  if (props.item.category === 'energie') return (b * 0.007).toFixed(3) + ' €'
  return formatCatalogCount(Math.round(b * 10))
})
const fDelta = computed(() => {
  const d = ((fSeed.value % 35) + 2) / 10
  return (fUp.value ? '+' : '−') + d.toFixed(1) + ' %'
})
const fDeltaFg = computed(() => (fUp.value ? '#fda4af' : '#6ee7b7'))
const fStats = computed(() => [
  { label: 'Consultations', value: formatCatalogCount(props.item.views_count) },
  { label: 'Sources', value: String(props.item.linked_datasets_count || (fSeed.value % 4) + 1) },
  { label: 'Graphiques', value: String(props.item.charts_count || (fSeed.value % 6) + 2) },
])
const fPts = computed(() => seededSparklinePoints(props.item.id, 16, fSeed.value))
function fPairs(points: number[]): [number, number][] {
  if (!points.length) return []
  const vals = points.map((v) => (v % 100) / 100)
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  const lastIdx = vals.length - 1
  return vals.map((v, i) => {
    const norm = mx - mn === 0 ? 0.5 : (v - mn) / (mx - mn)
    const scaled = 0.28 + norm * 0.5 + (lastIdx === 0 ? 0 : i / lastIdx) * 0.28
    return [lastIdx === 0 ? 0 : i / lastIdx, Math.min(1, scaled)] as [number, number]
  })
}
function fArea(points: number[]) {
  const pairs = fPairs(points)
  if (pairs.length < 2) return ''
  const h = 110
  const w = 300
  return `0,${h} ` + pairs.map((p) => `${(p[0] * w).toFixed(1)},${(h - 4 - p[1] * (h - 12)).toFixed(1)}`).join(' ') + ` ${w},${h}`
}
function fStroke(points: number[]) {
  const w = 300
  const h = 110
  return fPairs(points).map((p) => `${(p[0] * w).toFixed(1)},${(h - 4 - p[1] * (h - 12)).toFixed(1)}`).join(' ')
}
const fAxisFrom = computed(() =>
  props.item.category === 'climat' || props.item.category === 'energie'
    ? '2019'
    : props.item.category === 'economie'
      ? 'J-14'
      : '2024',
)
const fPubRadius = computed(() => (props.item.publisher.is_channel ? '11px' : '50%'))
const fPubMeta = computed(
  () => `${props.item.publisher.is_channel ? 'Chaîne' : 'Auteur'} · ${formatRelativePublished(props.item.updated_at)}`,
)
</script>

<template>
  <NuxtLink
    v-if="feature"
    :to="to"
    class="grid gap-[34px] items-center overflow-hidden rounded-[22px] p-[30px] text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5"
    style="background:linear-gradient(135deg,#18181f,#2c2440);grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)"
  >
    <span class="min-w-0 block">
      <span class="mb-[14px] flex items-center gap-[9px]">
        <span class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-slate-950" style="background:#c4b5fd">À LA UNE</span>
        <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em]" :style="{ color: fFreqFg }">
          <span class="h-[6px] w-[6px] shrink-0 rounded-full" :style="{ background: fFreqDot }" />
          {{ fFreqLabel }}
        </span>
      </span>
      <span class="block text-[30px] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty">{{ item.title }}</span>
      <span v-if="item.description" class="mt-3 block max-w-[54ch] text-[14.5px] leading-[1.6] text-white/68">{{ item.description }}</span>
      <span class="mt-[22px] flex flex-wrap gap-[26px]">
        <span v-for="s in fStats" :key="s.label" class="block">
          <span class="block text-[9px] font-extrabold tracking-[0.08em] uppercase text-white/50">{{ s.label }}</span>
          <span class="mt-[5px] block font-mono text-[15px] font-semibold">{{ s.value }}</span>
        </span>
      </span>
      <span class="mt-[22px] flex items-center gap-2.5">
        <span
          class="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden text-xs font-extrabold text-white"
          :style="{ borderRadius: fPubRadius, background: `linear-gradient(135deg,${theme.dot},#3b82f6)` }"
        >
          <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" :alt="item.publisher.name" class="h-full w-full object-cover" />
          <span v-else>{{ item.publisher.initials }}</span>
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1 text-[13px] font-bold">
            {{ item.publisher.name }}
            <span v-if="item.publisher.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="mt-0.5 block font-mono text-[10.5px] text-white/50">{{ fPubMeta }}</span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 rounded-full px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)">
        OUVRIR LE STATSDATA →
      </span>
    </span>

    <span class="block min-w-0 rounded-[16px] border border-white/14 p-5 box-border" style="background:rgba(255,255,255,0.06)">
      <span class="flex items-baseline justify-between gap-3">
        <span class="text-[10px] font-extrabold tracking-[0.09em] uppercase text-white/55">{{ fKpiLabel }}</span>
        <span class="font-mono text-[11.5px] font-semibold" :style="{ color: fDeltaFg }">{{ fDelta }}</span>
      </span>
      <span class="mt-2 mb-4 block font-mono text-[34px] font-semibold tracking-[-0.02em]">{{ fKpiValue }}</span>
      <svg viewBox="0 0 300 110" preserveAspectRatio="none" class="block h-[118px] w-full">
        <polyline :points="fArea(fPts)" fill="rgba(196,181,253,0.22)" stroke="none" />
        <polyline :points="fStroke(fPts)" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
      <span class="mt-[10px] flex justify-between font-mono text-[10px] text-white/55">
        <span>{{ fAxisFrom }}</span><span>2026</span>
      </span>
    </span>
  </NuxtLink>

  <div
    v-else-if="format === 'row'"
    class="grid grid-cols-[minmax(0,2.4fr)_1.3fr_1fr_0.8fr_0.7fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span class="h-[34px] w-11 shrink-0 rounded-[7px]" :style="item.thumbnail_url ? undefined : channelPatternStyle(theme.dot)">
        <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full rounded-[7px] object-cover" />
      </span>
      <span class="min-w-0">
        <NuxtLink :to="isManage && manage ? manage.studioPath : to" class="block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{{ formatCatalogViews(item.views_count) }}</span>
      </span>
    </div>
    <div>
      <AppSparkline :points="sparklinePoints" :color="visual.color" :height="22" />
    </div>
    <div class="truncate font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: theme.fg }">
      {{ item.category ?? '—' }}
    </div>
    <div class="min-w-0 truncate text-[12.5px] font-semibold text-slate-600">{{ isManage && manage ? manage.ownerLabel : item.publisher.name }}</div>
    <div class="text-right font-mono text-xs font-semibold text-slate-950">
      {{ item.linked_datasets_count || '—' }}
      <span class="ml-1 font-normal text-slate-400">src</span>
    </div>
    <div class="flex justify-end">
      <ContentCardFavButton v-if="!isManage" compact :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="rounded-full px-2 py-0.5 text-[9.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>
  </div>

  <article
    v-else
    class="flex flex-col rounded-[18px] border-[1.5px] border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
  >
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
      <ContentCardFavButton v-if="!isManage" compact :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>

    <CatalogSubBrandTag :categories="item.categories" content-type="statsdata" />
    <NuxtLink
      :to="isManage && manage ? manage.studioPath : to"
      class="block text-[17.5px] font-extrabold leading-[1.28] tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary"
    >
      {{ item.title }}
    </NuxtLink>
    <p v-if="item.description" class="mt-2.5 text-[13px] leading-[1.55] text-slate-600">{{ item.description }}</p>

    <StatsDataSyntheticViz v-if="showViz" :item="item" />
    <div v-else class="my-4 rounded-[14px] bg-[#faf9fd] p-3.5">
      <AppSparkline :points="sparklinePoints" :color="visual.color" :height="44" />
    </div>

    <div v-if="!isManage && item.tags.length" class="mb-4 flex flex-wrap gap-1.5">
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

    <slot name="cta" />

    <ContentCardActions v-if="isManage && manage" class="mt-auto" :manage="manage" />
    <ContentCardOwner v-else class="mt-auto" :publisher="item.publisher" :meta="pubMeta" :to="to" />
  </article>
</template>
