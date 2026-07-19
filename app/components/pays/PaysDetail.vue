<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import AppRelatedSlider, { type RelatedSliderItem } from '@/components/ui/AppRelatedSlider.vue'
import { fetchPaysList } from '@/api/pays'
import type { CountryMapPoint, PaysDetail } from '@/types/pays'
import { isoToFlagEmoji } from '@/utils/flag'

const props = defineProps<{
  pays: PaysDetail
}>()

const trendPoints = computed(() => props.pays.lifeExpectancyTrend?.trend.map((p) => p.value) ?? [])
const trendLabels = computed(() => props.pays.lifeExpectancyTrend?.trend.map((p) => p.year) ?? [])

const allCountries = ref<CountryMapPoint[]>([])
const relatedLoading = ref(true)

onMounted(async () => {
  try {
    allCountries.value = (await fetchPaysList()).countries
  } catch {
    allCountries.value = []
  } finally {
    relatedLoading.value = false
  }
})

const relatedCountries = computed<RelatedSliderItem[]>(() => {
  const byPopulation = (a: CountryMapPoint, b: CountryMapPoint) => b.population - a.population
  const others = allCountries.value.filter((c) => c.iso3 !== props.pays.iso3)
  const sameRegion = others.filter((c) => c.region === props.pays.region).sort(byPopulation)
  const rest = others.filter((c) => c.region !== props.pays.region).sort(byPopulation)
  return [...sameRegion, ...rest].slice(0, 10).map((c) => ({
    key: c.iso3,
    to: `/medistats/pays/${c.iso3}`,
    title: c.name,
    subtitle: c.region,
    meta: c.iso3,
    emoji: isoToFlagEmoji(c.iso2),
  }))
})

const activeCategoryId = ref<string | null>(props.pays.soins.categories[0]?.id ?? null)
watch(
  () => props.pays.soins.categories,
  (cats) => {
    if (!cats.some((c) => c.id === activeCategoryId.value)) {
      activeCategoryId.value = cats[0]?.id ?? null
    }
  },
)

const activeCategory = computed(() => props.pays.soins.categories.find((c) => c.id === activeCategoryId.value) ?? null)
const activeCategoryDetail = computed(() =>
  activeCategoryId.value ? props.pays.soins.byCategory[activeCategoryId.value] : null,
)
const categoryTrendPoints = computed(() => activeCategoryDetail.value?.trend?.trend.map((p) => p.value) ?? [])
const categoryTrendLabels = computed(() => activeCategoryDetail.value?.trend?.trend.map((p) => p.year) ?? [])
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
      <span class="text-[28px]" aria-hidden="true">{{ isoToFlagEmoji(pays.iso2) }}</span>
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

    <div v-if="pays.soins.categories.length" class="mt-8">
      <p class="mb-3.5 text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">Système de santé (GHO OData)</p>
      <div class="mb-5 flex flex-wrap gap-1.5">
        <button
          v-for="cat in pays.soins.categories"
          :key="cat.id"
          type="button"
          class="rounded-full border px-4 py-2 text-[13px] font-bold"
          :style="
            activeCategoryId === cat.id
              ? { background: cat.color, color: '#fff', borderColor: cat.color }
              : { background: '#fff', color: '#18181f', borderColor: 'rgba(20,20,30,0.12)' }
          "
          @click="activeCategoryId = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <div v-if="activeCategoryDetail" class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div
          v-for="m in activeCategoryDetail.metrics"
          :key="m.key"
          class="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
        >
          <p class="mb-2 text-[11.5px] text-slate-500">{{ m.label }}</p>
          <p v-if="m.value !== null" class="mono text-[19px] font-semibold text-slate-900">
            {{ m.value }}{{ m.unit ? ` ${m.unit}` : '' }}
          </p>
          <p v-else class="text-[13px] text-slate-400">Non disponible</p>
          <p class="mt-1 text-[11px] text-slate-400">{{ m.sub }}</p>
        </div>
      </div>

      <div
        v-if="activeCategoryDetail?.trend"
        class="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
      >
        <p class="mb-4 text-sm font-bold text-slate-900">{{ activeCategoryDetail.trendTitle }}</p>
        <AppSparkline
          v-if="categoryTrendPoints.length > 1"
          :points="categoryTrendPoints"
          :labels="categoryTrendLabels"
          :height="70"
          show-axis
        />
      </div>

      <div
        v-if="activeCategoryDetail?.ranking.length"
        class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
      >
        <p class="mb-1 text-sm font-bold text-slate-900">Classement — {{ activeCategory?.label }}</p>
        <p class="mb-4 text-xs text-slate-400">Cliquez un pays pour ouvrir sa fiche</p>
        <div class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="rk in activeCategoryDetail.ranking"
            :key="rk.iso3"
            :to="`/medistats/pays/${rk.iso3}`"
            class="flex items-center gap-3.5 border-t border-slate-100 py-2.5 first:border-t-0"
          >
            <span class="mono w-6 text-[11px] font-bold text-slate-400">{{ rk.rank }}</span>
            <span class="w-[150px] shrink-0 truncate text-[13.5px] font-bold text-slate-900">{{ rk.name }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded bg-slate-100">
              <div class="h-full rounded" :style="{ width: rk.barWidth, background: activeCategory?.color }" />
            </div>
            <span class="mono w-[90px] shrink-0 text-right text-[13px] font-bold text-slate-900">{{ rk.valueLabel }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <AppRelatedSlider
      title="Pays similaires"
      :items="relatedCountries"
      :loading="relatedLoading"
      empty-text="Aucun autre pays disponible pour le moment."
    />
  </div>
</template>
