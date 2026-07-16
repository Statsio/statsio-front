import { computed } from 'vue'
import type { ChannelSchedule, TvProgramme } from '@/types/tv-schedule'

export type NowNext = { schedule: ChannelSchedule; current: TvProgramme | null; next: TvProgramme | null }

function getNowNext(programmes: TvProgramme[], referenceMinutes: number): Omit<NowNext, 'schedule'> {
  const currentIdx = programmes.findIndex(
    (p) => p.startMinutes <= referenceMinutes && referenceMinutes < p.startMinutes + p.durationMinutes,
  )
  if (currentIdx !== -1) {
    return { current: programmes[currentIdx]!, next: programmes[currentIdx + 1] ?? null }
  }

  // No programme spans the reference time: find the closest upcoming one
  const nextIdx = programmes.findIndex((p) => p.startMinutes > referenceMinutes)
  return { current: null, next: nextIdx !== -1 ? programmes[nextIdx]! : null }
}

/** For each channel schedule, resolve the programme "on air" and the one following it at a given reference minute. */
export function useNowNext(schedules: () => ChannelSchedule[], referenceMinutes: () => number) {
  const rows = computed<NowNext[]>(() =>
    schedules().map((schedule) => ({ schedule, ...getNowNext(schedule.programmes, referenceMinutes()) })),
  )

  return { rows }
}
