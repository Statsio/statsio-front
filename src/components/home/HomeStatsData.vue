<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  items: {
    title: string
    scope: string
    updated: string
    metrics: string[]
  }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">StatsData</p>
          <h2 class="text-3xl font-semibold text-slate-900">Pages vivantes connectées aux APIs</h2>
        </div>
        <AppButton variant="secondary">Créer une StatsData</AppButton>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <article v-for="item in items" :key="item.title" class="panel rounded-3xl p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ item.scope }}</p>
              <h3 class="mt-2 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
            </div>
            <span
              class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {{ item.updated }}
            </span>
          </div>
          <div class="mt-6 grid gap-3">
            <div class="h-2 w-full rounded-full bg-slate-100">
              <div class="h-2 w-[72%] rounded-full bg-[var(--color-accent)]"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="metric in item.metrics"
                :key="metric"
                class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
              >
                {{ metric }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
