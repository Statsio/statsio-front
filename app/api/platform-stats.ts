import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { PlatformStats } from '@/types/platform-stats'

interface RawPlatformStats {
  statsdata?: number
  articles?: number
  surveys?: number
  published_total?: number
  datasets?: number
  channels?: number
  contributors?: number
  last_published_at?: string | null
}

export const EMPTY_PLATFORM_STATS: PlatformStats = {
  statsdata: 0,
  articles: 0,
  surveys: 0,
  publishedTotal: 0,
  datasets: 0,
  channels: 0,
  contributors: 0,
  lastPublishedAt: null,
}

function mapStats(raw: RawPlatformStats): PlatformStats {
  return {
    statsdata: raw.statsdata ?? 0,
    articles: raw.articles ?? 0,
    surveys: raw.surveys ?? 0,
    publishedTotal: raw.published_total ?? 0,
    datasets: raw.datasets ?? 0,
    channels: raw.channels ?? 0,
    contributors: raw.contributors ?? 0,
    lastPublishedAt: raw.last_published_at ?? null,
  }
}

/** Chiffres publics de la plateforme (endpoint public, cache serveur). */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await publicHttp.get<{ success: boolean; data: RawPlatformStats }>(
    STATSIO_API.publicStats,
  )
  return mapStats(data.data ?? {})
}
