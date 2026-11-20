import { publicChannelListPath, publicChannelPath, publicContentListPath, publicContentPath } from '@/lib/content-display'
import type { CatalogItem } from '@/types/catalog'
import type { GlobalSearchChannel, GlobalSearchGroup } from '@/types/search'

/**
 * Lignes d'affichage des résultats de recherche globale, partagées par la modale
 * du header (`AppSearchModal`) et la recherche du hero de l'accueil.
 * `navIndex` = index de navigation clavier sur les seules lignes actionnables.
 */
export type SearchContentType = 'article' | 'statsdata' | 'survey'
export type SearchScope = 'all' | SearchContentType | 'channel'

export type SearchRow =
  | { kind: 'header'; key: string; type: SearchContentType | 'channel'; label: string; total: number }
  | { kind: 'content'; key: string; navIndex: number; to: string; item: CatalogItem; type: SearchContentType }
  | { kind: 'channel'; key: string; navIndex: number; to: string; channel: GlobalSearchChannel }
  | { kind: 'more'; key: string; navIndex: number; to: string; label: string; total: number }

export type SearchNavRow = Exclude<SearchRow, { kind: 'header' }>

export function buildSearchRows(
  groups: GlobalSearchGroup[],
  query: string,
  basePath = '',
  options: { scope?: SearchScope; maxPerGroup?: number } = {},
): SearchRow[] {
  const { scope = 'all', maxPerGroup = Infinity } = options
  const rows: SearchRow[] = []
  const q = encodeURIComponent(query.trim())
  let navIndex = 0

  for (const group of groups) {
    if (!group.items.length) continue
    if (scope !== 'all' && group.type !== scope) continue
    rows.push({ kind: 'header', key: `h:${group.type}`, type: group.type, label: group.label, total: group.total })

    if (group.type === 'channel') {
      const shown = group.items.slice(0, maxPerGroup)
      for (const channel of shown) {
        rows.push({
          kind: 'channel',
          key: `c:${channel.id}`,
          navIndex: navIndex++,
          to: channel.handle ? publicChannelPath(channel.handle, basePath) : publicChannelListPath(basePath),
          channel,
        })
      }
      if (group.total > shown.length) {
        rows.push({ kind: 'more', key: `m:${group.type}`, navIndex: navIndex++, to: `${publicChannelListPath(basePath)}?q=${q}`, label: group.label, total: group.total })
      }
      continue
    }

    const shown = group.items.slice(0, maxPerGroup)
    for (const item of shown) {
      rows.push({
        kind: 'content',
        key: `${group.type}:${item.id}`,
        navIndex: navIndex++,
        to: publicContentPath(group.type, item.slug, basePath),
        item,
        type: group.type,
      })
    }
    if (group.total > shown.length) {
      rows.push({
        kind: 'more',
        key: `m:${group.type}`,
        navIndex: navIndex++,
        to: `${publicContentListPath(group.type, basePath)}?q=${q}`,
        label: group.label,
        total: group.total,
      })
    }
  }
  return rows
}

export function navRowsOf(rows: SearchRow[]): SearchNavRow[] {
  return rows.filter((r): r is SearchNavRow => r.kind !== 'header')
}

/**
 * Découpe `text` en fragments surlignés pour chaque mot de `query` (insensible
 * à la casse et aux accents). Rendu côté template sans v-html.
 */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  // Normalisation caractère par caractère : la chaîne garde sa longueur, donc
  // les positions trouvées dans `hay` valent aussi pour `text`.
  const foldChar = (c: string) => {
    const base = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return base.length === 1 ? base : c.toLowerCase().slice(0, 1) || c
  }
  const fold = (s: string) => Array.from(s, foldChar).join('')
  const tokens = fold(query)
    .split(/\s+/)
    .filter((t) => t.length >= 2)
  if (!tokens.length || !text) return [{ text, hit: false }]
  const chars = Array.from(text)
  const hay = chars.map(foldChar).join('')
  const marks: boolean[] = Array.from({ length: chars.length }, () => false)
  for (const t of tokens) {
    let from = 0
    for (;;) {
      const i = hay.indexOf(t, from)
      if (i < 0) break
      for (let k = i; k < i + t.length; k++) marks[k] = true
      from = i + t.length
    }
  }
  const out: { text: string; hit: boolean }[] = []
  chars.forEach((c, i) => {
    const last = out.at(-1)
    if (last && last.hit === marks[i]) last.text += c
    else out.push({ text: c, hit: marks[i]! })
  })
  return out
}
