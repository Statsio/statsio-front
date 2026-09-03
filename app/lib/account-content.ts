import { CONTENT_TYPE_META, publicContentPath } from '@/lib/content-display'
import { resolveChannelColors, channelBannerStyle } from '@/lib/channel-brand'
import { getNameInitials } from '@/lib/format'
import type { AccountContentSummary } from '@/types/account'

export interface DisplayAccountContent {
  id: string
  title: string
  type: AccountContentSummary['type']
  typeLabel: string
  typeColor: string
  typeBg: string
  /** Chemin public du contenu, ou null si pas de slug (brouillon). */
  publicPath: string | null
  ownerLabel: string
  ownerInitials: string
  ownerLogoUrl: string | null
  ownerBg: string
  ownerShape: 'circle' | 'square'
  thumbnailUrl: string | null
}

/** Transforme un résumé de contenu API en propriétés d'affichage (couleurs, chemin, avatar). */
export function toDisplayAccountContent(c: AccountContentSummary): DisplayAccountContent {
  const meta = CONTENT_TYPE_META[c.type] ?? CONTENT_TYPE_META.statsdata

  let ownerLabel: string
  let ownerInitials: string
  let ownerLogoUrl: string | null = null
  let ownerBg: string
  let ownerShape: 'circle' | 'square'

  if (c.channel) {
    const colors = resolveChannelColors(
      String(c.channel.id),
      c.channel.custom_color_primary,
      c.channel.custom_color_secondary,
    )
    ownerLabel = c.channel.name ?? 'Chaîne'
    ownerInitials = getNameInitials(c.channel.name ?? 'Chaîne')
    ownerLogoUrl = c.channel.logo_url
    ownerBg = channelBannerStyle(colors.primary, colors.secondary).background
    ownerShape = 'square'
  } else {
    ownerLabel = c.author?.name ?? 'Anonyme'
    ownerInitials = getNameInitials(c.author?.name ?? '?')
    ownerBg = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
    ownerShape = 'circle'
  }

  return {
    id: c.id,
    title: c.title,
    type: c.type,
    typeLabel: meta.label,
    typeColor: meta.color,
    typeBg: meta.bg,
    publicPath: c.slug ? publicContentPath(c.type, c.slug) : null,
    ownerLabel,
    ownerInitials,
    ownerLogoUrl,
    ownerBg,
    ownerShape,
    thumbnailUrl: c.thumbnail_url,
  }
}
