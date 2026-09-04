<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentCardMode, ContentCardTone, ContentManageMeta } from '@/types/content-card'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogCount, formatCatalogItemMeta, formatCatalogViews, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { seededSparklinePoints, getStatsDataVisual } from '@/utils/statsDataVisuals'
import { freshnessLabel, type FreshnessTone } from '@/lib/statsdata-freshness'
import ContentCardFavButton from '@/components/content/ContentCardFavButton.vue'
import ContentCardOwner from '@/components/content/ContentCardOwner.vue'
import ContentCardActions from '@/components/content/ContentCardActions.vue'
import CatalogSubBrandTag from '@/components/listing/CatalogSubBrandTag.vue'
import ContentCardDossierTag from '@/components/content/ContentCardDossierTag.vue'
import ContentFeaturedBadge from '@/components/content/ContentFeaturedBadge.vue'
import StatsDataCardChart from '@/components/content/StatsDataCardChart.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

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

/**
 * Image de couverture facultative (réglages du contenu, comme les articles).
 * Quand elle existe, elle devient le visuel principal de la carte : on remplace
 * le mini-graphe par un bandeau image + un sparkline discret (signature « data »).
 */
const hasImage = computed(() => Boolean(props.item.thumbnail_url))

/** Le contenu porte au moins un bloc graphique → on peut afficher un mini-graphe réel. Sinon : rien (pas de viz factice). */
const hasChart = computed(() => (props.item.charts_count ?? 0) > 0)

/** Contenu « à la une » (admin) affiché en carte normale → pastille « À LA UNE ». La grande card featured (`feature`) a déjà la sienne. */
const pinned = computed(() => Boolean(props.item.is_featured) && !props.feature)

const visual = computed(() => getStatsDataVisual(props.item.categories))
const sparklinePoints = computed(() => seededSparklinePoints(props.item.id, 7))

