import type { MaybeRefOrGetter } from 'vue'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  organizationNode,
  websiteNode,
  type SchemaNode,
} from '@/lib/structured-data'

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
  /** URL canonique explicite (chemin absolu ou URL complète). Défaut : l'URL courante avec sa query. */
  canonical?: MaybeRefOrGetter<string | undefined>
  /**
   * Nœuds JSON-LD supplémentaires (schema.org) propres à la page — fil d'Ariane,
   * `Article`, `Dataset`, `QAPage`… Poussés dans le `@graph` global, après les
   * nœuds `Organization` et `WebSite` toujours présents. Construits via les
   * helpers de `@/lib/structured-data`. Les valeurs `undefined` sont ignorées.
   */
  jsonLd?: MaybeRefOrGetter<(SchemaNode | undefined)[] | undefined>
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
    SITE_DESCRIPTION,
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

  const canonicalUrl = computed(() => {
    const override = toValue(options.canonical)
    if (override) return override.startsWith('http') ? override : `${requestUrl.origin}${override}`
    return `${requestUrl.origin}${route.fullPath}`
  })

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

  // `@graph` unique : Organization + WebSite (toujours) puis les nœuds de la page.
  // Clé stable partagée avec l'appel global du layout → la version la plus riche
  // (celle de la page de détail) remplace celle du layout après hydratation.
  const graph = computed<SchemaNode[]>(() => {
    const origin = requestUrl.origin
    const pageNodes = (toValue(options.jsonLd) ?? []).filter(
      (node): node is SchemaNode => Boolean(node),
    )
    return [organizationNode(origin), websiteNode(origin), ...pageNodes]
  })

  useHead({
    link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
    script: [
      {
        key: 'statsio-jsonld',
        type: 'application/ld+json',
        innerHTML: () =>
          JSON.stringify({ '@context': 'https://schema.org', '@graph': graph.value }),
      },
    ],
  })
}
