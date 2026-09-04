<script setup lang="ts">
import { computed } from 'vue'
import { useTrends } from '@/composables/useTrends'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicContentPath } from '@/lib/content-display'
import { formatCatalogViews, formatRelativePublished } from '@/lib/catalog-format'
import { formatCompactNumber } from '@/lib/format'
import {
  itemType,
  seededSparkline,
  trendPollLead,
  trendTag,
  TREND_PERIODS,
  TREND_TYPES,
  type TrendTypeFilter,
} from '@/lib/trends'
import type { CatalogItem } from '@/types/catalog'
import CatalogHero from '@/components/listing/CatalogHero.vue'
import CatalogChipRow from '@/components/listing/CatalogChipRow.vue'
import CatalogSortPills from '@/components/listing/CatalogSortPills.vue'
import CatalogCta from '@/components/listing/CatalogCta.vue'
import CatalogEmpty from '@/components/listing/CatalogEmpty.vue'

const {
  type,
  period,
  pending,
  top3,
  rest,
  counts,
  heroStats,
  countLine,
  isEmpty,
  selectType,
  selectPeriod,
} = useTrends()

const basePath = useContentBasePath()

const crumbs = computed(() => [
  { label: 'Accueil', to: basePath.value || '/' },
  { label: 'Tendances' },
])

const typeOptions = computed(() =>
  TREND_TYPES.map((t) => ({ value: t.value, label: t.label, count: counts.value[t.value] })),
)
const periodOptions = TREND_PERIODS.map((p) => ({ value: p.value, label: p.label }))

function hrefFor(item: CatalogItem) {
  return publicContentPath(itemType(item), item.slug, basePath.value)
}

function rankColor(rank: number) {
  return rank === 1 ? '#e11d48' : rank === 2 ? '#7c3aed' : '#3b82f6'
}

/** Métrique principale affichée à droite d'une entrée : audience, ou nombre de réponses pour un sondage. */
function metricFor(item: CatalogItem) {
  if (itemType(item) === 'survey') {
    return `${formatCompactNumber(item.responses_count ?? 0).replace(/\s/g, ' ')} réponses`
  }
  return formatCatalogViews(item.views_count ?? 0)
}

/** Ligne secondaire d'une carte du reste du classement, selon le type. */
function detailFor(item: CatalogItem) {
  const kind = itemType(item)
  if (kind === 'article') return `${item.reading_minutes || 5} min de lecture`
  if (kind === 'statsdata') {
    const n = item.charts_count || 0
    return n > 0 ? `${n} graphique${n > 1 ? 's' : ''}` : 'Jeu de données'
  }
  return trendPollLead(item)?.label ?? `${item.questions_count ?? 1} question${(item.questions_count ?? 1) > 1 ? 's' : ''}`
}

/** Barres de sparkline (top 3) : les 3 dernières mises en avant. */
function barsFor(item: CatalogItem) {
  return seededSparkline(item.id, 10).map((v, i, arr) => ({
    h: `${Math.round(6 + v * 28)}px`,
    lead: i >= arr.length - 3,
  }))
}

