export interface SitemapContentItem {
  slug?: string
  visibility?: string
  updated_at?: string
}

export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
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
  const response = await $fetch<{ data?: SitemapContentItem[] }>(`${apiBaseUrl}/statsdata/public`, {
    params: { type, ...(categories?.length ? { categories } : {}) },
  })

  return (response.data ?? [])
    .filter((item) => item.slug && item.visibility !== 'private')
    .map((item) => ({
      loc: `${basePath}/${CONTENT_TYPE_PATH[type]}/${item.slug}`,
      lastmod: item.updated_at,
    }))
}
