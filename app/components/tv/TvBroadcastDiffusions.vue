<script setup lang="ts">
import { fmtScheduleDate } from '@/composables/useBroadcastDetail'
import { BROADCAST_TYPE_LABELS } from '@/lib/tv-category-colors'
import type { ProgrammeSchedule } from '@/api/tv-broadcast'

defineProps<{
  schedule: ProgrammeSchedule
  dbLogoMap: Map<string, string>
}>()
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
    <!-- Upcoming -->
    <div v-if="schedule.upcoming.length > 0" class="mb-5">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Prochaines diffusions</h2>
      <div class="space-y-2">
        <RouterLink
          v-for="b in schedule.upcoming"
          :key="b.id"
          :to="`/tvstats/emission/${b.id}`"
          class="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <img v-if="dbLogoMap.get(b.channelId)" :src="dbLogoMap.get(b.channelId)" class="h-full object-contain" :alt="b.channelId" />
            <span v-else class="text-[9px] font-bold uppercase text-slate-400">{{ b.channelId }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-800">{{ fmtScheduleDate(b.startAt) }}</p>
            <p class="text-xs text-slate-500">{{ b.startTime }}–{{ b.endTime }}</p>
          </div>
          <span
            v-if="b.broadcastType"
            class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            :class="BROADCAST_TYPE_LABELS[b.broadcastType]?.class ?? 'bg-slate-100 text-slate-600 border-slate-200'"
          >
            {{ BROADCAST_TYPE_LABELS[b.broadcastType]?.label ?? b.broadcastType }}
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Past -->
    <div v-if="schedule.past.length > 0">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Diffusions passées</h2>
      <div class="space-y-2">
        <RouterLink
          v-for="b in schedule.past"
          :key="b.id"
          :to="`/tvstats/emission/${b.id}`"
          class="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <img v-if="dbLogoMap.get(b.channelId)" :src="dbLogoMap.get(b.channelId)" class="h-full object-contain" :alt="b.channelId" />
            <span v-else class="text-[9px] font-bold uppercase text-slate-400">{{ b.channelId }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-700">{{ fmtScheduleDate(b.startAt) }}</p>
            <p class="text-xs text-slate-500">{{ b.startTime }}–{{ b.endTime }}</p>
          </div>
          <span v-if="b.viewers > 0" class="shrink-0 text-xs text-slate-400">
            {{ b.viewers.toLocaleString('fr-FR') }} vues
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