function reset() {
  selectType('all')
  selectPeriod('today')
}
</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <CatalogHero
      :crumbs="crumbs"
      badge="TENDANCES"
      kicker="ARTICLES · STATSDATA · SONDAGES"
      subtitle="Articles les plus lus, StatsData qui accélèrent, sondages qui rassemblent le plus de voix — un seul classement, pondéré par l'audience et la fraîcheur."
      :stats="heroStats"
    >
      <template #badge>
        <span
          class="mono inline-flex items-center gap-1.5 rounded-[5px] border border-[#f8ccd6] bg-[#fdeef1] px-2 py-1 text-[10px] font-semibold text-[#be123c]"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-[#e11d48] motion-safe:animate-pulse" aria-hidden="true" />
          TENDANCES
        </span>
      </template>
      <template #title>
        Ce qui <span class="text-primary">bouge</span> sur Statsio,
        <span class="text-accent">en ce moment</span>.
      </template>
    </CatalogHero>

    <div class="border-b border-slate-200/70 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3">
        <CatalogChipRow
          label="Type"
          :model-value="type"
          :options="typeOptions"
          @update:model-value="(v: string) => selectType(v as TrendTypeFilter)"
        />
        <span class="flex-1" />
        <CatalogSortPills :model-value="period" :options="periodOptions" @update:model-value="selectPeriod" />
      </div>
    </div>

    <div class="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:pb-[90px] lg:pt-[26px]">
      <div v-if="pending && !top3.length" class="flex flex-col gap-2.5">
        <div v-for="i in 3" :key="i" class="h-[92px] animate-pulse rounded-[18px] bg-white" />
      </div>

      <template v-else-if="!isEmpty">
        <!-- Top 3 -->
        <div class="mb-3 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">Top 3</div>
        <div class="mb-8 flex flex-col gap-2.5">
          <NuxtLink
            v-for="entry in top3"
            :key="entry.item.id"
            :to="hrefFor(entry.item)"
            class="group flex items-center gap-4 rounded-[18px] border-[1.5px] border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-px hover:border-[#c4b5fd] sm:gap-[18px] sm:px-[22px] sm:py-[18px]"
          >
            <span
              class="mono w-8 shrink-0 text-[26px] font-extrabold sm:w-[38px]"
              :style="{ color: rankColor(entry.rank) }"
            >
              {{ entry.rank }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  class="mono rounded-[5px] px-[7px] py-[3px] text-[9px] font-semibold tracking-[0.06em]"
                  :style="{ color: trendTag(entry.item).fg, background: trendTag(entry.item).bg }"
                >
                  {{ trendTag(entry.item).label }}
                </span>
                <span class="mono truncate text-[10px] text-slate-500">{{ entry.item.publisher.name }}</span>
              </span>
              <span class="block text-[15px] font-extrabold leading-[1.28] text-slate-950 text-pretty sm:text-base">
                {{ entry.item.title }}
              </span>
            </span>

            <!-- Sondage : option en tête + jauge -->
            <span
              v-if="itemType(entry.item) === 'survey' && trendPollLead(entry.item)"
              class="hidden w-[150px] shrink-0 flex-col items-end gap-1.5 sm:flex"
            >
              <span class="mono text-[11px] font-bold text-primary">{{ trendPollLead(entry.item)!.label }}</span>
              <span class="block h-[7px] w-full overflow-hidden rounded-[5px] bg-[#eeebf6]">
                <span
                  class="block h-full rounded-[5px] bg-[linear-gradient(90deg,#8b5cf6,#3b82f6)]"
                  :style="{ width: trendPollLead(entry.item)!.pct + '%' }"
                />
              </span>
              <span class="mono text-[10px] text-slate-400">{{ metricFor(entry.item) }}</span>
            </span>

            <!-- Article / StatsData : audience + sparkline -->
            <span v-else class="hidden shrink-0 items-center gap-3.5 sm:flex">
              <span class="text-right">
                <span class="mono block text-[15px] font-semibold text-slate-950">{{ metricFor(entry.item) }}</span>
                <span class="mono mt-0.5 block text-[10.5px] font-semibold text-slate-400">
                  {{ formatRelativePublished(entry.item.updated_at) }}
                </span>
              </span>
              <span class="flex h-[34px] items-end gap-[2px]">
                <span
                  v-for="(bar, i) in barsFor(entry.item)"
                  :key="i"
                  class="w-[5px] rounded-t-[2px]"
                  :class="bar.lead ? 'bg-primary' : 'bg-[#e4e0f2]'"
                  :style="{ height: bar.h }"
                />
              </span>
            </span>
          </NuxtLink>
        </div>

        <!-- Reste du classement -->
        <div class="mb-3.5 flex flex-wrap items-baseline justify-between gap-4">
          <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">
            Le reste du classement
          </div>
          <div class="mono text-xs text-slate-500">{{ countLine }}</div>
        </div>

        <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NuxtLink
            v-for="entry in rest"
            :key="entry.item.id"
            :to="hrefFor(entry.item)"
            class="group relative flex flex-col rounded-2xl border-[1.5px] border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
          >
            <span class="mono absolute right-4 top-3.5 text-[11px] font-bold text-slate-300">#{{ entry.rank }}</span>
            <span class="mb-2.5 flex">
              <span
                class="mono rounded-[5px] px-[7px] py-[3px] text-[9px] font-semibold tracking-[0.06em]"
                :style="{ color: trendTag(entry.item).fg, background: trendTag(entry.item).bg }"
              >
                {{ trendTag(entry.item).label }}
              </span>
            </span>
            <span class="line-clamp-2 min-h-[38px] text-sm font-extrabold leading-[1.32] text-slate-950 text-pretty">
              {{ entry.item.title }}
            </span>

            <span
              v-if="itemType(entry.item) === 'survey' && trendPollLead(entry.item)"
              class="mt-3.5"
            >
              <span class="block h-[7px] overflow-hidden rounded-[5px] bg-[#eeebf6]">
                <span
                  class="block h-full rounded-[5px] bg-[linear-gradient(90deg,#8b5cf6,#3b82f6)]"
                  :style="{ width: trendPollLead(entry.item)!.pct + '%' }"
                />
              </span>
              <span class="mt-2 block text-[11.5px] font-semibold text-slate-600">{{ detailFor(entry.item) }}</span>
            </span>
            <span v-else class="mt-3.5 flex items-baseline gap-2">
              <span class="mono text-[15px] font-semibold text-slate-950">{{ metricFor(entry.item) }}</span>
              <span class="text-[11.5px] text-slate-500">· {{ detailFor(entry.item) }}</span>
            </span>

            <span class="flex-1" />
            <span class="mt-3.5 flex items-center gap-2.5 border-t border-slate-200/80 pt-3">
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-[9.5px] font-extrabold text-slate-900"
                :class="entry.item.publisher.is_channel ? 'rounded-[7px]' : 'rounded-full'"
              >
                <img
                  v-if="entry.item.publisher.logo_url"
                  :src="entry.item.publisher.logo_url"
                  :alt="entry.item.publisher.name"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ entry.item.publisher.initials }}</span>
              </span>
              <span class="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-500">
                {{ entry.item.publisher.name }}
              </span>
              <span class="mono shrink-0 text-[10.5px] font-semibold text-slate-400">
                {{ formatRelativePublished(entry.item.updated_at) }}
              </span>
            </span>
          </NuxtLink>
        </div>

        <CatalogCta
          title="Toute l'actualité, en un seul endroit"
          subtitle="Articles, StatsData en direct et sondages ouverts — explorez tous les contenus classés par thème."
          primary-to="/articles"
          primary-label="Voir tous les contenus"
          secondary-to="/statsdata"
          secondary-label="Explorer les StatsData"
        />
      </template>

      <CatalogEmpty
        v-else
        title="Aucun contenu à classer"
        subtitle="Aucun contenu publié ne correspond à ce filtre pour le moment."
        @reset="reset"
      />
    </div>
  </div>
</template>
