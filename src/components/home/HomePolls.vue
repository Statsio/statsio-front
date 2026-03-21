<script setup lang="ts">
defineProps<{
  items: {
    title: string
    window: string
    candidates: { name: string; score: string }[]
  }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">Sondages</p>
          <h2 class="text-3xl font-semibold text-slate-900">
            Intentions de vote et baromètres interactifs
          </h2>
        </div>
        <button class="btn-primary">Lancer un sondage</button>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.title"
          class="panel rounded-3xl p-6"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="eyebrow">{{ item.window }}</p>
              <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ item.title }}</h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Live</span>
          </div>
          <div class="mt-6 grid gap-3">
            <div
              v-for="candidate in item.candidates"
              :key="candidate.name"
              class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <div
                  class="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-secondary)] text-sm font-semibold text-slate-700"
                >
                  {{ candidate.name.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ candidate.name }}</p>
                  <p class="text-xs text-slate-500">Échantillon 12k</p>
                </div>
              </div>
              <span class="text-sm font-semibold text-slate-800">{{ candidate.score }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
