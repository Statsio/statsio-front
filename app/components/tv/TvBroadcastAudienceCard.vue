<script setup lang="ts">
import type { BroadcastDetail } from '@/api/tv-broadcast'

defineProps<{
  audience: BroadcastDetail['audience']
  isPast: boolean
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {{ isPast ? 'Audience' : 'Intentions' }}
    </h2>

    <div class="space-y-3">
      <!-- Viewers / Will watch -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">{{ isPast ? 'Ont regardé' : 'Vont regarder' }}</span>
        <span class="font-mono text-base font-bold text-slate-900">
          {{ (isPast ? audience.viewers : audience.willWatch).toLocaleString('fr-FR') }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">{{ isPast ? 'Prévoient de revoir' : 'Ont déjà vu' }}</span>
        <span class="font-mono text-base font-bold text-slate-900">
          {{ (isPast ? audience.willWatch : audience.viewers).toLocaleString('fr-FR') }}
        </span>
      </div>

      <!-- Médiamétrie -->
      <template v-if="audience.mediametrieViewers">
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Médiamétrie</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Spectateurs</span>
            <span class="font-mono text-base font-bold text-slate-900">
              {{ (audience.mediametrieViewers / 1_000_000).toFixed(1) }}M
            </span>
          </div>
          <div v-if="audience.pda" class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Part d'audience</span>
            <span class="font-mono text-base font-bold text-slate-900">{{ audience.pda }}%</span>
          </div>
          <div v-if="audience.rank" class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Classement</span>
            <span class="font-mono text-base font-bold text-slate-900">#{{ audience.rank }}</span>
          </div>
        </div>
      </template>
      <template v-else-if="audience.pda">
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Part d'audience</span>
            <span class="font-mono text-base font-bold text-slate-900">{{ audience.pda }}%</span>
          </div>
          <div v-if="audience.rank" class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Classement</span>
            <span class="font-mono text-base font-bold text-slate-900">#{{ audience.rank }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
