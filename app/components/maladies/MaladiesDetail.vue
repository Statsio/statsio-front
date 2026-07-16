<script setup lang="ts">
import { computed } from 'vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import AppWorldScatterMap, { type WorldScatterPoint } from '@/components/ui/AppWorldScatterMap.vue'
import { formatCompactNumber } from '@/utils/number'
import type { Maladie } from '@/types/maladies'

const props = defineProps<{
  maladie: Maladie
}>()

const trendPoints = computed(() => props.maladie.stats?.trend.map((p) => p.value) ?? [])
const trendLabels = computed(() => props.maladie.stats?.trend.map((p) => p.year) ?? [])
/** Suffixe " <unité>" pour concaténation directe (labels de carte, infobulle du sparkline). */
const unitSuffix = computed(() => (props.maladie.indicatorUnit ? ` ${props.maladie.indicatorUnit}` : ''))

const maxTopCountryValue = computed(() =>
  Math.max(...props.maladie.topCountries.map((c) => c.value), 1),
)

const mapPoints = computed<WorldScatterPoint[]>(() =>
  props.maladie.topCountries.map((c) => ({
    lat: c.lat,
    lon: c.lon,
    r: 10,
    fill: 'var(--color-primary)',
    label: `${c.name} — ${formatCompactNumber(c.value)}${unitSuffix.value}`,
    onClick: () => navigateTo(`/medistats/pays/${c.iso3}`),
  })),
)
</script>

<template>
  <div>
    <NuxtLink
      to="/medistats/maladies"
      class="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--color-primary)]"
    >
      ← Retour aux maladies
    </NuxtLink>

    <div class="mb-1.5 flex flex-wrap items-center gap-3">
      <h1 class="text-[26px] font-bold text-slate-900 md:text-[28px]">{{ maladie.name }}</h1>
      <span v-if="maladie.code" class="mono rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11.5px] font-bold text-[var(--color-primary)]">
        ICD-11 {{ maladie.code }}
      </span>
    </div>
    <p v-if="maladie.chapter || maladie.block" class="mb-1 text-xs text-slate-400">
      {{ maladie.chapter }}<span v-if="maladie.chapter && maladie.block"> → </span>{{ maladie.block }}
    </p>
    <p v-if="maladie.synonyms.length" class="mb-4 text-sm text-slate-500">{{ maladie.synonyms.slice(0, 4).join(', ') }}</p>

    <p v-if="maladie.definition" class="my-4 max-w-3xl text-[14.5px] leading-relaxed text-slate-600">
      {{ maladie.definition }}
    </p>

    <div class="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-1 text-[11.5px] text-slate-500">Indicateur OMS suivi</p>
      <template v-if="maladie.stats">
        <p class="mono text-[21px] font-semibold text-slate-900">
          {{ formatCompactNumber(maladie.stats.value) }}
          <span v-if="maladie.indicatorUnit" class="text-[13px] font-normal text-slate-400">{{ maladie.indicatorUnit }}</span>
        </p>
        <p class="mt-1 text-[11.5px] text-slate-400">
          {{ maladie.stats.source }} ({{ maladie.stats.indicatorCode }}) — {{ maladie.stats.year }}
        </p>
        <AppSparkline v-if="trendPoints.length > 1" :points="trendPoints" :labels="trendLabels" :unit="unitSuffix" show-axis class="mt-4" />
      </template>
      <p v-else class="text-[14px] text-slate-400">Non disponible — aucun indicateur OMS ne couvre cette maladie.</p>
    </div>

    <div v-if="maladie.symptoms?.length" class="mb-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-3.5 text-sm font-bold text-slate-900">Symptômes principaux</p>
      <div v-for="sy in maladie.symptoms" :key="sy.label" class="mb-2.5 flex items-start justify-between gap-2.5 text-[13.5px] text-slate-600 last:mb-0">
        <span class="flex items-start gap-2.5">
          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
          {{ sy.label }}
        </span>
        <span class="shrink-0 text-[10.5px] text-slate-400">{{ sy.source }}</span>
      </div>
    </div>

    <div v-if="maladie.riskFactors?.length" class="mb-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-3.5 text-sm font-bold text-slate-900">Facteurs de risque</p>
      <div v-for="fa in maladie.riskFactors" :key="fa.label" class="mb-2.5 flex items-start justify-between gap-2.5 text-[13.5px] text-slate-600 last:mb-0">
        <span class="flex items-start gap-2.5">
          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
          {{ fa.label }}
        </span>
        <span class="shrink-0 text-[10.5px] text-slate-400">{{ fa.source }}</span>
      </div>
    </div>

    <div class="mb-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-3.5 text-sm font-bold text-slate-900">Classification (ICD-11)</p>
      <div class="flex flex-col gap-2.5">
        <div class="flex gap-2.5 text-[13.5px]">
          <span class="w-28 shrink-0 font-semibold text-slate-500">Bloc</span>
          <span class="text-slate-800">{{ maladie.block ?? '—' }}</span>
        </div>
        <div class="flex gap-2.5 text-[13.5px]">
          <span class="w-28 shrink-0 font-semibold text-slate-500">Chapitre</span>
          <span class="text-slate-800">{{ maladie.chapter ?? '—' }}</span>
        </div>
        <div class="flex gap-2.5 text-[13.5px]">
          <span class="w-28 shrink-0 font-semibold text-slate-500">Sous-catégories</span>
          <span class="text-slate-800">{{ maladie.childIds.length || '—' }}</span>
        </div>
      </div>
      <p class="mt-4 text-[11px] text-slate-400">
        Source : {{ maladie.classificationSource.source }} — release {{ maladie.classificationSource.releaseId }}
      </p>
    </div>

    <div v-if="maladie.topCountries.length" class="grid grid-cols-1 gap-5 md:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-1 text-sm font-bold text-slate-900">
          Pays les plus touchés (GHO)
          <span v-if="maladie.indicatorUnit" class="text-[11px] font-normal text-slate-400">— {{ maladie.indicatorUnit }}</span>
        </p>
        <p class="mb-4 text-xs text-slate-400">Cliquez un pays pour ouvrir sa fiche dans la Vue Pays</p>
        <NuxtLink
          v-for="tc in maladie.topCountries"
          :key="tc.iso3"
          :to="`/medistats/pays/${tc.iso3}`"
          class="flex items-center gap-3.5 border-t border-slate-100 py-2.5 first:border-t-0"
        >
          <span class="mono w-10 shrink-0 text-[11px] font-bold text-slate-400">{{ tc.iso3 }}</span>
          <span class="w-32 shrink-0 truncate text-[13.5px] font-bold text-slate-900">{{ tc.name }}</span>
          <span class="h-2 flex-1 overflow-hidden rounded bg-slate-100">
            <span
              class="block h-full rounded bg-[var(--color-primary)]"
              :style="{ width: `${Math.max(8, (tc.value / maxTopCountryValue) * 100)}%` }"
            />
          </span>
          <span class="mono w-20 shrink-0 text-right text-[13px] font-bold text-slate-900">{{ formatCompactNumber(tc.value) }}</span>
        </NuxtLink>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-3.5 text-sm font-bold text-slate-900">
          Localisation des foyers
          <span v-if="maladie.indicatorUnit" class="text-[11px] font-normal text-slate-400">— {{ maladie.indicatorUnit }}</span>
        </p>
        <AppWorldScatterMap :points="mapPoints" :height="230" />
      </div>
    </div>
  </div>
</template>
