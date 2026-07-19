<script setup lang="ts">
import { useMaladies } from '@/composables/useMaladies'
import MaladiesCard from '@/components/maladies/MaladiesCard.vue'
import MaladiesRankedList from '@/components/maladies/MaladiesRankedList.vue'
import AppSectionTabs from '@/components/ui/AppSectionTabs.vue'
import { getMedistatsTabs } from '@/data/medistats-nav-tabs'

const {
  query,
  results,
  isLoading,
  error,
  hasQuery,
  suggestionsEmpty,
  popularLoading,
  topByCases,
  topByIncrease,
  topByDecrease,
} = useMaladies()

const formatCases = (m: { value: number | null }) => (m.value !== null ? m.value.toLocaleString('fr-FR') : '—')
const formatEvolution = (m: { evolutionPercent: number | null }) =>
  m.evolutionPercent !== null ? `${m.evolutionPercent > 0 ? '+' : ''}${m.evolutionPercent}%` : '—'
const evolutionClass = (m: { evolutionPercent: number | null }) =>
  (m.evolutionPercent ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <h1 class="mb-1.5 text-2xl font-bold text-slate-900 md:text-[26px]">Maladies &amp; santé mondiale</h1>
    <p class="mb-1.5 max-w-xl text-[14.5px] text-slate-500">
      Classifications, définitions et statistiques épidémiologiques mondiales, croisées par maladie et par pays.
    </p>
    <p class="mb-6 font-mono text-xs text-slate-400">
      Sources : ICD-API (icd.who.int) — classification · GHO OData API (who.int/data/gho) — statistiques
    </p>

    <AppSectionTabs :tabs="getMedistatsTabs('maladies')" />

    <div class="relative mb-9">
      <div class="flex items-center gap-3 rounded-2xl border border-[var(--color-primary)]/20 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
        <svg width="19" height="19" viewBox="0 0 24 24" class="shrink-0" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="var(--color-primary)" stroke-width="2.2" fill="none" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        <input
          v-model="query"
          type="text"
          autocomplete="off"
          placeholder="Rechercher une maladie : diabète, tuberculose, VIH…"
          class="flex-1 border-none bg-transparent text-[15.5px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          v-if="hasQuery"
          type="button"
          class="flex h-5.5 w-5.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-[13px] text-slate-500"
          aria-label="Effacer la recherche"
          @click="query = ''"
        >
          ✕
        </button>
      </div>

      <div
        v-if="hasQuery"
        class="absolute top-[calc(100%+8px)] left-0 z-30 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(20,20,30,0.14)]"
      >
        <p v-if="isLoading" class="p-5 text-center text-[13.5px] text-slate-400">Recherche…</p>
        <p v-else-if="error" class="p-5 text-center text-[13.5px] text-slate-400">{{ error }}</p>
        <template v-else>
          <MaladiesCard v-for="m in results.slice(0, 6)" :key="m.id" :maladie="m" />
          <p v-if="suggestionsEmpty" class="p-5 text-center text-[13.5px] text-slate-400">
            Aucune maladie ne correspond à « {{ query }} ».
          </p>
        </template>
      </div>
    </div>

    <p class="mb-3.5 text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">Maladies suivies (GHO)</p>
    <p v-if="popularLoading" class="py-10 text-center text-[14px] text-slate-400">Chargement…</p>
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MaladiesRankedList
        title="Le plus de cas"
        :items="topByCases"
        :metric="formatCases"
      />
      <MaladiesRankedList
        title="En plus forte hausse"
        :items="topByIncrease"
        :metric="formatEvolution"
        :metric-class="evolutionClass"
      />
      <MaladiesRankedList
        title="En plus forte baisse"
        :items="topByDecrease"
        :metric="formatEvolution"
        :metric-class="evolutionClass"
      />
    </div>
  </div>
</template>
