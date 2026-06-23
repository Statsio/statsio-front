<script setup lang="ts">
defineProps<{
  stats: {
    label: string
    value: string
  }[]
}>()
</script>

<template>
  <article class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.55)]">
    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Usage récent</p>
    <div class="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      <div v-for="stat in stats" :key="stat.label" class="rounded-[1.5rem] bg-white/8 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ stat.label }}</p>
        <p class="mt-2 text-3xl font-semibold">{{ stat.value }}</p>
      </div>
    </div>
  </article>
</template>
