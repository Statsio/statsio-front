<script setup lang="ts">
import { computed } from 'vue'
import { formatEuros } from '@/lib/format'
import type { GenericGroup, Medicament } from '@/types/medicaments'

const props = defineProps<{
  medicament: Medicament
  generiques: readonly GenericGroup[]
  isLoadingGeneriques: boolean
}>()

const dci = computed(() => props.medicament.composition[0]?.denominationSubstance ?? '—')

const presentations = computed(() => props.medicament.presentation ?? [])

const referencePresentation = computed(() => {
  const priced = presentations.value.filter((p) => p.prix > 0)
  if (priced.length === 0) return presentations.value[0] ?? null
  return [...priced].sort((a, b) => a.prix - b.prix)[0] ?? null
})

const conditions = computed(() => props.medicament.conditions ?? [])
</script>

<template>
  <div>
    <NuxtLink
      to="/medistats/medicaments"
      class="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--color-primary)]"
    >
      ← Retour à la recherche
    </NuxtLink>

    <div class="mb-1.5 flex flex-wrap items-start justify-between gap-6">
      <div>
        <div class="mb-1.5 flex flex-wrap items-center gap-3">
          <h1 class="text-[26px] font-bold text-slate-900 md:text-[28px]">{{ medicament.elementPharmaceutique }}</h1>
          <span class="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11.5px] font-bold text-[var(--color-primary)]">
            {{ medicament.formePharmaceutique }}
          </span>
        </div>
        <p class="text-sm text-slate-500">
          {{ dci }} · {{ medicament.titulaire }}
          <span v-if="medicament.voiesAdministration.length"> · {{ medicament.voiesAdministration.join(', ') }}</span>
        </p>
      </div>
    </div>

    <div class="my-7 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-2 text-[11.5px] text-slate-500">Prix public</p>
        <p class="mono text-[21px] font-semibold text-slate-900">
          {{ referencePresentation && referencePresentation.prix > 0 ? formatEuros(referencePresentation.prix) : '—' }}
        </p>
        <p class="mt-1 text-[11.5px] text-slate-400">{{ referencePresentation?.libelle ?? 'Présentation non renseignée' }}</p>
      </div>
      <div class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-2 text-[11.5px] text-slate-500">Remboursement</p>
        <p class="mono text-[21px] font-semibold text-slate-900">
          {{ referencePresentation?.tauxRemboursement || '—' }}
        </p>
        <p class="mt-1 text-[11.5px] text-slate-400">Sécurité sociale</p>
      </div>
      <div class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-2 text-[11.5px] text-slate-500">Commercialisation</p>
        <p class="text-[15.5px] font-semibold text-slate-900">{{ medicament.etatComercialisation }}</p>
        <p class="mt-1 text-[11.5px] text-slate-400">Statut actuel</p>
      </div>
      <div class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-2 text-[11.5px] text-slate-500">Date d'AMM</p>
        <p class="mono text-[21px] font-semibold text-slate-900">{{ medicament.dateAMM }}</p>
        <p class="mt-1 text-[11.5px] text-slate-400">Autorisation de mise sur le marché</p>
      </div>
    </div>

    <div class="mb-5 grid gap-5 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-3.5 text-sm font-bold text-slate-900">Composition</p>
        <div
          v-for="(c, i) in medicament.composition"
          :key="i"
          class="mb-2.5 flex items-start gap-2.5 text-[13.5px] text-slate-600 last:mb-0"
        >
          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
          <span><strong class="font-semibold text-slate-800">{{ c.denominationSubstance }}</strong> — {{ c.dosage }}</span>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <p class="mb-3.5 text-sm font-bold text-slate-900">Présentations</p>
        <div v-if="presentations.length === 0" class="text-[13.5px] text-slate-400">Aucune présentation renseignée.</div>
        <div
          v-for="p in presentations"
          :key="p.cip13"
          class="mb-2.5 flex items-start justify-between gap-3 text-[13.5px] text-slate-600 last:mb-0"
        >
          <span>{{ p.libelle }}</span>
          <span class="mono shrink-0 font-semibold text-slate-800">{{ p.prix > 0 ? formatEuros(p.prix) : '—' }}</span>
        </div>
      </div>
    </div>

    <div v-if="conditions.length" class="mb-5 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-medistats-soft)] p-6">
      <div class="mb-3 flex items-center gap-2">
        <span class="text-[15px]">⚠</span>
        <p class="text-sm font-bold text-[var(--color-medistats-dark)]">Conditions de prescription</p>
      </div>
      <p v-for="(c, i) in conditions" :key="i" class="mb-2 text-[13.5px] text-[var(--color-medistats-dark)] last:mb-0">— {{ c }}</p>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-3.5 text-sm font-bold text-slate-900">Génériques &amp; alternatives</p>
      <p v-if="isLoadingGeneriques" class="text-[13.5px] text-slate-400">Recherche des alternatives…</p>
      <p v-else-if="generiques.length === 0" class="text-[13.5px] text-slate-400">
        Aucune alternative référencée pour ce médicament.
      </p>
      <div v-else class="flex flex-wrap gap-2.5">
        <span
          v-for="alt in generiques.flatMap((g) => g.medicaments)"
          :key="alt.cis"
          class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700"
        >
          {{ alt.elementPharmaceutique }}
        </span>
      </div>
    </div>
  </div>
</template>
