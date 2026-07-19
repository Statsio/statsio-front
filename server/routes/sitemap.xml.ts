import { fetchPublicContentEntries, type SitemapUrlEntry } from '../utils/sitemap-content'

const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/articles',
  '/sondages',
  '/statsdata',
  '/chaines',
  '/tvstats',
  '/tvstats/articles',
  '/tvstats/sondages',
  '/tvstats/statsdata',
  '/tvstats/programme-tv',
  '/tvstats/audiences',
  '/medistats',
  '/medistats/articles',
  '/medistats/sondages',
  '/medistats/statsdata',
  '/medistats/maladies',
  '/medistats/medicaments',
  '/medistats/pays',
  '/medistats/soins',
]

interface PublicChannel {
  profile?: { handle?: string } | null
}

async function fetchChannelEntries(apiBaseUrl: string): Promise<SitemapUrlEntry[]> {
  const response = await $fetch<{ data?: { data?: PublicChannel[] } }>(`${apiBaseUrl}/channels`, {
    params: { sort: 'popular', page: 1, per_page: 200 },
  })

  return (response.data?.data ?? [])
    .filter((channel) => channel.profile?.handle)
    .map((channel) => ({ loc: `/channels/${channel.profile!.handle}` }))
}

export default defineEventHandler(async (event) => {
  const origin = getRequestURL(event).origin
  const apiBaseUrl = useRuntimeConfig().public.apiBaseUrl

  const dynamicSources: Array<Promise<SitemapUrlEntry[]>> = [
    fetchPublicContentEntries(apiBaseUrl, 'article', '', undefined),
    fetchPublicContentEntries(apiBaseUrl, 'survey', '', undefined),
    fetchPublicContentEntries(apiBaseUrl, 'statsdata', '', undefined),
    fetchPublicContentEntries(apiBaseUrl, 'article', '/tvstats', ['tv', 'people']),
    fetchPublicContentEntries(apiBaseUrl, 'survey', '/tvstats', ['tv', 'people']),
    fetchPublicContentEntries(apiBaseUrl, 'statsdata', '/tvstats', ['tv', 'people']),
    fetchPublicContentEntries(apiBaseUrl, 'article', '/medistats', ['sante']),
    fetchPublicContentEntries(apiBaseUrl, 'survey', '/medistats', ['sante']),
    fetchPublicContentEntries(apiBaseUrl, 'statsdata', '/medistats', ['sante']),
    fetchChannelEntries(apiBaseUrl),
  ]

  const results = await Promise.allSettled(dynamicSources)
  const dynamicEntries = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))

  const staticEntries: SitemapUrlEntry[] = STATIC_ROUTES.map((loc) => ({ loc }))

  const allEntries = [...staticEntries, ...dynamicEntries]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) =>
      `  <url><loc>${origin}${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
