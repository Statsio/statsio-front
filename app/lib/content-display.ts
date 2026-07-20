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

export function getStatusMeta(status?: string | null, visibility?: string | null): ContentStatusMeta {
  if (status !== 'published') {
    return { label: 'Brouillon', bg: 'rgba(24,24,31,0.08)', color: 'rgba(24,24,31,0.55)', live: false }
  }
  if (visibility === 'private') {
    return { label: 'Privé', bg: 'rgba(225,29,72,0.12)', color: '#be123c', live: true }
  }
  if (visibility === 'protege') {
    return { label: 'Protégé', bg: 'rgba(245,158,11,0.16)', color: '#b45309', live: true }
  }
  return { label: 'Publié', bg: 'rgba(16,185,129,0.14)', color: '#10b981', live: true }
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

export function contentPropertiesPath(type: ContentType, slug: string | null | undefined): string | null {
  if (!slug) return null
  return `${publicContentPath(type, slug)}/proprietes`
}
