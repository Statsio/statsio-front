<script setup lang="ts">
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { MaladiePopulaire } from '@/types/maladies'

defineProps<{
  title: string
  items: MaladiePopulaire[]
  /** Valeur mise en avant à droite de chaque ligne (déjà formatée). */
  metric: (m: MaladiePopulaire) => string
  /** Couleur du chiffre mis en avant (ex. rouge pour une hausse, vert pour une baisse). */
  metricClass?: (m: MaladiePopulaire) => string
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5">
    <p class="mb-3.5 text-sm font-bold text-slate-900">{{ title }}</p>
    <p v-if="!items.length" class="py-6 text-center text-[13px] text-slate-400">Pas assez de données.</p>
    <NuxtLink
      v-for="(m, i) in items"
      :key="m.id"
      :to="`/medistats/maladies/${m.id}`"
      class="flex items-center gap-3 border-t border-slate-100 py-2.5 first:border-t-0"
    >
      <span class="mono w-5 shrink-0 text-[11px] font-bold text-slate-400">{{ i + 1 }}</span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[13.5px] font-bold text-slate-900">{{ m.name }}</p>
        <p v-if="m.category" class="truncate text-[10.5px] text-slate-400">{{ m.category }}</p>
      </div>
      <AppSparkline v-if="m.trend.length > 1" :points="m.trend.map((p) => p.value)" :height="24" class="w-16 shrink-0" />
      <span class="mono w-16 shrink-0 text-right text-[13px] font-bold" :class="metricClass?.(m) ?? 'text-slate-900'">
        {{ metric(m) }}
      </span>
    </NuxtLink>
  </div>
</template>
