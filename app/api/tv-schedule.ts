import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import type { ChannelSchedule, TvProgramme, TvProgrammeMention, TvProgrammeScore } from '@/types/tv-schedule'

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
  mention: TvProgrammeMention | null
  score: TvProgrammeScore | null
}

type EpgChannelEntry = {
  channelId: string
  programmes: EpgProgramme[]
}

type DbChannel = {
  slug: string
  logo_url: string | null
}

// Module-level cache so channels are fetched once per session
let dbChannelCache: Map<string, string> | null = null

async function getDbLogoMap(): Promise<Map<string, string>> {
  if (dbChannelCache) return dbChannelCache

  try {
    const { data } = await apiHttp.get<DbChannel[]>('/tv/channels')
    dbChannelCache = new Map(
      data
        .filter((ch: DbChannel) => ch.logo_url !== null)
        .map((ch: DbChannel) => [ch.slug, ch.logo_url as string]),
    )
  } catch {
    dbChannelCache = new Map()
  }

  return dbChannelCache
}

export async function fetchChannelSchedules(date: string): Promise<ChannelSchedule[]> {
  const [{ data: entries }, logoMap] = await Promise.all([
    apiHttp.get<EpgChannelEntry[]>(STATSIO_API.tv.epg(date)),
    getDbLogoMap(),
  ])

  return buildChannelSchedules(entries, logoMap)
}

// Allow external callers (e.g. TvBroadcastView) to invalidate the cache after an admin logo upload
export function invalidateDbChannelCache() {
  dbChannelCache = null
}

function buildChannelSchedules(entries: EpgChannelEntry[], logoMap: Map<string, string>): ChannelSchedule[] {
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
      mention: p.mention ?? null,
      score: p.score ?? null,
    }))

    // DB logo_url takes priority over the static CDN URL
    const logoUrl = logoMap.get(channel.id) ?? channel.logoUrl

    return { channel, programmes, logoUrl }
  })
}

function isCurrentlyLive(startMinutes: number, durationMinutes: number, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= startMinutes && nowMin < startMinutes + durationMinutes
}
