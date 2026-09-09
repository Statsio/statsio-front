/**
 * Constructeurs de données structurées schema.org (JSON-LD).
 *
 * Chaque fonction renvoie un nœud brut (objet simple) destiné à être poussé dans
 * le `@graph` global via `usePageSeo({ jsonLd: [...] })`. Les nœuds `Organization`
 * et `WebSite` sont toujours présents ; les pages de détail ajoutent leur nœud
 * d'entité (`Article`, `Dataset`, `QAPage`…) et un fil d'Ariane (`BreadcrumbList`).
 *
 * Tous les nœuds sont passés dans `prune()` : les clés `undefined`, `null`, `''`,
 * `[]` et `{}` sont retirées pour ne jamais émettre de champ vide à Google.
 */

export type SchemaNode = Record<string, unknown>

export const SITE_NAME = 'Statsio'
export const SITE_DESCRIPTION =
  'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.'
/** Logo carré ≥ 112 px (recommandation Google pour le nœud Organization). */
const SITE_LOGO_PATH = '/web-app-manifest-512x512.png'

/** Retire récursivement les valeurs vides (`undefined`, `null`, `''`, `[]`, `{}`). */
export function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => prune(v)).filter((v) => !isEmpty(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = prune(raw)
      if (!isEmpty(cleaned)) out[key] = cleaned
    }
    return out as T
  }
  return value
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/** `@id` stables pour référencer les nœuds racines depuis les autres. */
export function organizationId(origin: string): string {
  return `${origin}/#organization`
}
export function websiteId(origin: string): string {
  return `${origin}/#website`
}

// ─── Nœuds globaux ───────────────────────────────────────────────────────────

export function organizationNode(origin: string): SchemaNode {
  return prune({
    '@type': 'Organization',
    '@id': organizationId(origin),
    name: SITE_NAME,
    url: `${origin}/`,
    description: SITE_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: `${origin}${SITE_LOGO_PATH}`,
      width: 512,
      height: 512,
    },
  })
}

export function websiteNode(origin: string): SchemaNode {
  return prune({
    '@type': 'WebSite',
    '@id': websiteId(origin),
    name: SITE_NAME,
    url: `${origin}/`,
    description: SITE_DESCRIPTION,
    inLanguage: 'fr-FR',
    publisher: { '@id': organizationId(origin) },
  })
}

// ─── Fil d'Ariane ────────────────────────────────────────────────────────────

export interface BreadcrumbCrumb {
  name: string
  /** Chemin absolu (`/articles`) ou URL complète. Omis pour l'élément courant. */
  path?: string
}

export function breadcrumbNode(crumbs: BreadcrumbCrumb[], origin: string): SchemaNode | undefined {
  const items = crumbs.filter((c) => c.name)
  if (items.length < 2) return undefined
  return prune({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.path
        ? crumb.path.startsWith('http')
          ? crumb.path
          : `${origin}${crumb.path}`
        : undefined,
    })),
  })
}

// ─── Auteur / éditeur ────────────────────────────────────────────────────────

/** Auteur d'un contenu : chaîne éditrice si publiée sous chaîne, sinon personne, sinon Statsio. */
export function contentAuthorNode(input: {
  channelName?: string | null
  channelUrl?: string | null
  authorName?: string | null
}): SchemaNode {
  if (input.channelName) {
    return prune({ '@type': 'Organization', name: input.channelName, url: input.channelUrl ?? undefined })
  }
  if (input.authorName) {
    return { '@type': 'Person', name: input.authorName }
  }
  return { '@type': 'Organization', name: SITE_NAME }
}

// ─── Article ─────────────────────────────────────────────────────────────────

export interface ArticleNodeInput {
  url: string
  headline: string
  description?: string | null
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  section?: string | null
  authorName?: string | null
  channelName?: string | null
  channelUrl?: string | null
}

export function articleNode(input: ArticleNodeInput, origin: string): SchemaNode {
  return prune({
    '@type': 'Article',
    '@id': `${input.url}#article`,
    mainEntityOfPage: input.url,
    url: input.url,
    headline: truncate(input.headline, 110),
    description: input.description ?? undefined,
    image: input.image ? [input.image] : undefined,
    datePublished: isoOrUndefined(input.datePublished),
    dateModified: isoOrUndefined(input.dateModified ?? input.datePublished),
    articleSection: input.section ?? undefined,
    inLanguage: 'fr-FR',
    author: contentAuthorNode({
      channelName: input.channelName,
      channelUrl: input.channelUrl,
      authorName: input.authorName,
    }),
    publisher: { '@id': organizationId(origin) },
    isPartOf: { '@id': websiteId(origin) },
  })
}

// ─── StatsData → Dataset ─────────────────────────────────────────────────────

export interface DatasetNodeInput {
  url: string
  name: string
  description?: string | null
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  keywords?: string[] | null
  authorName?: string | null
  channelName?: string | null
  channelUrl?: string | null
}

