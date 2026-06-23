<script setup lang="ts">
import { computed, ref } from 'vue'
import TvScheduleProgrammeBlock from './TvScheduleProgrammeBlock.vue'
import type { ChannelSchedule, TimeWindow } from '@/types/tv-schedule'

const props = defineProps<{
  schedule: ChannelSchedule
  timeWindow: TimeWindow
  pxPerMin: number
  rowHeight: number
}>()

const logoFailed = ref(false)

// Only render programmes that overlap the visible window
const visibleProgrammes = computed(() =>
  props.schedule.programmes.filter((p) => {
    const end = p.startMinutes + p.durationMinutes
    return end > props.timeWindow.startMinutes && p.startMinutes < props.timeWindow.endMinutes
  }),
)

const totalWidth = computed(
  () => (props.timeWindow.endMinutes - props.timeWindow.startMinutes) * props.pxPerMin,
)

const channelInitials = computed(() => {
  return props.schedule.channel.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
})
</script>

<template>
  <div class="flex border-b border-slate-100">
    <!-- Channel logo column (sticky left) -->
    <div
      class="sticky left-0 z-10 flex w-20 shrink-0 items-center justify-center border-r border-slate-100 bg-white"
      :style="{ height: rowHeight + 'px' }"
    >
      <div class="flex flex-col items-center gap-1">
        <div class="flex h-11 w-15 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1.5">
          <img
            v-if="schedule.logoUrl && !logoFailed"
            :src="schedule.logoUrl"
            :alt="schedule.channel.displayName"
            class="h-full w-full object-contain"
            loading="lazy"
            @error="logoFailed = true"
          />
          <span
            v-else
            class="text-[10px] font-bold text-white w-full h-full flex items-center justify-center rounded-lg"
            :class="schedule.channel.fallbackBg"
          >
            {{ channelInitials }}
          </span>
        </div>
        <span class="text-[9px] font-semibold text-slate-400">{{ schedule.channel.number }}</span>
      </div>
    </div>

    <!-- Programme blocks area -->
    <div class="relative" :style="{ width: totalWidth + 'px', height: rowHeight + 'px' }">
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
