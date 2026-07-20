import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'Statsio'
const DEFAULT_DESCRIPTION =
  'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.'
const DEFAULT_OG_IMAGE_PATH = '/brand/blank.png'

/** Miroir du type `ogType` d'Unhead — pas de nom exporté à réutiliser directement. */
export type PageSeoOgType =
  | 'website' | 'article' | 'book' | 'profile'
  | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station'
  | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other'
  | 'payment.link'

export interface PageSeoOptions {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<PageSeoOgType | undefined>
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
    toValue(options.image) ??
    (route.meta.ogImage as string | undefined) ??
    `${requestUrl.origin}${DEFAULT_OG_IMAGE_PATH}`,
  )

  const type = computed(() =>
    toValue(options.type) ?? (route.meta.ogType as PageSeoOgType | undefined) ?? 'website',
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
