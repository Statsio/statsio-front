<script setup lang="ts">
defineProps<{
  items: {
    type: string
    title: string
    context: string
    detail: string
    tone: 'primary' | 'accent' | 'secondary'
  }[]
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Historique</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Vues récentes sur les articles, StatsData et sondages</h2>
      </div>
      <p class="text-sm text-slate-500">Chronologie compacte, multi-format, prête à être branchée à une vraie API.</p>
    </div>

    <div class="mt-6 grid gap-4">
      <article
        v-for="item in items"
        :key="`${item.type}-${item.title}`"
        class="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[110px_minmax(0,1fr)_180px]"
      >
        <div class="flex items-start">
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            :class="
              item.tone === 'primary'
                ? 'bg-violet-100 text-violet-700'
                : item.tone === 'accent'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-amber-100 text-amber-700'
            "
          >
            {{ item.type }}
          </span>
        </div>

        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-slate-950">{{ item.title }}</h3>
          <p class="text-sm leading-6 text-slate-600">{{ item.detail }}</p>
        </div>

        <div class="flex items-center lg:justify-end">
          <p class="text-sm font-semibold text-slate-500">{{ item.context }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
