import { TNT_CHANNELS } from '@/data/tnt-channels'
import type { TvProgramme, ChannelSchedule } from '@/types/tv-schedule'

const EPG_URL = 'https://epg.pw/xmltv/epg_FR.xml.gz'
const TZ = 'Europe/Paris'

// Module-level cache: keyed by date string to auto-invalidate at midnight
let _cache: { date: string; doc: Document } | null = null

function parseXmltvTime(raw: string): Date {
  // Format: "20260622185000 +0000" → ISO "2026-06-22T18:50:00+00:00"
  const s = raw.trim()
  const y = s.slice(0, 4)
  const mo = s.slice(4, 6)
  const d = s.slice(6, 8)
  const h = s.slice(8, 10)
  const mi = s.slice(10, 12)
  const sec = s.slice(12, 14)
  const tz = s.slice(15) // "+0000"
  const tzFormatted = tz.length === 5 ? `${tz.slice(0, 3)}:${tz.slice(3)}` : '+00:00'
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${sec}${tzFormatted}`)
}

function localDateStr(date: Date): string {
  // Returns "YYYY-MM-DD" in Europe/Paris timezone
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(date)
}

function localTimeStr(date: Date): string {
  // Returns "HH:MM" in Europe/Paris timezone
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
    hour12: false,
  }).format(date)
}

function localMinutes(date: Date): number {
  const t = localTimeStr(date)
  const parts = t.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

export async function fetchEpgData(): Promise<Document> {
  const today = localDateStr(new Date())
  if (_cache?.date === today) return _cache.doc

  const res = await fetch(EPG_URL)
  if (!res.ok) throw new Error(`EPG fetch failed: ${res.status}`)

  if (!res.body) throw new Error('EPG response has no body')

  const ds = new DecompressionStream('gzip')
  const decompressed = res.body.pipeThrough(ds)
  const text = await new Response(decompressed).text()

  const doc = new DOMParser().parseFromString(text, 'text/xml')
  _cache = { date: today, doc }
  return doc
}

export function buildChannelSchedules(doc: Document, targetDate: string): ChannelSchedule[] {
  const now = new Date()

  return TNT_CHANNELS.map((channel) => {
    if (!channel.epgChannelId) {
      return { channel, programmes: [], logoUrl: channel.logoUrl }
    }

    const programmeEls = doc.querySelectorAll(`programme[channel="${channel.epgChannelId}"]`)
    const programmes: TvProgramme[] = []
    let idx = 0

    programmeEls.forEach((el) => {
      const startRaw = el.getAttribute('start')
      const stopRaw = el.getAttribute('stop')
      if (!startRaw || !stopRaw) return

      const startDate = parseXmltvTime(startRaw)
      const stopDate = parseXmltvTime(stopRaw)

      // Filter by the target date in local French time
      if (localDateStr(startDate) !== targetDate) return

      const startTime = localTimeStr(startDate)
      const endTime = localTimeStr(stopDate)
      const startMinutes = localMinutes(startDate)
      const durationMinutes = Math.max(1, Math.round((stopDate.getTime() - startDate.getTime()) / 60_000))

      const title = el.querySelector('title')?.textContent?.trim() ?? 'Programme'
      const desc = el.querySelector('desc')?.textContent?.trim() || null
      const category = el.querySelector('category')?.textContent?.trim()

      const isLive = now >= startDate && now < stopDate

      programmes.push({
        id: idx++,
        title,
        startTime,
        endTime,
        startMinutes,
        durationMinutes,
        genres: category ? [category] : [],
        type: category ?? 'Programme',
        summary: desc,
        imageUrl: null,
        rating: null,
        isLive,
      })
    })

    programmes.sort((a, b) => a.startMinutes - b.startMinutes)

    return { channel, programmes, logoUrl: channel.logoUrl }
  })
}
