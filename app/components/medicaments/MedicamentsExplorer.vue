<script setup lang="ts">
import { POPULAR_MEDICAMENTS, useMedicaments } from '@/composables/useMedicaments'
import MedicamentsCard from '@/components/medicaments/MedicamentsCard.vue'

const { query, results, isLoading, error, hasQuery, suggestionsEmpty, searchPopular } = useMedicaments()
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-24 pt-10 md:px-8 md:pt-12">
    <h1 class="mb-1.5 text-2xl font-bold text-slate-900 md:text-[26px]">Médicaments</h1>
    <p class="mb-7 max-w-xl text-[14.5px] text-slate-500">
      Consultez la composition, les présentations, le prix et les conditions de prescription des
      médicaments référencés dans la base publique des médicaments (BDPM).
    </p>

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
          placeholder="Rechercher un médicament : Doliprane, Amoxicilline, Levothyrox…"
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
          <MedicamentsCard
            v-for="m in results.slice(0, 6)"
            :key="m.cis"
            :medicament="m"
            variant="row"
          />
          <p v-if="suggestionsEmpty" class="p-5 text-center text-[13.5px] text-slate-400">
            Aucun médicament ne correspond à « {{ query }} ».
          </p>
        </template>
      </div>
    </div>

    <p class="mb-3.5 text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">Recherches fréquentes</p>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        v-for="name in POPULAR_MEDICAMENTS"
        :key="name"
        type="button"
        class="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-[14px] font-semibold text-slate-800 transition hover:border-[var(--color-primary)]/30 hover:shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        @click="searchPopular(name)"
      >
        {{ name }}
      </button>
    </div>
  </div>
</template>
