import type { ContentType } from '@/types/content-creation'

export const CONTENT_TYPE_META: Record<ContentType, { label: string; color: string; bg: string }> = {
  statsdata: { label: 'StatsData', color: '#8b5cf6', bg: '#f2ecfd' },
  article: { label: 'Article', color: '#3b82f6', bg: '#eaf1fe' },
  survey: { label: 'Sondage', color: '#e11d48', bg: '#fdeef1' },
}

export interface ContentStatusMeta {
  label: string
  bg: string
  color: string
  live: boolean
}

export function getStatusMeta(status?: string | null): ContentStatusMeta {
  if (status === 'published') {
    return { label: 'Publié', bg: 'rgba(16,185,129,0.14)', color: '#10b981', live: true }
  }
  return { label: 'Brouillon', bg: 'rgba(24,24,31,0.08)', color: 'rgba(24,24,31,0.55)', live: false }
}

export function publicContentPath(type: ContentType, slug: string, basePath = ''): string {
  if (type === 'survey') return `${basePath}/sondages/${slug}`
  if (type === 'article') return `${basePath}/articles/${slug}`
  return `${basePath}/statsdata/${slug}`
}

export function publicContentListPath(type: ContentType, basePath = ''): string {
  if (type === 'survey') return `${basePath}/sondages`
  if (type === 'article') return `${basePath}/articles`
  return `${basePath}/statsdata`
}

/**
 * Dashboard « Propriétés du contenu » — chemin unifié indépendant du type
 * (`/contenu/{slug}/proprietes`). Le paramètre `type` n'est plus utilisé mais
 * est conservé pour la compatibilité des appelants.
 */
export function contentPropertiesPath(_type: ContentType, slug: string | null | undefined): string | null {
  if (!slug) return null
  return `/contenu/${slug}/proprietes`
}

/** A StatsData document opens on its first page when it has one, else on the document itself. */
export function statsDataDetailPath(
  doc: { id: string; slug?: string; pages?: { id: string; slug?: string }[] },
  basePath = '',
): string {
  if (!doc.slug) return `${basePath}/statsdata/${doc.id}`
  const first = doc.pages?.[0]
  return first ? `${basePath}/statsdata/${doc.slug}/${first.slug ?? first.id}` : `${basePath}/statsdata/${doc.slug}`
}
