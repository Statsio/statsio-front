import type { RefreshFrequency } from '@/api/data-sources'

/**
 * Fréquences de resynchronisation proposées dans le wizard de source (étape
 * « Synchronisation » pour data.gouv.fr, sélecteur inline pour les API REST).
 * `none` = « Jamais » : la source reste figée à l'import, rien n'est affiché
 * sur les cartes de listing.
 */
export const REFRESH_FREQUENCY_OPTIONS: { v: RefreshFrequency; l: string }[] = [
  { v: 'hourly', l: 'Toutes les heures' },
  { v: 'daily', l: 'Journalière' },
  { v: 'weekly', l: 'Hebdomadaire' },
  { v: 'monthly', l: 'Mensuelle' },
  { v: 'yearly', l: 'Annuelle' },
  { v: 'none', l: 'Jamais' },
]

export function refreshFrequencyLabel(value: RefreshFrequency | string | null | undefined): string {
  return REFRESH_FREQUENCY_OPTIONS.find((o) => o.v === value)?.l ?? 'Jamais'
}
