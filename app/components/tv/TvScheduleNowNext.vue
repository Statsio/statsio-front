<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ChannelSchedule, TvProgramme } from '@/types/tv-schedule'

const props = defineProps<{
  schedules: ChannelSchedule[]
  referenceMinutes: number
  currentLabel: string
}>()

const router = useRouter()

type NowNext = { current: TvProgramme | null; next: TvProgramme | null }

function getNowNext(programmes: TvProgramme[]): NowNext {
  const ref = props.referenceMinutes

  // Find the programme that is "on" at the reference minute
  const currentIdx = programmes.findIndex(
    (p) => p.startMinutes <= ref && ref < p.startMinutes + p.durationMinutes,
  )
  if (currentIdx !== -1) {
    return { current: programmes[currentIdx]!, next: programmes[currentIdx + 1] ?? null }
  }

  // No programme spans the reference time: find the closest upcoming one
  const nextIdx = programmes.findIndex((p) => p.startMinutes > ref)
  return { current: null, next: nextIdx !== -1 ? programmes[nextIdx]! : null }
}

const rows = computed(() =>
  props.schedules.map((s: ChannelSchedule) => ({ schedule: s, ...getNowNext(s.programmes) })),
)

function go(p: TvProgramme | null) {
  if (p?.broadcastId != null) {
    router.push(`/tvstats/emission/${p.broadcastId}`)
  }
}

function durationLabel(min: number) {
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min}min`
}
</script>

<template>
  <div class="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] overflow-hidden">
    <div
      v-for="{ schedule, current, next } in rows"
      :key="schedule.channel.id"
      class="flex items-stretch border-b border-slate-100 last:border-0"
    >
      <!-- Channel identity -->
      <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 border-r border-slate-100 py-3">
        <TvChannelLogo
          class="h-10 w-13 rounded-xl p-1.5"
          :src="schedule.logoUrl"
          :name="schedule.channel.displayName"
          :fallback-bg="schedule.channel.fallbackBg"
          :max-initials="3"
        />
        <span class="text-[9px] font-semibold text-slate-400">{{ schedule.channel.number }}</span>
      </div>

      <!-- Current / Next -->
      <div class="flex min-w-0 flex-1 flex-col sm:flex-row">
        <!-- CURRENT (at reference time) -->
        <div
          class="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 sm:border-r sm:border-slate-100"
          :class="current?.broadcastId != null ? 'cursor-pointer hover:bg-slate-50' : ''"
          @click="go(current)"
        >
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            :class="current ? 'bg-tvstats-primary text-white' : 'bg-slate-100 text-slate-400'"
          >
            {{ current ? currentLabel : 'Pas de prog.' }}
          </span>
          <div v-if="current" class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-900">{{ current.title }}</p>
            <p class="text-[11px] text-slate-400">
              {{ current.startTime }} – {{ current.endTime }}
              · {{ durationLabel(current.durationMinutes) }}
              <span v-if="current.genres.length" class="text-slate-300"> · </span>
              <span v-if="current.genres.length" class="text-slate-400">{{ current.genres[0] }}</span>
            </p>
          </div>
          <p v-else class="text-sm text-slate-300">—</p>
        </div>

        <!-- NEXT -->
        <div
          class="flex min-w-0 flex-1 items-center gap-3 border-t border-slate-100 px-4 py-3 sm:border-t-0"
          :class="next?.broadcastId != null ? 'cursor-pointer hover:bg-slate-50' : ''"
          @click="go(next)"
        >
          <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
            Suivant
          </span>
          <div v-if="next" class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-700">{{ next.title }}</p>
            <p class="text-[11px] text-slate-400">
              {{ next.startTime }} – {{ next.endTime }}
              · {{ durationLabel(next.durationMinutes) }}
            </p>
          </div>
          <p v-else class="text-sm text-slate-300">—</p>
        </div>
      </div>
    </div>
  </div>
</template>
