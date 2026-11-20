import type { DsPieSegment } from '@/lib/ds/pie'
import { sectorPath } from '@/lib/ds/pie'
import { resolveChannelColors } from '@/lib/channel-brand'
import { formatRelativePublished } from '@/lib/catalog-format'
import type {
  ChannelCatalogFacet,
  ChannelCatalogItem,
  ChannelCatalogSort,
  ChannelKind,
  ChannelPace,
} from '@/types/channel-catalog'

/**
 * Logique pure du listing des chaînes (charte « Tranches ») : types et rythmes,
 * bannière générée aux couleurs de la chaîne, mix éditorial, frise d'activité
 * sur 30 jours, tris, filtres actifs et camembert du hero.
 */

export const CHANNEL_KINDS: { value: ChannelKind; label: string; many: string }[] = [
  { value: 'redaction', label: 'Rédaction', many: 'rédactions' },
  { value: 'institution', label: 'Institution', many: 'institutions' },
  { value: 'independant', label: 'Indépendant', many: 'indépendants' },
]

export const CHANNEL_PACES: { value: ChannelPace; label: string; sentence: string }[] = [
  { value: 'jour', label: 'Quotidien', sentence: 'Publie chaque jour' },
  { value: 'semaine', label: 'Hebdo', sentence: 'Publie chaque semaine' },
  { value: 'mois', label: 'Mensuel', sentence: 'Publie chaque mois' },
]

export const channelKindOf = (kind: ChannelKind) =>
  CHANNEL_KINDS.find((k) => k.value === kind) ?? CHANNEL_KINDS[2]!
export const channelPaceOf = (pace: ChannelPace) =>
  CHANNEL_PACES.find((p) => p.value === pace) ?? CHANNEL_PACES[2]!

export const CHANNEL_SORTS: { value: ChannelCatalogSort; label: string }[] = [
  { value: 'trend', label: 'Tendance' },
  { value: 'recent', label: 'Récentes' },
  { value: 'followers', label: 'Les plus suivies' },
]

export function channelSortContext(sort: ChannelCatalogSort): string {
  if (sort === 'recent') return 'Classées par dernière parution'
  if (sort === 'followers') return "Classées par nombre d'abonnés"
  return 'Classées par tendance sur 30 jours'
}

/**
 * Facettes de l'API → options d'un contrôle segmenté (« Toutes » en tête), avec
 * les libellés de la charte et sans les options vides (sauf l'option active).
 */
export function segmentOptions<T extends string>(
  facets: ChannelCatalogFacet[],
  labels: { value: T; label: string }[],
  active: string,
): { value: T | ''; label: string; count: number }[] {
  const countOf = (value: string) => facets.find((f) => f.value === value)?.count ?? 0
  const all = facets.find((f) => !f.value)?.count ?? 0
  return [
    { value: '', label: 'Toutes', count: all },
    ...labels
      .map((l) => ({ value: l.value, label: l.label, count: countOf(l.value) }))
      .filter((o) => o.count > 0 || o.value === active),
  ]
}

/* ─── Bannière générée ────────────────────────────────────────────────────── */

export type ChannelBannerArt = {
  background: string
  slices: { d: string; fill: string; opacity?: number }[]
  bars: { x: number; y: number; w: number; h: number; fill: string }[]
}

/**
 * Bannière de substitution (sans image) : un camembert décalé et quatre barres,
 * dans les couleurs de la chaîne (personnalisées, sinon tirées de la palette).
 * Repère : `width` × `height`.
 */
export function channelBannerArt(
  item: Pick<ChannelCatalogItem, 'id' | 'custom_color_primary' | 'custom_color_secondary'>,
  box: { width: number; height: number },
): ChannelBannerArt {
  const { primary, secondary } = resolveChannelColors(
    String(item.id),
    item.custom_color_primary,
    item.custom_color_secondary,
  )
  const { width: W, height: H } = box
  const cx = W * 0.78
  const cy = H * 0.55
  const r = H * 1.25
  return {
    background: `color-mix(in srgb, ${primary} 18%, white)`,
    slices: [
      { d: sectorPath(cx, cy, r, 135, 230), fill: primary },
      { d: sectorPath(cx + 6, cy - 6, r, 230, 300), fill: secondary },
      { d: sectorPath(cx, cy, r, 300, 360), fill: primary, opacity: 0.55 },
    ],
    bars: [0, 1, 2, 3].map((i) => {
      const h = Math.round(H * (0.25 + 0.15 * ((item.id + i) % 4)))
      return { x: 24 + i * 30, y: H - h, w: 18, h, fill: i % 2 ? secondary : primary }
    }),
  }
}

/* ─── Mix éditorial ───────────────────────────────────────────────────────── */

