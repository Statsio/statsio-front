<script setup lang="ts">
import { useNowNext } from '@/composables/useNowNext'
import type { ChannelSchedule, TvProgramme } from '@/types/tv-schedule'

const props = defineProps<{
  schedules: ChannelSchedule[]
  referenceMinutes: number
  currentLabel: string
}>()

const { rows } = useNowNext(() => props.schedules, () => props.referenceMinutes)

function cards(current: TvProgramme | null, next: TvProgramme | null) {
  const list: { programme: TvProgramme; slotLabel: string; highlightSlot: boolean }[] = []
  if (current) list.push({ programme: current, slotLabel: props.currentLabel, highlightSlot: true })
  if (next) list.push({ programme: next, slotLabel: 'Ensuite', highlightSlot: false })
  return list
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div
      v-for="{ schedule, current, next } in rows"
      :key="schedule.channel.id"
      class="flex items-stretch gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
    >
      <!-- Channel identity -->
      <RouterLink
        :to="`/tvstats/chaine/${schedule.channel.id}`"
        class="flex w-[92px] shrink-0 flex-col items-start justify-center gap-2"
      >
        <TvChannelLogo
          class="h-10 w-10 rounded-xl p-1.5"
          :src="schedule.logoUrl"
          :name="schedule.channel.displayName"
          :fallback-bg="schedule.channel.fallbackBg"
          :max-initials="3"
        />
        <span class="truncate text-[13px] font-bold text-slate-900">{{ schedule.channel.displayName }}</span>
      </RouterLink>

      <!-- Current / next cards -->
      <div v-if="current || next" class="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row">
        <TvProgrammeCard
          v-for="c in cards(current, next)"
          :key="c.programme.id"
          :programme="c.programme"
          :slot-label="c.slotLabel"
          :highlight-slot="c.highlightSlot"
        />
      </div>
      <p v-else class="flex flex-1 items-center text-sm text-slate-400">Programme non disponible pour cette chaîne.</p>
    </div>
  </div>
</template>
