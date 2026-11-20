import type { ChannelKind } from '@/types/channel-catalog'

/** Pastille + libellé du type de chaîne (accueil). Le listing des chaînes utilise `lib/channels-listing.ts`. */
export const CHANNEL_KIND_STYLE: Record<ChannelKind, { label: string; fg: string; bg: string }> = {
  redaction: { label: 'RÉDACTION', fg: '#7c3aed', bg: '#f2ecfd' },
  institution: { label: 'INSTITUTION', fg: '#2563eb', bg: '#eaf1fe' },
  independant: { label: 'INDÉPENDANT', fg: '#047857', bg: '#e7f7f0' },
}
