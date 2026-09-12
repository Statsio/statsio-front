export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
}

interface SitemapPageParam {
  name?: string
  column?: string
  slugColumn?: string
  columns?: string[]
  datasetId?: string
  fanOut?: boolean
}

/**
 * Nombre max d'URLs fan-out émises par document. Volontairement bas : on ne
 * soumet au départ qu'un sous-ensemble de valeurs (les premières distinctes) —
 * inonder Google de milliers de pages paramétrées mène surtout à « Détectée,
 * actuellement non indexée ». On élargira quand ces pages auront prouvé leur
 * valeur (trafic, contenu enrichi).
 */
const FANOUT_URL_CAP = 800

/** Limite de la requête de valeurs distinctes (cohérente avec {@link FANOUT_URL_CAP}). */
const FANOUT_QUERY_LIMIT = 800

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
  const pages = item.pages ?? []
  const primaryIdx = pages.findIndex((p) => (p.params ?? []).some((x) => x.fanOut && x.name))

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!
    const param = (page.params ?? []).find((p) => p.fanOut && p.name)
    if (!param) continue
    const datasetId = param.datasetId
    const keys = param.columns?.length
      ? param.columns
      : [param.slugColumn || param.column].filter((c): c is string => Boolean(c))
    if (!datasetId || !keys.length) continue

    const pageSeg = page.slug || page.id
    const useShortUrl = i === primaryIdx

    try {
      const qs =
        keys.length === 1
          ? `columns[]=${encodeURIComponent(keys[0]!)}&distinct=true&limit=${FANOUT_QUERY_LIMIT}`
          : keys.map((k) => `columns[]=${encodeURIComponent(k)}`).join('&') + `&limit=${FANOUT_QUERY_LIMIT}`
      const res = await $fetch<DistinctResponse>(
        `${apiBaseUrl}/studio/content/public/${encodeURIComponent(item.slug!)}/datasets/${encodeURIComponent(datasetId)}/query?${qs}`,
      )
      for (const row of res.data?.rows ?? []) {
        const seg = keys.map((k) => slugify(row[k])).filter(Boolean).join('-')
        if (!seg) continue
        const loc = useShortUrl || !pageSeg
          ? `${basePath}/statsdata/${item.slug}/${seg}`
          : `${basePath}/statsdata/${item.slug}/${pageSeg}/${seg}`
        if (seen.has(loc)) continue
        if (seen.size >= FANOUT_URL_CAP) break
        seen.add(loc)
        out.push({ loc, lastmod: item.updated_at })
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

  // Fan-out : émis uniquement sous le préfixe racine. Le même statsdata décliné
  // sous /tvstats ou /medistats pointe déjà vers l'URL racine via rel=canonical
  // (voir canonicalContentPath) — inutile de tripler les URLs paramétrées.
  if (type !== 'statsdata' || basePath !== '') return base

  const fanOut = (await Promise.all(items.map((item) => fanOutEntries(apiBaseUrl, basePath, item)))).flat()
  return [...base, ...fanOut]
}
