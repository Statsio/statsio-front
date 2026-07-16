const compactNumberFormatter = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value)
}

const eurosFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEuros(value: number): string {
  return eurosFormatter.format(value)
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function getUserInitials(firstName?: string | null, lastName?: string | null, fallback = '?'): string {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim()
  return initials || fallback
}

export function getNameInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
