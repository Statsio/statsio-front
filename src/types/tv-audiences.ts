export type ChannelYearData = {
  channelId: string
  year: number
  pda: number        // part d'audience en %
  millions: number | null
}

export type Top50Record = {
  rank: number
  channelId: string
  channelName: string
  programme: string
  date: string       // 'YYYY-MM-DD'
  audience: number   // en millions
  pda: number
  category: 'sport' | 'fiction' | 'info' | 'divertissement' | 'film'
}

export type AudienceApiResponse = {
  years: number[]
  channelYearData: ChannelYearData[]
  top50: Top50Record[]
}

export type AudienceSortKey = 'pda' | 'millions'
export type Top50Category = 'all' | 'sport' | 'fiction' | 'info' | 'divertissement' | 'film'
