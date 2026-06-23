<script setup lang="ts">
import AppAvatar from '@/components/ui/AppAvatar.vue'

defineProps<{
  initials: string
  displayName: string
  email?: string
  userId?: number
  birthday?: string
  badges: string[]
}>()
</script>

<template>
  <section
    class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-[0_34px_90px_-56px_rgba(15,23,42,0.7)]">
    <div
      class="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.26),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.28),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-8">
      <div class="flex items-start justify-between gap-4">
        <AppAvatar :initials="initials" size="lg" />
        <span
          class="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
          Connecté
        </span>
      </div>

      <div class="mt-6 space-y-2">
        <h2 class="text-2xl font-semibold">{{ displayName }}</h2>
        <p class="text-sm text-slate-300">{{ email }}</p>
        <p class="text-sm text-slate-400">Membre #{{ userId ?? '...' }} · Né le {{ birthday ?? 'n/a' }}</p>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <span v-for="badge in badges" :key="badge"
          class="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-100">
          {{ badge }}
        </span>
      </div>
    </div>
  </section>
</template>
