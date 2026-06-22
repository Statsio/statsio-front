<script setup lang="ts">
import { ref } from 'vue'
import { useTvAudiences, CHANNEL_CHART_COLORS } from '@/composables/useTvAudiences'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import TvAudiencesEvolutionChart from '@/components/tv/TvAudiencesEvolutionChart.vue'
import TvAudiencesRankingTable from '@/components/tv/TvAudiencesRankingTable.vue'
import TvAudiencesTop50Table from '@/components/tv/TvAudiencesTop50Table.vue'
import type { Top50Category } from '@/types/tv-audiences'

const {
  isLoading,
  error,
  years,
  selectedYear,
  visibleChannels,
  sortKey,
  top50Category,
  sortedYearData,
  chartDatasets,
  filteredTop50,
  maxPda,
  toggleChannel,
} = useTvAudiences()

const rankingLogoFailed = ref<Record<string, boolean>>({})

const TOP50_CATEGORIES: Array<{ id: Top50Category; label: string }> = [
  { id: 'all',          label: 'Tous' },
  { id: 'sport',        label: 'Sport' },
  { id: 'info',         label: 'Info' },
  { id: 'fiction',      label: 'Fiction' },
  { id: 'divertissement', label: 'Divertissement' },
  { id: 'film',         label: 'Film' },
]
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-6 px-4 py-8 lg:px-8">

    <!-- Header card -->
    <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] lg:p-8">
      <div class="mb-6">
        <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-tvstats-primary">
          Audiences &amp; tendances
        </p>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">
          Audiences TV
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Évolution des parts d'audience et palmarès des meilleures audiences des chaînes TNT françaises.
        </p>
      </div>

      <!-- Year filter -->
      <div v-if="!isLoading && !error">
        <p class="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Année</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="year in years"
            :key="year"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition"
            :class="
              selectedYear === year
                ? 'border-tvstats-primary bg-tvstats-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            "
            @click="selectedYear = year"
          >
            {{ year }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-4 animate-pulse">
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="h-80 rounded-2xl bg-slate-200" />
        <div class="h-80 rounded-2xl bg-slate-200" />
      </div>
      <div class="h-96 rounded-2xl bg-slate-200" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex flex-col items-center gap-4 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center"
    >
      <p class="text-sm font-semibold text-red-700">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Section A: Chart + Ranking -->
      <div class="grid gap-4 lg:grid-cols-2">

        <!-- Chart card -->
        <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] lg:p-6">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Parts d'audience</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-800">Évolution 2015 – 2024</p>
            </div>
          </div>

          <TvAudiencesEvolutionChart :datasets="chartDatasets" :years="years" />

          <!-- Channel toggles -->
          <div class="mt-4 flex flex-wrap gap-1.5">
            <button
              v-for="channel in TNT_CHANNELS"
              :key="channel.id"
              type="button"
              class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition"
              :class="
                visibleChannels.includes(channel.id)
                  ? 'border-transparent text-white'
                  : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
              "
              :style="visibleChannels.includes(channel.id) ? { backgroundColor: CHANNEL_CHART_COLORS[channel.id] } : {}"
              @click="toggleChannel(channel.id)"
            >
              {{ channel.displayName }}
            </button>
          </div>
        </div>

        <!-- Ranking table card -->
        <div class="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <div class="p-5 pb-0 lg:p-6 lg:pb-0">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Classement</p>
            <div class="mt-2 mb-4 flex items-center gap-2">
              <button
                type="button"
                class="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition"
                :class="sortKey === 'pda'
                  ? 'border-tvstats-primary bg-tvstats-primary text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'"
                @click="sortKey = 'pda'"
              >
                PDA %
              </button>
            </div>
          </div>
          <TvAudiencesRankingTable
            v-model:logo-failed="rankingLogoFailed"
            :data="sortedYearData"
            :year="selectedYear"
            :max-pda="maxPda"
          />
        </div>
      </div>

      <!-- Section B: Top 50 -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] lg:p-6">
        <div class="mb-5">
          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Palmarès historique</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-800">Top 50 meilleures audiences</p>
        </div>

        <!-- Category filter -->
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="cat in TOP50_CATEGORIES"
            :key="cat.id"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition"
            :class="
              top50Category === cat.id
                ? 'border-tvstats-primary bg-tvstats-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            "
            @click="top50Category = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>

        <TvAudiencesTop50Table :records="filteredTop50" />
      </div>

      <!-- Attribution footer -->
      <p class="text-center text-[11px] text-slate-400">
        Source : CNC — Centre national du cinéma et de l'image animée /
        <a href="https://www.data.gouv.fr/fr/datasets/audience-de-la-television/" target="_blank" rel="noopener" class="underline hover:text-slate-600">data.gouv.fr</a>
        — Licence Ouverte
      </p>
    </template>
  </div>
</template>
