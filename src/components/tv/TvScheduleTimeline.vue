<script setup lang="ts">
import { computed } from 'vue'
import type { TimeWindow } from '@/types/tv-schedule'

const props = defineProps<{
  timeWindow: TimeWindow
  now: Date
  pxPerMin: number
}>()

const ticks = computed(() => {
  const result: { label: string; leftPx: number }[] = []
  const { startMinutes, endMinutes } = props.timeWindow
  // Round up to next 30-min mark
  const firstTick = Math.ceil(startMinutes / 30) * 30
  for (let min = firstTick; min < endMinutes; min += 30) {
    const h = Math.floor(min / 60) % 24
    const m = min % 60
    result.push({
      label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      leftPx: (min - startMinutes) * props.pxPerMin,
    })
  }
  return result
})

const nowMinutes = computed(() => props.now.getHours() * 60 + props.now.getMinutes())

const nowCursorLeft = computed(() => {
  const { startMinutes, endMinutes } = props.timeWindow
  if (nowMinutes.value < startMinutes || nowMinutes.value > endMinutes) return null
  return (nowMinutes.value - startMinutes) * props.pxPerMin
})

const totalWidth = computed(() => (props.timeWindow.endMinutes - props.timeWindow.startMinutes) * props.pxPerMin)
</script>

<template>
  <div
    class="relative h-8 flex-shrink-0 border-b border-slate-200 bg-slate-50"
    :style="{ width: totalWidth + 'px' }"
  >
    <div
      v-for="tick in ticks"
      :key="tick.label"
      class="absolute top-0 flex h-full items-center"
      :style="{ left: tick.leftPx + 'px' }"
    >
      <div class="h-full w-px bg-slate-200" />
      <span class="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {{ tick.label }}
      </span>
    </div>

    <div
      v-if="nowCursorLeft !== null"
      class="absolute top-0 z-10 h-full w-0.5 bg-red-500"
      :style="{ left: nowCursorLeft + 'px' }"
    />
  </div>
</template>
