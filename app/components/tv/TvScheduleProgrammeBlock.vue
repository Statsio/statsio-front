<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { categoryBorderClass } from '@/lib/tv-category-colors'
import type { TvProgramme, TimeWindow } from '@/types/tv-schedule'

const router = useRouter()

const props = defineProps<{
  programme: TvProgramme
  timeWindow: TimeWindow
  pxPerMin: number
}>()

const leftPx = computed(() => {
  const start = Math.max(props.programme.startMinutes, props.timeWindow.startMinutes)
  return (start - props.timeWindow.startMinutes) * props.pxPerMin
})

const widthPx = computed(() => {
  const start = Math.max(props.programme.startMinutes, props.timeWindow.startMinutes)
  const end = Math.min(
    props.programme.startMinutes + props.programme.durationMinutes,
    props.timeWindow.endMinutes,
  )
  return Math.max(120, (end - start) * props.pxPerMin)
})

const genreLabel = computed(() => props.programme.genres[0] ?? props.programme.type)
const isDirect = computed(() => props.programme.mention === 'direct')

function goToDetail() {
  if (props.programme.broadcastId != null) {
    router.push(`/tvstats/emission/${props.programme.broadcastId}`)
  }
}
</script>

<template>
  <div
    class="absolute top-1 bottom-1 flex flex-col justify-between overflow-hidden rounded-lg border-l-[3px] bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
    :class="[
      categoryBorderClass(genreLabel),
      programme.isLive ? 'bg-tvstats-soft/50' : 'bg-white',
      programme.broadcastId != null ? 'cursor-pointer' : '',
    ]"
    :style="{ left: leftPx + 'px', width: widthPx + 'px' }"
    :title="programme.summary ?? programme.title"
    @click="goToDetail"
  >
    <div class="min-w-0">
      <p class="flex items-center gap-1 truncate text-[10px] font-semibold tracking-[0.1em] text-tvstats-primary">
        <span v-if="isDirect" class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
        {{ programme.startTime }}
        <span v-if="programme.isLive" class="ml-1 rounded-full bg-tvstats-primary px-1.5 py-0.5 text-[9px] text-white">
          LIVE
        </span>
      </p>
      <p class="mt-0.5 truncate text-xs font-semibold text-slate-900">{{ programme.title }}</p>
    </div>
    <div class="flex items-center gap-1.5">
      <span
        v-if="genreLabel"
        class="truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500"
      >
        {{ genreLabel }}
      </span>
      <span class="ml-auto shrink-0 text-[9px] text-slate-400">{{ programme.durationMinutes }}min</span>
    </div>
  </div>
</template>
