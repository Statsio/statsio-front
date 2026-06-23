<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  headline: string
  subtitle: string
  bullets: string[]
  kpis: { label: string; value: string }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div class="space-y-6">
        <span class="badge mono">DATA STORYTELLING</span>
        <h1 class="text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
          <span class="text-gradient">{{ headline }}</span>
        </h1>
        <p class="text-lg text-slate-600">
          {{ subtitle }}
        </p>
        <div class="grid gap-3 text-sm text-slate-600">
          <div v-for="bullet in bullets" :key="bullet" class="flex items-center gap-3">
            <span
              class="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              ✓
            </span>
            <span>{{ bullet }}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <AppButton variant="primary" size="lg">Lancer ma première analyse</AppButton>
          <AppButton variant="secondary" size="lg">Explorer les tendances</AppButton>
        </div>
        <div class="flex flex-wrap gap-8 pt-4">
          <div v-for="kpi in kpis" :key="kpi.label">
            <p class="text-2xl font-semibold text-slate-900">{{ kpi.value }}</p>
            <p class="eyebrow">{{ kpi.label }}</p>
          </div>
        </div>
      </div>

      <div class="relative">
        <div class="panel rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="eyebrow">Desk live</p>
              <p class="text-2xl font-semibold text-slate-900">Indice de confiance</p>
            </div>
            <span
              class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
              >+8.4%</span
            >
          </div>
          <div class="mt-6 grid gap-3">
            <div class="h-2 w-full rounded-full bg-slate-100">
              <div class="h-2 w-[68%] rounded-full bg-[var(--color-primary)]"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>État</span>
              <span class="mono">68/100</span>
            </div>
          </div>
          <div class="mt-6 grid gap-4">
            <div class="panel-muted rounded-2xl p-4">
              <p class="text-sm font-semibold text-slate-800">Santé publique</p>
              <p class="text-xs text-slate-500">Synthèse automatique + sources</p>
              <div class="mt-3 flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                <p class="text-xs text-slate-500">Actualisé il y a 2h</p>
              </div>
            </div>
            <div class="panel-muted rounded-2xl p-4">
              <p class="text-sm font-semibold text-slate-800">Inflation locale</p>
              <p class="text-xs text-slate-500">23 villes • 7 indicateurs</p>
              <div class="mt-3 flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-blue-500"></span>
                <p class="text-xs text-slate-500">Sync API active</p>
              </div>
            </div>
          </div>
        </div>
        <div
          class="absolute -right-6 -top-8 hidden rounded-2xl border border-primary/20 bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-lg lg:block"
        >
          +120 sources connectées
        </div>
      </div>
    </div>
  </section>
</template>
