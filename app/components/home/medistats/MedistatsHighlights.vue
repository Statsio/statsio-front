<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import { medistatsHighlights } from '@/data/brands/medistats/highlights'
</script>

<template>
  <section class="bg-slate-50">
    <div class="container py-20">
      <AppSectionHeader eyebrow="À la une" title="Ce qui compte en ce moment" />

      <div class="mt-10 grid gap-5 sm:grid-cols-3">
        <RouterLink
          v-for="item in medistatsHighlights"
          :key="item.title"
          :to="item.to"
          class="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-[var(--color-primary)]/30 hover:shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            {{ item.eyebrow }}
          </p>
          <h3 class="mt-3 text-lg font-bold text-slate-900">{{ item.title }}</h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{{ item.description }}</p>
          <div class="mt-5 flex items-end justify-between">
            <div>
              <p class="text-2xl font-bold tabular-nums text-slate-900">{{ item.statValue }}</p>
              <p class="text-xs text-slate-400">{{ item.statLabel }}</p>
            </div>
            <span class="text-sm font-semibold text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">→</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
