export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
}

interface SitemapContentItem {
  slug?: string
  visibility?: string
  updated_at?: string
}

const CONTENT_TYPE_PATH: Record<'article' | 'survey' | 'statsdata', string> = {
  article: 'articles',
  survey: 'sondages',
  statsdata: 'statsdata',
}

export async function fetchPublicContentEntries(
  apiBaseUrl: string,
  type: 'article' | 'survey' | 'statsdata',
  basePath: string,
  categories?: string[],
): Promise<SitemapUrlEntry[]> {
  const response = await $fetch<{ data?: SitemapContentItem[] }>(
    `${apiBaseUrl}/studio/content/public`,
    { params: { type, ...(categories?.length ? { categories } : {}) } },
  )

  const items = (response.data ?? []).filter((item) => item.slug && item.visibility !== 'private')

  // Une URL par contenu. Les pages par valeur de paramètre (fan-out
  // `/statsdata/{slug}/{valeur}`) ne sont volontairement pas soumises : elles
  // sont en `noindex,follow` (voir StatsDataDetailView).
  return items.map((item) => ({
    loc: `${basePath}/${CONTENT_TYPE_PATH[type]}/${item.slug}`,
    lastmod: item.updated_at,
  }))
}