export function datasetNode(input: DatasetNodeInput, origin: string): SchemaNode {
  return prune({
    '@type': 'Dataset',
    '@id': `${input.url}#dataset`,
    mainEntityOfPage: input.url,
    url: input.url,
    name: input.name,
    description: input.description || input.name,
    image: input.image ?? undefined,
    datePublished: isoOrUndefined(input.datePublished),
    dateModified: isoOrUndefined(input.dateModified ?? input.datePublished),
    keywords: input.keywords && input.keywords.length ? input.keywords : undefined,
    inLanguage: 'fr-FR',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: contentAuthorNode({
      channelName: input.channelName,
      channelUrl: input.channelUrl,
      authorName: input.authorName,
    }),
    publisher: { '@id': organizationId(origin) },
    isPartOf: { '@id': websiteId(origin) },
  })
}

// ─── Sondage → QAPage / Question ─────────────────────────────────────────────

export interface PollAnswerInput {
  text: string
  /** Nombre de votes / signatures pour cette option (si connu). */
  count?: number | null
}

export interface PollNodeInput {
  url: string
  question: string
  description?: string | null
  dateCreated?: string | null
  answers: PollAnswerInput[]
  authorName?: string | null
  channelName?: string | null
  channelUrl?: string | null
}

/**
 * Un sondage est modélisé en `QAPage` : la question posée devient une `Question`
 * dont chaque option est une `suggestedAnswer` (`Answer`), avec le nombre de
 * votes en `upvoteCount` quand il est disponible. C'est le type schema.org
 * standard le plus proche d'une consultation ouverte au public.
 */
export function pollNode(input: PollNodeInput, origin: string): SchemaNode | undefined {
  const answers = input.answers.filter((a) => a.text)
  if (!input.question || answers.length === 0) return undefined

  const author = contentAuthorNode({
    channelName: input.channelName,
    channelUrl: input.channelUrl,
    authorName: input.authorName,
  })

  const suggestedAnswer = answers.map((answer) =>
    prune({
      '@type': 'Answer',
      text: answer.text,
      url: `${input.url}#option-${slugifyOption(answer.text)}`,
      upvoteCount: typeof answer.count === 'number' ? answer.count : undefined,
      author,
    }),
  )

  return prune({
    '@type': 'QAPage',
    '@id': `${input.url}#qapage`,
    url: input.url,
    inLanguage: 'fr-FR',
    isPartOf: { '@id': websiteId(origin) },
    mainEntity: {
      '@type': 'Question',
      '@id': `${input.url}#question`,
      name: truncate(input.question, 110),
      text: input.description || input.question,
      answerCount: answers.length,
      dateCreated: isoOrUndefined(input.dateCreated),
      author,
      suggestedAnswer,
    },
  })
}

// ─── Dossier → CollectionPage + ItemList ─────────────────────────────────────

export interface CollectionItemInput {
  url: string
  name: string
}

export interface CollectionNodeInput {
  url: string
  name: string
  description?: string | null
  image?: string | null
  dateModified?: string | null
  items: CollectionItemInput[]
}

export function collectionNode(input: CollectionNodeInput, origin: string): SchemaNode {
  return prune({
    '@type': 'CollectionPage',
    '@id': `${input.url}#collection`,
    url: input.url,
    name: input.name,
    description: input.description || `Contenus Statsio du dossier « ${input.name} ».`,
    image: input.image ?? undefined,
    dateModified: isoOrUndefined(input.dateModified),
    inLanguage: 'fr-FR',
    isPartOf: { '@id': websiteId(origin) },
    mainEntity: input.items.length
      ? {
          '@type': 'ItemList',
          numberOfItems: input.items.length,
          itemListElement: input.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: item.url,
            name: item.name,
          })),
        }
      : undefined,
  })
}

// ─── Chaîne éditoriale → ProfilePage + Organization ──────────────────────────

export interface ChannelNodeInput {
  url: string
  name: string
  description?: string | null
  image?: string | null
  handle?: string | null
  dateCreated?: string | null
  subscriberCount?: number | null
}

export function channelNode(input: ChannelNodeInput, origin: string): SchemaNode {
  return prune({
    '@type': 'ProfilePage',
    '@id': `${input.url}#profilepage`,
    url: input.url,
    dateCreated: isoOrUndefined(input.dateCreated),
    inLanguage: 'fr-FR',
    isPartOf: { '@id': websiteId(origin) },
    mainEntity: prune({
      '@type': 'Organization',
      '@id': `${input.url}#channel`,
      name: input.name,
      alternateName: input.handle ? `@${input.handle.replace(/^@/, '')}` : undefined,
      description: input.description ?? undefined,
      image: input.image ?? undefined,
      url: input.url,
      foundingDate: isoOrUndefined(input.dateCreated),
      parentOrganization: { '@id': organizationId(origin) },
      interactionStatistic:
        typeof input.subscriberCount === 'number'
          ? {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/FollowAction',
              userInteractionCount: input.subscriberCount,
            }
          : undefined,
    }),
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoOrUndefined(value?: string | null): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function slugifyOption(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
