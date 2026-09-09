<script setup lang="ts">
import type { OfferComparisonRow } from '@/types/offer'

defineProps<{
  rows: OfferComparisonRow[]
}>()
</script>

<template>
  <div class="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
    <div class="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-slate-100 px-7 py-5 sm:grid-cols-[1fr_140px_140px] sm:gap-0">
      <div class="text-[14px] font-extrabold text-slate-950">Comparer les fonctionnalités</div>
      <div class="text-center text-[12px] font-extrabold uppercase tracking-[0.04em] text-slate-400">Freemium</div>
      <div class="text-center text-[12px] font-extrabold uppercase tracking-[0.04em] text-[var(--color-primary)]">
        Premium
      </div>
    </div>

    <div
      v-for="row in rows"
      :key="row.id"
      class="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-slate-100 px-7 py-4 last:border-b-0 sm:grid-cols-[1fr_140px_140px] sm:gap-0"
    >
      <div>
        <div class="text-[13.5px] font-bold text-slate-950">{{ row.label }}</div>
        <div v-if="row.hint" class="mt-0.5 text-[12px] text-slate-400">{{ row.hint }}</div>
      </div>
      <div class="text-center font-mono text-[12.5px] font-semibold text-slate-500">{{ row.freeValue }}</div>
      <div class="text-center font-mono text-[12.5px] font-semibold text-[var(--color-primary)]">
        {{ row.premiumValue }}
      </div>
    </div>
  </div>
</template>
