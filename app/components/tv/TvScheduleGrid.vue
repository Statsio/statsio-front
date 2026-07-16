<script setup lang="ts">
import { computed } from 'vue'
import TvScheduleTimeline from './TvScheduleTimeline.vue'
import TvScheduleChannelRow from './TvScheduleChannelRow.vue'
import type { ChannelSchedule, TimeWindow } from '@/types/tv-schedule'

const props = defineProps<{
  schedules: ChannelSchedule[]
  timeWindow: TimeWindow
  now: Date
}>()

const PX_PER_MIN = 3
const ROW_HEIGHT = 72
const LOGO_COL_WIDTH = 96

const totalWidth = computed(
  () => (props.timeWindow.endMinutes - props.timeWindow.startMinutes) * PX_PER_MIN + LOGO_COL_WIDTH,
)
</script>

<template>
  <div class="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <!-- Sticky header row (logo corner + timeline) -->
    <div class="sticky top-0 z-20 flex border-b border-slate-200 bg-white" :style="{ minWidth: totalWidth + 'px' }">
      <!-- Corner cell -->
      <div class="sticky left-0 z-30 w-24 shrink-0 border-r border-slate-100 bg-slate-50" style="height: 32px" />
      <!-- Timeline -->
      <TvScheduleTimeline
        :time-window="timeWindow"
        :now="now"
        :px-per-min="PX_PER_MIN"
      />
    </div>

    <!-- Channel rows -->
    <div :style="{ minWidth: totalWidth + 'px' }">
      <TvScheduleChannelRow
        v-for="schedule in schedules"
        :key="schedule.channel.id"
        :schedule="schedule"
        :time-window="timeWindow"
        :px-per-min="PX_PER_MIN"
        :row-height="ROW_HEIGHT"
        :now="now"
      />
    </div>
  </div>
</template>
