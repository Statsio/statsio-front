<script setup lang="ts">
defineProps<{
  completion: number
  items: {
    label: string
    done: boolean
  }[]
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profil</p>
        <h3 class="mt-2 text-xl font-semibold text-slate-950">Complétude</h3>
      </div>
      <p class="text-3xl font-semibold text-slate-950">{{ completion }}%</p>
    </div>

    <div class="mt-5 h-3 rounded-full bg-slate-100">
      <div
        class="h-3 rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#3b82f6_45%,#8b5cf6_100%)]"
        :style="{ width: `${completion}%` }"
      />
    </div>

    <div class="mt-5 grid gap-3">
      <div
        v-for="item in items"
        :key="item.label"
        class="flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3"
      >
        <span class="text-sm font-medium text-slate-700">{{ item.label }}</span>
        <span
          class="rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
        >
          {{ item.done ? 'OK' : 'À faire' }}
        </span>
      </div>
    </div>
  </section>
</template>
