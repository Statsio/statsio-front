<script setup lang="ts">
import { computed } from 'vue'
import { usePays } from '@/composables/usePays'
import AppSectionTabs from '@/components/ui/AppSectionTabs.vue'
import AppWorldScatterMap, { type WorldScatterPoint } from '@/components/ui/AppWorldScatterMap.vue'
import type { IndicatorKey } from '@/types/pays'
import { formatCompactNumber } from '@/utils/number'
import { isoToFlagEmoji } from '@/utils/flag'

const {
  indicator,
  countryQuery,
  activeIndicator,
  options,
  countries,
  filteredCountries,
  countriesEmpty,
  isLoading,
  error,
} = usePays()

const withValue = computed(() => countries.value.filter((c) => c.value !== null))
const minValue = computed(() => Math.min(...withValue.value.map((c) => c.value as number)))
const maxValue = computed(() => Math.max(...withValue.value.map((c) => c.value as number), 1))

const mapPoints = computed<WorldScatterPoint[]>(() =>
  withValue.value.map((c) => {
    const range = maxValue.value - minValue.value || 1
    const norm = Math.min(1, Math.max(0, ((c.value as number) - minValue.value) / range))
    return {
      lat: c.lat,
      lon: c.lon,
      r: 6 + norm * 12,
      fill: `rgba(153,27,27,${(0.25 + norm * 0.6).toFixed(2)})`,
      stroke: 'var(--color-primary)',
      label: `${c.name} — ${c.value}${activeIndicator.value?.unit ?? ''}`,
      onClick: () => navigateTo(`/medistats/pays/${c.iso3}`),
    }
  }),
)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <h1 class="mb-1.5 text-2xl font-bold text-slate-900 md:text-[26px]">Maladies &amp; santé mondiale</h1>
    <p class="mb-1.5 max-w-xl text-[14.5px] text-slate-500">
      Indicateurs de santé publique par pays, croisés avec les maladies suivies.
    </p>
    <p class="mb-6 font-mono text-xs text-slate-400">Source : GHO OData API (who.int/data/gho)</p>

    <AppSectionTabs
      :tabs="[
        { label: 'Vue Maladies', to: '/medistats/maladies', active: false },
        { label: 'Vue Pays', to: '/medistats/pays', active: true },
      ]"
    />

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">Indicateur affiché sur la carte</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in options"
          :key="opt.key"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold"
          :class="
            indicator === opt.key
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
              : 'border-slate-200 bg-white text-slate-900'
          "
          @click="indicator = opt.key as IndicatorKey"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="py-16 text-center text-[14px] text-slate-400">Chargement…</p>
    <p v-else-if="error" class="py-16 text-center text-[14px] text-slate-400">{{ error }}</p>
    <template v-else>
      <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <AppWorldScatterMap :points="mapPoints" :height="380" />
        <div class="mt-3 flex items-center justify-between text-[11.5px] text-slate-500">
          <span>{{ activeIndicator?.label }} — taille &amp; intensité du point proportionnelles à la valeur</span>
          <span class="mono">min {{ minValue }}{{ activeIndicator?.unit }} · max {{ maxValue }}{{ activeIndicator?.unit }}</span>
        </div>
      </div>

      <div class="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--color-primary)]/20 bg-white px-5 py-3.5">
        <svg width="17" height="17" viewBox="0 0 24 24" class="shrink-0" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="var(--color-primary)" stroke-width="2.2" fill="none" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        <input
          v-model="countryQuery"
          type="text"
          autocomplete="off"
          placeholder="Filtrer les pays par nom ou code ISO…"
          class="flex-1 border-none bg-transparent text-[14.5px] text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <NuxtLink
          v-for="c in filteredCountries"
          :key="c.iso3"
          :to="`/medistats/pays/${c.iso3}`"
          class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
        >
          <div class="flex items-center justify-between gap-2.5">
            <div class="flex min-w-0 items-center gap-2.5">
              <span
                class="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-base"
                aria-hidden="true"
              >
                {{ isoToFlagEmoji(c.iso2) }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-[13.5px] font-bold text-slate-900">{{ c.name }}</p>
                <p class="truncate text-[11px] text-slate-400">{{ c.region }} · {{ formatCompactNumber(c.population) }} hab.</p>
              </div>
            </div>
            <span class="mono shrink-0 rounded-lg bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-bold text-[var(--color-primary)]">
              {{ c.iso3 }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg bg-slate-50 px-2.5 py-1.5">
              <p class="text-[10.5px] text-slate-400">Espérance de vie</p>
              <p class="mono text-[12.5px] font-bold text-slate-900">
                {{ c.stats.lifeExp.value !== null ? `${c.stats.lifeExp.value}${c.stats.lifeExp.unit}` : '—' }}
              </p>
            </div>
            <div class="rounded-lg bg-slate-50 px-2.5 py-1.5">
              <p class="text-[10.5px] text-slate-400">Médecins /1000 hab.</p>
              <p class="mono text-[12.5px] font-bold text-slate-900">{{ c.stats.physicians.value ?? '—' }}</p>
            </div>
          </div>

          <p v-if="c.topDisease" class="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span class="shrink-0 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
              Top {{ c.topDisease.percentile }}%
            </span>
            <span class="truncate">{{ c.topDisease.name }}</span>
          </p>
        </NuxtLink>
      </div>
      <p v-if="countriesEmpty" class="py-10 text-center text-[13.5px] text-slate-400">
        Aucun pays ne correspond à « {{ countryQuery }} ».
      </p>
    </template>
  </div>
</template>
