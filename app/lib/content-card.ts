import type { StatsDataDocument } from '@/api/studio'
import type { AccountContentSummary } from '@/types/account'
import type { EnrichedPoll } from '@/lib/poll-enrich'
import type { CatalogItem, CatalogPublisher } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'
import { getNameInitials } from '@/lib/format'

/**
 * Adaptateurs vers `CatalogItem` — la forme unique consommée par les cartes de contenu
 * (`app/components/content/*`). Toutes ces fonctions sont **pures et déterministes**
 * (aucun `Date.now()`), donc sûres en SSR.
 */

type ChannelLike = {
  id?: number | string | null
  name?: string | null
  handle?: string | null
  logo_url?: string | null
  verified?: boolean | null
} | null | undefined

type AuthorLike = { name?: string | null } | null | undefined

/** Publisher d'une carte à partir d'une chaîne (prioritaire) ou d'un auteur individuel. */
export function catalogPublisherFromChannelOrAuthor(channel?: ChannelLike, author?: AuthorLike): CatalogPublisher {
  if (channel && (channel.name || channel.handle)) {
    const name = channel.name ?? 'Chaîne'
    return {
      name,
      initials: getNameInitials(name),
      logo_url: channel.logo_url ?? null,
      is_channel: true,
      verified: Boolean(channel.verified),
      handle: channel.handle ?? null,
    }
  }
  const name = author?.name ?? 'Anonyme'
  return { name, initials: getNameInitials(name) || '?', is_channel: false, verified: false }
}

/** Un `CatalogItem` neutre — base pour les adaptateurs, remplit tous les champs requis. */
export function emptyCatalogItem(id: string, type: ContentType): CatalogItem {
  return {
    id,
    slug: '',
    title: '',
    description: null,
    type,
    thumbnail_url: null,
    categories: [],
    category: null,
    format: null,
    reading_minutes: 0,
    linked_datasets_count: 0,
    charts_count: 0,
    views_count: 0,
    updated_at: null,
    created_at: null,
    publisher: { name: 'Anonyme', initials: '?', is_channel: false, verified: false },
    is_favorited: false,
  }
}

/**
 * `StatsDataDocument` (studio / dashboards / page chaîne) → `CatalogItem`.
 * `publisher` peut être fourni quand la chaîne doit être résolue en dehors du document
 * (endpoint collection qui ne renvoie que `channel_id`).
 */
export function catalogItemFromDocument(doc: StatsDataDocument, publisher?: CatalogPublisher): CatalogItem {
  const type: ContentType = doc.type ?? 'statsdata'
  const base = emptyCatalogItem(doc.id, type)
  return {
    ...base,
    slug: doc.slug ?? '',
    title: doc.title,
    description: doc.description ?? null,
    thumbnail_url: doc.thumbnail_url ?? null,
    categories: doc.categories ?? [],
    category: doc.categories?.[0] ?? null,
    linked_datasets_count: doc.datasets?.length ?? 0,
    views_count: doc.views_count ?? 0,
    // Les cartes affichent « Mis à jour … » — retomber sur created_at si updated_at manque (brouillon).
    updated_at: doc.updated_at ?? doc.created_at ?? null,
    created_at: doc.created_at ?? null,
    publisher: publisher ?? catalogPublisherFromChannelOrAuthor(doc.channel, doc.author),
    is_favorited: doc.is_favorited ?? false,
    // survey_kind laissé `undefined` s'il manque — getSurveyKindMeta gère le repli, ne pas forcer 'single_question'.
    survey_kind: doc.survey_kind ?? undefined,
    requires_identity_verification: doc.requires_identity_verification,
    response_deadline: doc.response_deadline ?? null,
    petition_goal: doc.petition_goal ?? null,
    petition_target: doc.petition_target ?? null,
  }
}

/**
 * `AccountContentSummary` (favoris / historique / recherche du compte) → `CatalogItem`.
 * Forme volontairement légère : la source ne porte ni `views_count`, ni
 * `categories`, ni `reading_minutes`, ni les champs de sondage (`survey_kind`,
 * `primary_options`, `responses_count`). Les formats de carte utilisés pour ces listes
 * (`card` compact, `row`) n'en lisent aucun ; le reste retombe sur les défauts de
 * `emptyCatalogItem`.
 */
export function catalogItemFromAccountSummary(s: AccountContentSummary): CatalogItem {
  const base = emptyCatalogItem(s.id, s.type)
  return {
    ...base,
    slug: s.slug ?? '',
    title: s.title,
    thumbnail_url: s.thumbnail_url,
    publisher: catalogPublisherFromChannelOrAuthor(s.channel, s.author),
  }
}

/**
 * `EnrichedPoll` (page chaîne — compteurs de votes chargés séparément) → `CatalogItem`.
 * Remplit `primary_options` / `responses_count` / `is_closed` que le document brut n'a pas.
 */
export function catalogItemFromEnrichedPoll(p: EnrichedPoll, publisher?: CatalogPublisher): CatalogItem {
  const item = catalogItemFromDocument(p.poll, publisher)
  return {
    ...item,
    type: 'survey',
    primary_options: p.options.map((o) => ({ label: o.label, pct: o.pct })),
    responses_count: p.totalVotes,
    is_closed: p.status.closed,
  }
}
