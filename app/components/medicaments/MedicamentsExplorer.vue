<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { POPULAR_MEDICAMENTS, useMedicaments } from '@/composables/useMedicaments'
import MedicamentsCard from '@/components/medicaments/MedicamentsCard.vue'
import AppRankingList, { type RankingItem } from '@/components/ui/AppRankingList.vue'
import { fetchMedicamentImage, fetchMedicamentsSearch, fetchMedicamentsTopVentes } from '@/api/medicaments'
import { extractMedicamentBrandName } from '@/utils/medicaments'
import { formatCompactNumber } from '@/utils/number'
import type { Medicament, TopVenteMedicament } from '@/types/medicaments'

const { query, results, isLoading, error, hasQuery, suggestionsEmpty } = useMedicaments()

const popularMedicaments = ref<Medicament[]>([])
const isLoadingPopular = ref(true)

onMounted(async () => {
  try {
    const matches = await Promise.all(
      POPULAR_MEDICAMENTS.map(async (name) => {
        try {
          const found = await fetchMedicamentsSearch(name)
          return found[0] ?? null
        } catch {
          return null
        }
      }),
    )
    popularMedicaments.value = matches.filter((m): m is Medicament => m !== null)
  } finally {
    isLoadingPopular.value = false
  }
})

const topVentes = ref<TopVenteMedicament[]>([])
const isLoadingTopVentes = ref(true)
/** cip13 -> URL d'image (ou null si aucune trouvée) — résolues en parallèle, best-effort. */
const topVentesImages = ref<Record<string, string | null>>({})

onMounted(async () => {
  try {
    topVentes.value = await fetchMedicamentsTopVentes()
  } catch {
    topVentes.value = []
  } finally {
    isLoadingTopVentes.value = false
  }

  await Promise.all(
    topVentes.value.map(async (m) => {
      if (!m.label) return
      try {
        topVentesImages.value[m.cip13] = await fetchMedicamentImage(extractMedicamentBrandName(m.label))
      } catch {
        topVentesImages.value[m.cip13] = null
      }
    }),
  )
})

const topVentesItems = computed<RankingItem[]>(() =>
  topVentes.value.map((m) => ({
    key: m.cip13,
    to: m.cis ? `/medistats/medicaments/${m.cis}` : undefined,
    label: m.label ?? m.cip13,
    value: m.boxes,
    valueLabel: formatCompactNumber(m.boxes),
    leading: '💊',
    imageUrl: topVentesImages.value[m.cip13],
  })),
)
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
            :medicament="(m as Medicament)"
            variant="row"
          />
          <p v-if="suggestionsEmpty" class="p-5 text-center text-[13.5px] text-slate-400">
            Aucun médicament ne correspond à « {{ query }} ».
          </p>
        </template>
      </div>
    </div>

    <p class="mb-3.5 text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">Recherches fréquentes</p>
    <div class="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <p v-if="isLoadingPopular" class="col-span-full py-6 text-center text-[13.5px] text-slate-400">Chargement…</p>
      <MedicamentsCard v-for="m in popularMedicaments" :key="m.cis" :medicament="m" variant="grid" />
    </div>

    <div v-if="isLoadingTopVentes || topVentesItems.length" class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <p class="mb-1 text-sm font-bold text-slate-900">Médicaments les plus vendus</p>
      <p class="mb-4 text-xs text-slate-400">Nombre de boîtes délivrées — source : Open Medic (Assurance Maladie)</p>
      <p v-if="isLoadingTopVentes" class="py-4 text-center text-[13.5px] text-slate-400">Chargement…</p>
      <AppRankingList v-else :items="topVentesItems" />
    </div>
  </div>
</template>
