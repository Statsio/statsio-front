export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
}

interface SitemapPageParam {
  name?: string
  column?: string
  slugColumn?: string
  datasetId?: string
  fanOut?: boolean
}

interface SitemapPage {
  slug?: string
  id?: string
  params?: SitemapPageParam[]
}

interface SitemapContentItem {
  slug?: string
  visibility?: string
  updated_at?: string
  pages?: SitemapPage[]
}

interface DistinctResponse {
  data?: { rows?: Record<string, unknown>[] }
}

const CONTENT_TYPE_PATH: Record<'article' | 'survey' | 'statsdata', string> = {
  article: 'articles',
  survey: 'sondages',
  statsdata: 'statsdata',
}

/** Miroir de app/lib/slug.ts — dupliqué pour ne pas dépendre de l'alias `@/` côté serveur Nitro. */
function slugify(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fanOutEntries(
  apiBaseUrl: string,
  basePath: string,
  item: SitemapContentItem,
): Promise<SitemapUrlEntry[]> {
  const out: SitemapUrlEntry[] = []
  const seen = new Set<string>()

  for (const page of item.pages ?? []) {
    const param = (page.params ?? []).find((p) => p.fanOut && p.name)
    if (!param) continue
    const datasetId = param.datasetId
    const column = param.slugColumn || param.column
    if (!datasetId || !column) continue

    try {
      const qs =
        `columns[]=${encodeURIComponent(column)}&distinct=true&limit=2000`
      const res = await $fetch<DistinctResponse>(
        `${apiBaseUrl}/studio/content/public/${encodeURIComponent(item.slug!)}/datasets/${encodeURIComponent(datasetId)}/query?${qs}`,
      )
      for (const row of res.data?.rows ?? []) {
        const value = row[column]
        const seg = slugify(value)
        if (!seg || seen.has(seg)) continue
        seen.add(seg)
        out.push({ loc: `${basePath}/statsdata/${item.slug}/${seg}`, lastmod: item.updated_at })
      }
    } catch {
      // best effort — une source injoignable ne casse pas le sitemap
    }
  }

  return out
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

  const base: SitemapUrlEntry[] = items.map((item) => ({
    loc: `${basePath}/${CONTENT_TYPE_PATH[type]}/${item.slug}`,
    lastmod: item.updated_at,
  }))

  if (type !== 'statsdata') return base

  const fanOut = (await Promise.all(items.map((item) => fanOutEntries(apiBaseUrl, basePath, item)))).flat()
  return [...base, ...fanOut]
}
