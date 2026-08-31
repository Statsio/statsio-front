import { formatCompactNumber, formatShortDate } from '@/lib/format'

export function formatCatalogViews(count: number): string {
  return `${formatCompactNumber(count).replace(/\s/g, '\u00a0')} vues`
}

export function formatCatalogItemMeta(views: number, updatedAt?: string | null): string {
  return `${formatCatalogViews(views)} · ${formatShortDate(updatedAt)}`
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min de lecture`
}

export function formatRelativePublished(iso?: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const delta = Date.now() - then
  const minutes = Math.max(0, Math.floor(delta / 60_000))
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  return formatShortDate(iso)
}

export function formatCatalogCount(n: number): string {
  return formatCompactNumber(n).replace(/\s/g, '\u00a0')
}
