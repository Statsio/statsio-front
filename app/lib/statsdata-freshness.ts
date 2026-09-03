/**
 * Badge de fraîcheur d'une source de données sur la page publique StatsData.
 * Dérive un libellé lisible à partir de la date de dernier rafraîchissement et de
 * la fréquence déclarée sur la source (`refresh_frequency`).
 */

export interface DatasetFreshness {
  is_live?: boolean
  last_refreshed_at?: string | null
  next_refresh_at?: string | null
  refresh_frequency?: string | null
}

export type FreshnessTone = 'live' | 'fresh' | 'stale' | 'unknown'

export interface FreshnessLabel {
  /** Texte court, ex. « Mis à jour il y a 3 j ». */
  text: string
  /** Complément optionnel, ex. « rafraîchi chaque jour ». */
  detail?: string
  tone: FreshnessTone
}

const FREQUENCY_LABEL: Record<string, string> = {
  hourly: 'chaque heure',
  daily: 'chaque jour',
  weekly: 'chaque semaine',
  monthly: 'chaque mois',
  yearly: 'chaque année',
}

/** Écart lisible entre `iso` et maintenant (« il y a 3 j », « à l'instant »). */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = now.getTime() - then
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `il y a ${days} j`
  const months = Math.round(days / 30)
  if (months < 12) return `il y a ${months} mois`
  return `il y a ${Math.round(months / 12)} an${months >= 24 ? 's' : ''}`
}

export function freshnessLabel(
  dataset: DatasetFreshness,
  now: Date = new Date(),
): FreshnessLabel | null {
  if (dataset.is_live) {
    return { text: 'Données en direct', tone: 'live' }
  }

  const iso = dataset.last_refreshed_at
  if (!iso) return null

  const age = relativeAge(iso, now)
  if (!age) return null

  const freqKey = dataset.refresh_frequency ?? ''
  const detail = FREQUENCY_LABEL[freqKey] ? `rafraîchi ${FREQUENCY_LABEL[freqKey]}` : undefined

  // « Périmé » = plus de deux fois l'intervalle de rafraîchissement écoulé.
  const ageMs = now.getTime() - new Date(iso).getTime()
  const windowMs: Record<string, number> = {
    hourly: 2 * 36e5,
    daily: 2 * 864e5,
    weekly: 14 * 864e5,
    monthly: 62 * 864e5,
    yearly: 740 * 864e5,
  }
  const tone: FreshnessTone =
    windowMs[freqKey] && ageMs > windowMs[freqKey] ? 'stale' : 'fresh'

  return { text: `Mis à jour ${age}`, detail, tone }
}

/** Choisit la source la plus « parlante » d'un lot pour un badge unique (live > la plus fraîche). */
export function primaryFreshness(
  datasets: DatasetFreshness[],
  now: Date = new Date(),
): FreshnessLabel | null {
  if (datasets.some((d) => d.is_live)) return { text: 'Données en direct', tone: 'live' }
  const dated = datasets
    .filter((d) => d.last_refreshed_at)
    .sort((a, b) => new Date(b.last_refreshed_at!).getTime() - new Date(a.last_refreshed_at!).getTime())
  return dated.length ? freshnessLabel(dated[0]!, now) : null
}
