import type { ChannelKind, ChannelPace } from '@/types/channel-catalog'

/** Pastille + libellé du type de chaîne (aligné sur la maquette Chaînes Listing v2). */
export const CHANNEL_KIND_STYLE: Record<ChannelKind, { label: string; fg: string; bg: string }> = {
  redaction: { label: 'RÉDACTION', fg: '#7c3aed', bg: '#f2ecfd' },
  institution: { label: 'INSTITUTION', fg: '#2563eb', bg: '#eaf1fe' },
  independant: { label: 'INDÉPENDANT', fg: '#047857', bg: '#e7f7f0' },
}

export const CHANNEL_KIND_ICON: Record<ChannelKind, string> = {
  redaction: '⌗',
  institution: '⌂',
  independant: '☺',
}

/** Rythme de publication dérivé côté API (fenêtre 30 j). */
export const CHANNEL_PACE_STYLE: Record<ChannelPace, { label: string; short: string; fg: string; dot: string }> = {
  jour: { label: 'PUBLIE CHAQUE JOUR', short: 'Quotidien', fg: '#047857', dot: '#059669' },
  semaine: { label: 'PUBLIE CHAQUE SEMAINE', short: 'Hebdo', fg: '#2563eb', dot: '#3b82f6' },
  mois: { label: 'PUBLIE CHAQUE MOIS', short: 'Mensuel', fg: 'rgba(24,24,31,0.5)', dot: 'rgba(24,24,31,0.3)' },
}

export function channelKindLabel(kind: ChannelKind): string {
  return CHANNEL_KIND_STYLE[kind]?.label ?? String(kind).toUpperCase()
}

/** Icône du panneau « Dernières parutions » de la chaîne du mois. */
export function channelPostIcon(type: string): string {
  if (type === 'statsdata') return '▤'
  if (type === 'survey' || type === 'poll') return '⚡'
  return '✎'
}

export function channelPostKindLabel(type: string): string {
  if (type === 'statsdata') return 'Statsdata'
  if (type === 'survey' || type === 'poll') return 'Sondage'
  return 'Article'
}
