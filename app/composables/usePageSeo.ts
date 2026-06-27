import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'Statsio'
const DEFAULT_DESCRIPTION =
  'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.'

export interface PageSeoOptions {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<string | undefined>
  robots?: MaybeRefOrGetter<string | undefined>
}

export function usePageSeo(options: PageSeoOptions = {}) {
  const requestUrl = useRequestURL()
  const route = useRoute()

  const title = computed(() => {
    const t = toValue(options.title) ?? (route.meta.title as string | undefined)
    return t ? `${t} · ${SITE_NAME}` : SITE_NAME
  })

  const description = computed(() =>
    toValue(options.description) ??
    (route.meta.description as string | undefined) ??
    DEFAULT_DESCRIPTION,
  )

  const image = computed(() =>
    toValue(options.image) ?? (route.meta.ogImage as string | undefined),
  )

  const type = computed(() =>
    toValue(options.type) ?? (route.meta.ogType as string | undefined) ?? 'website',
  )

  const robots = computed(() =>
    toValue(options.robots) ?? (route.meta.robots as string | undefined) ?? 'index,follow',
  )

  const canonicalUrl = computed(() => `${requestUrl.origin}${route.fullPath}`)

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    robots: () => robots.value,
    ogSiteName: SITE_NAME,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: () => type.value,
    ogUrl: () => canonicalUrl.value,
    ogImage: () => image.value,
    twitterCard: () => (image.value ? 'summary_large_image' : 'summary'),
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
  })

  useHead({
    link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
    script: [
      {
        key: 'org-jsonld',
        type: 'application/ld+json',
        innerHTML: () =>
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: requestUrl.origin,
            logo: `${requestUrl.origin}/favicon.ico`,
          }),
      },
    ],
  })
}
