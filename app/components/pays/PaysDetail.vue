<script setup lang="ts">
import { computed } from 'vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { PaysDetail } from '@/types/pays'

const props = defineProps<{
  pays: PaysDetail
}>()

const trendPoints = computed(() => props.pays.lifeExpectancyTrend?.trend.map((p) => p.value) ?? [])
const trendLabels = computed(() => props.pays.lifeExpectancyTrend?.trend.map((p) => p.year) ?? [])
</script>

<template>
  <div>
    <NuxtLink
      to="/medistats/pays"
      class="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--color-primary)]"
    >
      ← Retour à la carte
    </NuxtLink>

    <div class="mb-1.5 flex flex-wrap items-center gap-3">
      <h1 class="text-[26px] font-bold text-slate-900 md:text-[28px]">{{ pays.name }}</h1>
      <span class="mono rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-primary)]">
        {{ pays.iso3 }}
      </span>
    </div>
    <p class="mb-6 text-[13px] text-slate-500">{{ pays.region }} · GHO OData — géographie, temps, valeurs</p>

    <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div v-for="tile in pays.tiles" :key="tile.key" class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-2 text-[11.5px] text-slate-500">{{ tile.label }}</p>
        <p v-if="tile.value !== null" class="mono text-[19px] font-semibold text-slate-900">{{ tile.value }}{{ tile.unit }}</p>
        <p v-else class="text-[13px] text-slate-400">Non disponible</p>
        <p class="mt-1 text-[11px] text-slate-400">{{ tile.source }} · {{ tile.year ?? '—' }}</p>
      </div>
    </div>

    <div v-if="pays.lifeExpectancyTrend" class="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-4 text-sm font-bold text-slate-900">Espérance de vie — évolution (GHO)</p>
      <AppSparkline v-if="trendPoints.length > 1" :points="trendPoints" :labels="trendLabels" :height="70" unit=" ans" show-axis />
    </div>

    <div v-if="pays.topDiseases.length" class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-1 text-sm font-bold text-slate-900">Principales causes de morbidité (ICD-11 × GHO)</p>
      <p class="mb-4 text-xs text-slate-400">Classées par centile de rang mondial — cliquez pour ouvrir la fiche maladie</p>
      <NuxtLink
        v-for="td in pays.topDiseases"
        :key="td.id"
        :to="`/medistats/maladies/${td.id}`"
        class="flex items-center gap-3.5 border-t border-slate-100 py-3 first:border-t-0"
      >
        <span class="flex-1 truncate text-[14px] font-bold text-slate-900">{{ td.name }}</span>
        <span v-if="td.code" class="mono shrink-0 text-[12px] text-slate-400">ICD-11 {{ td.code }}</span>
        <span class="mono shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          #{{ td.rank }} / {{ td.total }}
        </span>
      </NuxtLink>
    </div>
    <p v-else class="text-[13.5px] text-slate-400">
      Aucune maladie suivie n'a de données OMS pour ce pays.
    </p>
  </div>
</template>
