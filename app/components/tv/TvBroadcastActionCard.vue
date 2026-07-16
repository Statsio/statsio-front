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
  toggle: [type: 'will_watch']
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
        <!-- Already reviewed: disabled confirmation state -->
        <button
          v-if="broadcast.userHasReviewed"
          disabled
          class="w-full cursor-default rounded-2xl border border-tvstats-primary/30 bg-tvstats-soft/20 px-4 py-3 text-sm font-bold text-tvstats-primary"
        >
          ✓ Vous avez donné votre avis
        </button>
        <!-- Not reviewed yet: single CTA opens the review modal directly (marks watched + review together) -->
        <button
          v-else
          class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          @click="$emit('review')"
        >
          J'ai déjà vu ce programme
        </button>
      </template>
      <template v-else>
        <!-- Future: "Je vais regarder" toggle -->
        <button
          class="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
          :class="broadcast.userViewType === 'will_watch'
            ? 'border border-tvstats-primary bg-tvstats-soft/20 text-tvstats-primary'
            : 'border border-slate-200 text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'"
          :disabled="isToggling"
          @click="$emit('toggle', 'will_watch')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ broadcast.userViewType === 'will_watch' ? '✓ Je vais regarder' : 'Je vais regarder' }}
        </button>
      </template>
      <p v-if="!isAuthenticated" class="mt-2 text-center text-xs text-slate-400">
        <RouterLink to="/login" class="underline hover:text-slate-600">Connectez-vous</RouterLink> pour enregistrer.
      </p>
    </div>
  </div>
</template>
