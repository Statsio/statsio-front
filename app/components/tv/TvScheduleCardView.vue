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
      class="flex items-stretch gap-6 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
    >
      <!-- Channel identity -->
      <RouterLink
        :to="`/tvstats/chaine/${schedule.channel.id}`"
        class="flex w-fit shrink-0 flex-col items-center justify-center gap-2"
      >
        <TvChannelLogo
          class="h-10 w-10 rounded-xl p-1.5"
          :src="schedule.logoUrl"
          :name="schedule.channel.displayName"
          :fallback-bg="schedule.channel.fallbackBg"
          :max-initials="3"
        />
        <div class="flex flex-col items-center gap-0.5 text-center">
          <span class="truncate text-[13px] font-bold text-slate-900">{{ schedule.channel.displayName }}</span>
          <span class="font-mono text-[10.5px] text-slate-400">N°{{ schedule.channel.number }}</span>
        </div>
      </RouterLink>

      <!-- Current / next cards -->
      <div v-if="current || next" class="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:gap-6">
        <template v-for="(c, i) in cards(current, next)" :key="c.programme.id">
          <div v-if="i > 0" class="hidden w-px shrink-0 self-stretch bg-slate-200 sm:block" />
          <TvProgrammeCard
            :programme="c.programme"
            :slot-label="c.slotLabel"
            :highlight-slot="c.highlightSlot"
          />
        </template>
      </div>
      <p v-else class="flex flex-1 items-center text-sm text-slate-400">Programme non disponible pour cette chaîne.</p>
    </div>
  </div>
</template>