export type ChannelMixPart = {
  key: 'statsdata' | 'article' | 'survey'
  label: string
  count: number
  color: string
}

/** Répartition des publications par type (parts vides retirées). */
export function channelMix(
  item: Pick<ChannelCatalogItem, 'statsdata_count' | 'articles_count' | 'surveys_count'>,
): ChannelMixPart[] {
  const parts: ChannelMixPart[] = [
    {
      key: 'statsdata',
      label: 'StatsData',
      count: item.statsdata_count ?? 0,
      color: 'var(--ds-t2)',
    },
    { key: 'article', label: 'articles', count: item.articles_count ?? 0, color: 'var(--ds-t1)' },
    { key: 'survey', label: 'sondages', count: item.surveys_count ?? 0, color: 'var(--ds-t5)' },
  ]
  return parts.filter((p) => p.count > 0)
}

/* ─── Activité sur 30 jours ───────────────────────────────────────────────── */

export const ACTIVITY_WINDOW = 30

/** Cases de la frise : publiée ce jour-là ? dernière parution ? */
export function activityCells(days: number[] | undefined): { on: boolean; last: boolean }[] {
  const set = new Set((days ?? []).filter((d) => d >= 0 && d < ACTIVITY_WINDOW))
  const last = set.size ? Math.max(...set) : -1
  return Array.from({ length: ACTIVITY_WINDOW }, (_, i) => ({ on: set.has(i), last: i === last }))
}

/** « Publie chaque semaine · 4 jours de parution sur 30 · dernière il y a 2 j » */
export function activitySummary(
  item: Pick<ChannelCatalogItem, 'pace' | 'activity_days' | 'last_published_at'>,
): {
  pace: string
  detail: string
} {
  const n = new Set(item.activity_days ?? []).size
  const parts = [`${n} jour${n > 1 ? 's' : ''} de parution sur ${ACTIVITY_WINDOW}`]
  if (item.last_published_at)
    parts.push(`dernière ${formatRelativePublished(item.last_published_at)}`)
  return { pace: channelPaceOf(item.pace).sentence, detail: parts.join(' · ') }
}

/** Chaîne ouverte depuis moins de 30 jours → pastille « Nouvelle ». */
export function isNewChannel(
  item: Pick<ChannelCatalogItem, 'created_at'>,
  now: Date = new Date(),
): boolean {
  const t = item.created_at ? new Date(item.created_at).getTime() : Number.NaN
  return !Number.isNaN(t) && now.getTime() - t < ACTIVITY_WINDOW * 86_400_000
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */

const KIND_COLORS: Record<ChannelKind, string> = {
  redaction: 'var(--ds-t1)',
  institution: 'var(--ds-t2)',
  independant: 'var(--ds-t5)',
}

export function channelKindPie(facets: ChannelCatalogFacet[]): DsPieSegment[] {
  return CHANNEL_KINDS.map((k) => ({
    value: facets.find((f) => f.value === k.value)?.count ?? 0,
    color: KIND_COLORS[k.value],
    label: k.label,
  })).filter((s) => s.value > 0)
}

/** « 3 rédactions · 1 institution · 2 indépendants. » */
export function channelKindCaption(facets: ChannelCatalogFacet[]): string | null {
  const parts = CHANNEL_KINDS.map((k) => {
    const n = facets.find((f) => f.value === k.value)?.count ?? 0
    return n ? `${n} ${n > 1 ? k.many : k.label.toLowerCase()}` : null
  }).filter(Boolean)
  return parts.length
    ? `${parts.join(' · ')}. La vérification confirme l'identité de l'éditeur, pas ses opinions.`
    : null
}

/* ─── Filtres actifs ──────────────────────────────────────────────────────── */

export type ChannelFilterKey = 'q' | 'kind' | 'theme' | 'pace' | 'verified' | 'followed'

export function channelActiveFilters(
  state: {
    q: string
    kind: string
    theme: string
    pace: string
    verified: boolean
    followed: boolean
  },
  themeLabel: (value: string) => string,
): { key: ChannelFilterKey; label: string }[] {
  const out: { key: ChannelFilterKey; label: string }[] = []
  const q = state.q.trim()
  if (q) out.push({ key: 'q', label: `« ${q} »` })
  if (state.kind) out.push({ key: 'kind', label: channelKindOf(state.kind as ChannelKind).label })
  if (state.theme) out.push({ key: 'theme', label: themeLabel(state.theme) })
  if (state.pace) out.push({ key: 'pace', label: channelPaceOf(state.pace as ChannelPace).label })
  if (state.verified) out.push({ key: 'verified', label: 'Chaînes vérifiées' })
  if (state.followed) out.push({ key: 'followed', label: 'Mes abonnements' })
  return out
}
