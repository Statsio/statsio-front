<script setup lang="ts">
/**
 * « Répartition des vues » par source de trafic. La donnée n'est pas encore
 * exposée par l'API stats — la carte affiche une maquette grisée en attendant
 * (`getChannelStats` devra renvoyer un `views.breakdown`).
 */
const PLACEHOLDER = [
  { label: 'Recherche & IA', pct: 46 },
  { label: 'Abonnés Statsio', pct: 33 },
  { label: 'Partages externes', pct: 21 },
]
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm font-bold text-slate-950">Répartition des vues</p>
      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400">
        Bientôt
      </span>
    </div>

    <div class="mt-4 flex flex-col gap-3.5" aria-hidden="true">
      <div v-for="row in PLACEHOLDER" :key="row.label">
        <div class="mb-1.5 flex justify-between text-[12.5px] font-semibold text-slate-300">
          <span>{{ row.label }}</span>
          <span class="font-mono">{{ row.pct }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded bg-slate-100">
          <span class="block h-full rounded bg-slate-200" :style="{ width: `${row.pct}%` }" />
        </div>
      </div>
    </div>

    <p class="mt-4 text-[11.5px] text-slate-400">
      L'origine du trafic sera disponible dès que le suivi des sources de vues sera activé.
    </p>
  </div>
</template>
