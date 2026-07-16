import type { TntChannel } from '@/data/tnt-channels'

export type TvProgrammeMention = 'inedit' | 'rediffusion' | 'direct' | 'replay' | 'exclusivite'

export type TvProgrammeScore = {
  type: 'viewers' | 'want'
  value: number
}

export type TvProgramme = {
  id: number
  broadcastId: number | null   // DB broadcast ID — null if not yet stored
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
  mention: TvProgrammeMention | null
  score: TvProgrammeScore | null
}

export type ChannelSchedule = {
  channel: TntChannel
  programmes: TvProgramme[]
  logoUrl: string | null
}

export type TimePreset = 'live' | 'tonight' | 'tomorrow' | 'weekend' | 'custom'

export type TimeWindow = {
  startMinutes: number
  endMinutes: number
  label: string
}
