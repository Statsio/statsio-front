import type { FeaturedContent } from '@/api/channels'

export type ChannelTone = 'primary' | 'accent' | 'secondary'

export type ChannelEntry = {
  slug: string
  name: string
  handle: string
  initials: string
  isOfficial: boolean
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
  ageRestriction?: number
  createdAt?: string
  country?: string | null
  viewCount?: number
  customColorPrimary?: string | null
  customColorSecondary?: string | null
  featured?: FeaturedContent | null
}
