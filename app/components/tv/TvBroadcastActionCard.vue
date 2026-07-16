<script setup lang="ts">
import { BROADCAST_TYPE_LABELS } from '@/lib/tv-category-colors'
import type { BroadcastDetail } from '@/api/tv-broadcast'

defineProps<{
  broadcast: BroadcastDetail
  isPast: boolean
  isToggling: boolean
  isAuthenticated: boolean
}>()

defineEmits<{
  toggle: [type: 'watched' | 'will_watch']
  review: []
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Broadcast type card -->
    <div v-if="broadcast.broadcastType" class="rounded-2xl border shadow-sm p-5" :class="BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.class ?? 'bg-white border-slate-200'">
      <p class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Type de diffusion</p>
      <p class="text-lg font-extrabold">{{ BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.label ?? broadcast.broadcastType }}</p>
    </div>

    <!-- Action card -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <template v-if="isPast">
        <!-- Past: "J'ai regardé" -->
        <button
          class="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
          :class="broadcast.userViewType === 'watched'
            ? 'bg-tvstats-primary text-white shadow-sm hover:bg-tvstats-dark'
            : 'border border-slate-200 text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'"
          :disabled="isToggling"
          @click="$emit('toggle', 'watched')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          {{ broadcast.userViewType === 'watched' ? 'J\'ai regardé ✓' : 'J\'ai regardé' }}
        </button>
        <!-- After watching, offer to leave review if not done -->
        <button
          v-if="broadcast.userViewType === 'watched' && !broadcast.userHasReviewed"
          class="mt-2 w-full rounded-xl border border-tvstats-primary/20 bg-tvstats-soft/20 px-3 py-2 text-xs font-semibold text-tvstats-primary hover:bg-tvstats-soft/40 transition"
          @click="$emit('review')"
        >
          Donner mon avis →
        </button>
        <p v-if="broadcast.userHasReviewed" class="mt-2 text-center text-xs text-tvstats-primary font-medium">Avis déposé ✓</p>
      </template>
      <template v-else>
        <!-- Future: "Je vais regarder" -->
        <button
          class="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
          :class="broadcast.userViewType === 'will_watch'
            ? 'bg-tvstats-primary text-white shadow-sm hover:bg-tvstats-dark'
            : 'border border-slate-200 text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'"
          :disabled="isToggling"
          @click="$emit('toggle', 'will_watch')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ broadcast.userViewType === 'will_watch' ? 'Je vais regarder ✓' : 'Je vais regarder' }}
        </button>
      </template>
      <p v-if="!isAuthenticated" class="mt-2 text-center text-xs text-slate-400">
        <RouterLink to="/login" class="underline hover:text-slate-600">Connectez-vous</RouterLink> pour enregistrer.
      </p>
    </div>
  </div>
</template>
