import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import type { ChannelSchedule, TvProgramme } from '@/types/tv-schedule'

type EpgProgramme = {
  broadcastId: number | null
  title: string
  startTime: string
  endTime: string
  startMinutes: number
  durationMinutes: number
  genres: string[]
  summary: string | null
  isLive: boolean
}

type EpgChannelEntry = {
  channelId: string
  programmes: EpgProgramme[]
}

export async function fetchChannelSchedules(date: string): Promise<ChannelSchedule[]> {
  const { data } = await apiHttp.get<EpgChannelEntry[]>(STATSIO_API.tv.epg(date))
  return buildChannelSchedules(data)
}

function buildChannelSchedules(entries: EpgChannelEntry[]): ChannelSchedule[] {
  const now = new Date()
  const entryMap = new Map(entries.map((e) => [e.channelId, e.programmes]))

  return TNT_CHANNELS.map((channel) => {
    const rawProgrammes = entryMap.get(channel.id) ?? []

    const programmes: TvProgramme[] = rawProgrammes.map((p, idx) => ({
      id: idx,
      broadcastId: p.broadcastId ?? null,
      title: p.title,
      startTime: p.startTime,
      endTime: p.endTime,
      startMinutes: p.startMinutes,
      durationMinutes: p.durationMinutes,
      genres: p.genres,
      type: p.genres[0] ?? 'Programme',
      summary: p.summary,
      imageUrl: null,
      rating: null,
      isLive: p.isLive ?? isCurrentlyLive(p.startMinutes, p.durationMinutes, now),
    }))

    return { channel, programmes, logoUrl: channel.logoUrl }
  })
}

function isCurrentlyLive(startMinutes: number, durationMinutes: number, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= startMinutes && nowMin < startMinutes + durationMinutes
}
