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
            <div
              v-for="i in 5"
              :key="i"
              class="h-2 w-2 rounded-full transition-colors"
              :class="i <= Math.round(s.avgScore) ? 'bg-tvstats-primary' : 'bg-slate-200'"
            />
          </div>
          <span class="text-sm font-bold text-slate-900 w-6 text-right">{{ s.avgScore }}</span>
          <span class="text-xs text-slate-400">({{ s.voteCount }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
