export function formatStatsDataDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const ISO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Reformats raw dataset values for display: ISO datetimes/dates become
 * "DD/MM/YYYY HHhMM:SS" / "DD/MM/YYYY" (string components are reused as-is,
 * no timezone conversion, since the source value's clock time must stay intact).
 * Non-date values pass through unchanged.
 */
export function formatDisplayValue(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return String(value)

  const dt = value.match(ISO_DATETIME_RE)
  if (dt) {
    const [, y, mo, d, h, mi, s] = dt
    return `${d}/${mo}/${y} ${h}h${mi}:${s ?? '00'}`
  }
  const dateOnly = value.match(ISO_DATE_RE)
  if (dateOnly) {
    const [, y, mo, d] = dateOnly
    return `${d}/${mo}/${y}`
  }
  return value
}

export function formatRowCount(n?: number): string | null {
  if (!n) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M lignes`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k lignes`
  return `${n} lignes`
}

export function relativeUpdate(iso?: string): string | null {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "maj aujourd'hui"
  if (days === 1) return 'maj il y a 1j'
  if (days < 30) return `maj il y a ${days}j`
  return `maj il y a ${Math.floor(days / 30)} mois`
}
