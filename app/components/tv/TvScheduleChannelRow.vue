<script setup lang="ts">
import { computed } from 'vue'
import TvScheduleProgrammeBlock from './TvScheduleProgrammeBlock.vue'
import type { ChannelSchedule, TimeWindow } from '@/types/tv-schedule'

const props = defineProps<{
  schedule: ChannelSchedule
  timeWindow: TimeWindow
  pxPerMin: number
  rowHeight: number
  now: Date
}>()

const visibleProgrammes = computed(() =>
  props.schedule.programmes.filter((p: import('@/types/tv-schedule').TvProgramme) => {
    const end = p.startMinutes + p.durationMinutes
    return end > props.timeWindow.startMinutes && p.startMinutes < props.timeWindow.endMinutes
  }),
)

const totalWidth = computed(
  () => (props.timeWindow.endMinutes - props.timeWindow.startMinutes) * props.pxPerMin,
)

const nowMinutes = computed(() => props.now.getHours() * 60 + props.now.getMinutes())

const nowLineLeft = computed(() => {
  const { startMinutes, endMinutes } = props.timeWindow
  if (nowMinutes.value < startMinutes || nowMinutes.value > endMinutes) return null
  return (nowMinutes.value - startMinutes) * props.pxPerMin
})
</script>

<template>
  <div class="flex items-center gap-2.5 border-b border-slate-100 px-0 py-1.5">
    <!-- Channel identity column (sticky left) -->
    <div
      class="sticky left-0 z-10 flex w-24 shrink-0 items-center gap-1.5 bg-white pr-2"
      :style="{ height: rowHeight + 'px' }"
    >
      <TvChannelLogo
        class="h-8 w-8 shrink-0 rounded-lg p-1"
        :src="schedule.logoUrl"
        :name="schedule.channel.displayName"
        :fallback-bg="schedule.channel.fallbackBg"
        :max-initials="3"
      />
      <div class="flex min-w-0 flex-col gap-0">
        <span class="truncate text-[11px] font-bold text-slate-900">{{ schedule.channel.displayName }}</span>
        <span class="font-mono text-[9px] text-slate-400">N°{{ schedule.channel.number }}</span>
      </div>
    </div>

    <!-- Programme blocks area (channel lane) -->
    <div
      class="relative rounded-lg bg-slate-50"
      :style="{ width: totalWidth + 'px', height: rowHeight + 'px' }"
    >
      <div
        v-if="nowLineLeft !== null"
        class="absolute top-0 bottom-0 z-20 w-0.5 bg-red-500"
        :style="{ left: nowLineLeft + 'px' }"
      />

      <TvScheduleProgrammeBlock
        v-for="programme in visibleProgrammes"
        :key="programme.id"
        :programme="programme"
        :time-window="timeWindow"
        :px-per-min="pxPerMin"
      />

      <!-- Empty state when no programmes -->
      <div
        v-if="visibleProgrammes.length === 0"
        class="flex h-full items-center px-4"
      >
        <span class="text-xs text-slate-400">Programme non disponible pour cette chaîne</span>
      </div>
    </div>
  </div>
</template>
