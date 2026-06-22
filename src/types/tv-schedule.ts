import type { TntChannel } from '@/data/tnt-channels'

export type TvProgramme = {
  id: number
  title: string
  startTime: string    // 'HH:MM' in Europe/Paris
  endTime: string      // 'HH:MM' in Europe/Paris
  startMinutes: number // minutes since midnight in Europe/Paris
  durationMinutes: number
  genres: string[]
  type: string
  summary: string | null
  imageUrl: string | null
  rating: number | null
  isLive: boolean
}

export type ChannelSchedule = {
  channel: TntChannel
  programmes: TvProgramme[]
  logoUrl: string | null
}

export type TimePreset = 'yesterday' | 'morning' | 'afternoon' | 'live' | 'tonight' | 'night' | 'tomorrow' | 'custom'

export type TimeWindow = {
  startMinutes: number
  endMinutes: number
  label: string
}