function hash(str: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ── Fraîcheur réelle de la source principale (null = source figée « jamais » → rien) ──
const fresh = computed(() => (props.item.freshness ? freshnessLabel(props.item.freshness) : null))
const FRESH_DOT: Record<FreshnessTone, string> = {
  live: '#059669',
  fresh: '#3b82f6',
  stale: 'rgba(24,24,31,0.3)',
  unknown: 'rgba(24,24,31,0.3)',
}
const FRESH_FG: Record<FreshnessTone, string> = {
  live: '#047857',
  fresh: 'rgba(24,24,31,0.5)',
  stale: 'rgba(24,24,31,0.5)',
  unknown: 'rgba(24,24,31,0.5)',
}

// ── Hero « à la une » (format row feature) — logique dédiée ──────────────────
const fSeed = computed(() => hash(props.item.id + '|feat'))
const fStats = computed(() => [
  { label: 'Consultations', value: formatCatalogCount(props.item.views_count) },
  { label: 'Sources', value: String(props.item.linked_datasets_count || (fSeed.value % 4) + 1) },
  { label: 'Graphiques', value: String(props.item.charts_count || (fSeed.value % 6) + 2) },
])
const fPubRadius = computed(() => (props.item.publisher.is_channel ? '11px' : '50%'))
const fPubMeta = computed(
  () => `${props.item.publisher.is_channel ? 'Chaîne' : 'Auteur'} · ${formatRelativePublished(props.item.updated_at)}`,
)
</script>

<template>
  <NuxtLink
    v-if="feature"
    :to="to"
    class="u-card grid items-stretch overflow-hidden rounded-[22px] border-[1.5px] border-slate-200/80 bg-white text-slate-950 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
    :class="{ 'lg:grid-cols-2': hasImage || hasChart }"
  >
    <span class="flex min-w-0 flex-col p-[30px] lg:p-8">
      <span class="mb-[14px] flex items-center gap-[9px]">
        <span class="rounded-[5px] bg-slate-950 px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-white">À LA UNE</span>
        <span v-if="fresh" class="flex items-center gap-1.5 font-mono text-[10px] font-semibold" :style="{ color: FRESH_FG[fresh.tone] }">
          <span class="h-[6px] w-[6px] shrink-0 rounded-full" :style="{ background: FRESH_DOT[fresh.tone] }" />
          {{ fresh.text }}
        </span>
      </span>
      <span class="u-card-title block text-[27px] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty lg:text-[30px]">{{ item.title }}</span>
      <span v-if="item.description" class="mt-3 block max-w-[54ch] text-[14.5px] leading-[1.6] text-slate-500">{{ item.description }}</span>
      <span class="mt-[22px] flex flex-wrap gap-[26px] border-t border-slate-950/[0.08] pt-[18px]">
        <span v-for="s in fStats" :key="s.label" class="block">
          <span class="block text-[9px] font-extrabold tracking-[0.08em] uppercase text-slate-400">{{ s.label }}</span>
          <span class="mt-[5px] block font-mono text-[15px] font-semibold">{{ s.value }}</span>
        </span>
      </span>
      <span class="mt-[22px] flex items-center gap-2.5">
        <span
          class="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-xs font-extrabold text-slate-900"
          :style="{ borderRadius: fPubRadius }"
        >
          <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" :alt="item.publisher.name" class="h-full w-full object-cover" />
          <span v-else>{{ item.publisher.initials }}</span>
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1 text-[13px] font-bold">
            {{ item.publisher.name }}
            <span v-if="item.publisher.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="mt-0.5 block font-mono text-[10.5px] text-slate-400">{{ fPubMeta }}</span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white">
        OUVRIR LE STATSDATA →
      </span>
    </span>

    <span
      v-if="hasImage"
      class="relative flex min-h-[240px] min-w-0 items-center overflow-hidden border-t border-slate-200/80 p-5 lg:min-h-0 lg:border-l lg:border-t-0 lg:p-6"
    >
      <AppMediaImage :src="item.thumbnail_url" :alt="item.title" class="u-card-media absolute inset-0" />
      <template v-if="hasChart">
        <span class="absolute inset-0 bg-slate-950/15" />
        <span class="relative w-full rounded-[16px] border border-white/50 bg-white/80 p-3 shadow-[0_10px_34px_rgba(20,20,30,0.22)] backdrop-blur-md">
          <StatsDataCardChart :item="item" class="w-full" />
        </span>
      </template>
    </span>
    <span
      v-else-if="hasChart"
      class="flex min-w-0 items-center border-t border-slate-200/80 bg-[#faf9fd] px-6 py-4 lg:border-l lg:border-t-0 lg:px-7 lg:py-6"
    >
      <StatsDataCardChart :item="item" class="w-full" />
    </span>
  </NuxtLink>

  <div
    v-else-if="format === 'row'"
    class="u-hover grid grid-cols-[minmax(0,2.4fr)_1.3fr_1fr_0.8fr_0.7fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span class="h-[34px] w-11 shrink-0 overflow-hidden rounded-[7px]">
        <AppMediaImage :src="item.thumbnail_url" :alt="item.title" class="u-card-media rounded-[7px]" mark-class="min-w-0 w-1/2" />
      </span>
      <span class="min-w-0">
        <ContentFeaturedBadge v-if="pinned" compact class="mb-1" />
        <NuxtLink :to="isManage && manage ? manage.studioPath : to" class="u-card-title block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
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
    class="u-card flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] hover:-translate-y-0.5"
  >
    <div v-if="hasImage" class="relative h-[140px] overflow-hidden">
      <AppMediaImage :src="item.thumbnail_url" :alt="item.title" class="u-card-media absolute inset-0" />
      <span class="absolute left-3 top-3 flex flex-col items-start gap-1.5">
        <ContentFeaturedBadge v-if="pinned" />
        <span
          class="rounded-[5px] bg-white px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
          :style="{ color: theme.fg }"
        >
          {{ (item.category || 'STATS').toUpperCase() }}
        </span>
      </span>
      <ContentCardFavButton v-if="!isManage" class="absolute right-2.5 top-2.5" :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
      <span
        v-if="fresh"
        class="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 font-mono text-[9.5px] font-semibold"
        :style="{ color: FRESH_FG[fresh.tone] }"
      >
        <span class="h-[5px] w-[5px] shrink-0 rounded-full" :style="{ background: FRESH_DOT[fresh.tone] }" />
        {{ fresh.text }}
      </span>
    </div>

    <div class="flex flex-1 flex-col" :class="hasImage ? 'px-5 pb-5 pt-[18px]' : 'p-5'">
      <div v-if="!hasImage" class="mb-3.5 flex items-center gap-2">
        <ContentFeaturedBadge v-if="pinned" />
        <span
          class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
          :style="{ color: theme.fg, background: theme.bg }"
        >
          {{ (item.category || 'STATS').toUpperCase() }}
        </span>
        <span v-if="fresh" class="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold" :style="{ color: FRESH_FG[fresh.tone] }">
          <span class="h-[5px] w-[5px] shrink-0 rounded-full" :style="{ background: FRESH_DOT[fresh.tone] }" />
          {{ fresh.text }}<template v-if="fresh.detail"> · {{ fresh.detail }}</template>
        </span>
        <span class="flex-1" />
        <ContentCardFavButton v-if="!isManage" compact :active="favorited" @toggle="emit('favorite')" />
        <span
          v-else-if="manage"
          class="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          :style="{ background: manage.statusBg, color: manage.statusColor }"
        >{{ manage.statusLabel }}</span>
      </div>

      <CatalogSubBrandTag :categories="item.categories" :sub-brand="item.sub_brand" content-type="statsdata" />
      <ContentCardDossierTag :dossier="item.dossier" />
      <NuxtLink
        :to="isManage && manage ? manage.studioPath : to"
        class="u-card-title block text-[17.5px] font-extrabold leading-[1.28] tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary"
      >
        {{ item.title }}
      </NuxtLink>
      <p v-if="item.description" class="mt-2.5 text-[13px] leading-[1.55] text-slate-600">{{ item.description }}</p>

      <!-- Aucun bloc graphique → on n'affiche aucune viz (pas de graphe factice). -->
      <template v-if="hasChart">
        <!-- Image posée : sparkline discret en signature « data ». Sinon : mini-graphe réel. -->
        <div v-if="hasImage" class="mt-3.5">
          <AppSparkline v-if="!isManage" :points="sparklinePoints" :color="visual.color" :height="26" />
        </div>
        <template v-else>
          <StatsDataCardChart v-if="showViz" :item="item" />
          <div v-else class="my-4 rounded-[14px] bg-[#faf9fd] p-3.5">
            <AppSparkline :points="sparklinePoints" :color="visual.color" :height="44" />
          </div>
        </template>
      </template>

      <slot name="cta" />

      <div class="flex-1" />
      <ContentCardActions v-if="isManage && manage" :manage="manage" />
      <ContentCardOwner v-else :publisher="item.publisher" :meta="pubMeta" :to="to" />
    </div>
  </article>
</template>
