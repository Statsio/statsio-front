import type { ChannelOrganization } from '@/api/channels'
import type { ChannelKind } from '@/types/channel-catalog'

export type ChannelTone = 'primary' | 'accent' | 'secondary'

export type ChannelEntry = {
  slug: string
  name: string
  handle: string
  initials: string
  kind: ChannelKind
  badges: string[]
  organization?: ChannelOrganization | null
  description: string
  longDescription: string
  themes: string[]
  subscriptions: number
  followers: number
  articles: string[]
  statsData: string[]
  polls: string[]
  tone: ChannelTone
  hasPaidSubscription: boolean
  subscriptionPrice?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  createdAt?: string
  country?: string | null
  viewCount?: number
  customColorPrimary?: string | null
  customColorSecondary?: string | null
}
