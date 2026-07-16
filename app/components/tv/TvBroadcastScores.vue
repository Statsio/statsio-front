<script setup lang="ts">
import type { BroadcastScoreSummary } from '@/api/tv-broadcast'

defineProps<{
  scores: BroadcastScoreSummary[]
}>()
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
    <h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Scores téléspectateurs</h2>
    <div class="space-y-3">
      <div v-for="s in scores" :key="s.questionId" class="flex items-center gap-3">
        <p class="flex-1 min-w-0 text-sm text-slate-700 truncate" :title="s.label">{{ s.label }}</p>
        <div class="flex items-center gap-2 shrink-0">
          <div class="flex gap-0.5">
            <svg
              v-for="i in 5"
              :key="i"
              class="h-3.5 w-3.5"
              :class="i <= Math.round(s.avgScore) ? 'fill-tvstats-primary' : 'fill-slate-200'"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span class="font-mono text-sm font-bold text-slate-900 w-6 text-right">{{ s.avgScore }}</span>
          <span class="text-xs text-slate-400">({{ s.voteCount }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
