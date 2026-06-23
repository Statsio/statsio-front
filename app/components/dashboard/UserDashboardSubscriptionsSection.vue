<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  subscriptions: {
    name: string
    status: string
    detail: string
    accent: 'emerald' | 'sky' | 'violet'
  }[]
}>()
</script>

<template>
  <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Abonnements</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Vos accès actifs</h2>
      </div>
      <RouterLink to="/register" class="text-sm font-semibold text-primary transition hover:text-accent">
        Gérer plus tard
      </RouterLink>
    </div>

    <div class="mt-5 grid gap-4">
      <article
        v-for="item in subscriptions"
        :key="item.name"
        class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-2">
            <p class="text-lg font-semibold text-slate-950">{{ item.name }}</p>
            <p class="text-sm leading-6 text-slate-600">{{ item.detail }}</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="
              item.accent === 'emerald'
                ? 'bg-emerald-100 text-emerald-700'
                : item.accent === 'sky'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-violet-100 text-violet-700'
            "
          >
            {{ item.status }}
          </span>
        </div>
      </article>
    </div>
  </article>
</template>
