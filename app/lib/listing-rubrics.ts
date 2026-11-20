import type { CatalogFacet, CatalogSort } from '@/types/catalog'
import type { DsPieSegment } from '@/lib/ds/pie'
import { percentOf } from '@/lib/ds/pie'

/**
 * Logique pure partagée par les listings de la charte « Tranches » (articles,
 * StatsData) : la « tranche » des rubriques (barre proportionnelle + camembert
 * du hero), pastille de rubrique des cartes, tris. Tout est dérivé des facettes
 * réelles du catalogue public.
 */

/** Une part de la barre des rubriques. */
export type RubricSlice = {
  value: string
  label: string
  count: number
  /** couleur de la tranche (token --ds-t*) */
  color: string
  /** couleur du texte posé sur la tranche */
  ink: string
}

/** Rubrique affichée sur une carte (pastille + libellé). */
export type RubricBadge = { label: string; color: string }

/** 5 parts maximum (règle de la charte) ; tokens + encre lisible sur chacun. */
const SLICE_TOKENS: { color: string; ink: string }[] = [
  { color: 'var(--ds-t1)', ink: '#ffffff' },
  { color: 'var(--ds-t2)', ink: '#ffffff' },
  { color: 'var(--ds-t3)', ink: '#1b1530' },
  { color: 'var(--ds-t4)', ink: '#ffffff' },
  { color: 'var(--ds-t5)', ink: '#1b1530' },
]
export const MAX_SLICES = SLICE_TOKENS.length
const OTHER_COLOR = 'var(--ds-context)'

/** Nom lisible d'une rubrique : les facettes renvoient le slug comme libellé. */
export function rubricLabel(
  value: string,
  names: Record<string, string>,
  fallback?: string,
): string {
  return names[value] ?? (fallback && fallback !== value ? fallback : value)
}

/**
 * Facettes catégories → tranches (les `max` plus fournies) + rubriques restantes
 * (proposées à part, pour rester toutes filtrables). La facette « Toutes » et les
 * rubriques vides sont ignorées.
 */
export function buildRubricSlices(
  facets: CatalogFacet[],
  names: Record<string, string>,
  max = MAX_SLICES,
): { slices: RubricSlice[]; others: RubricSlice[] } {
  const rubrics = facets
    .filter((f) => f.value && f.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((f) => ({ value: f.value, label: rubricLabel(f.value, names, f.label), count: f.count }))

  const slices = rubrics
    .slice(0, max)
    .map((r, i) => ({ ...r, ...SLICE_TOKENS[i % SLICE_TOKENS.length]! }))
  const others = rubrics.slice(max).map((r) => ({ ...r, color: OTHER_COLOR, ink: '#ffffff' }))
  return { slices, others }
}

/** Rubrique → pastille de carte ; une rubrique hors tranches prend la couleur « contexte ». */
export function rubricBadgeOf(
  category: string | null | undefined,
  slices: RubricSlice[],
  names: Record<string, string>,
): RubricBadge | null {
  if (!category) return null
  const slice = slices.find((s) => s.value === category)
  return { label: slice?.label ?? rubricLabel(category, names), color: slice?.color ?? OTHER_COLOR }
}

/** Camembert du hero : 5 parts maximum, les rubriques restantes regroupées en « Autres ». */
export function rubricPieSegments(slices: RubricSlice[], others: RubricSlice[]): DsPieSegment[] {
  const othersCount = others.reduce((sum, r) => sum + r.count, 0)
  const kept = othersCount > 0 ? slices.slice(0, MAX_SLICES - 1) : slices
  const dropped = slices.slice(kept.length).reduce((sum, r) => sum + r.count, 0)
  const segments: DsPieSegment[] = kept.map((s) => ({
    value: s.count,
    color: s.color,
    label: s.label,
  }))
  if (othersCount + dropped > 0)
    segments.push({ value: othersCount + dropped, color: OTHER_COLOR, label: 'Autres rubriques' })
  return segments
}

/** Légende du camembert : la rubrique en tête et sa part du catalogue (`unit` : ce qu'on compte). */
export function rubricLeadCaption(
  slices: RubricSlice[],
  total: number,
  unit: { one: string; many: string } = { one: 'article', many: 'articles' },
): string | null {
  const lead = slices[0]
  if (!lead || total <= 0) return null
  const n = Math.min(lead.count, total)
  return `${lead.label} en tête : ${n} ${n > 1 ? unit.many : unit.one} sur ${total}, soit ${percentOf(n, total)} %.`
}

/** Part (en %) de chaque tranche, pour la légende de la barre. */
export function slicePercent(slice: RubricSlice, slices: RubricSlice[]): number {
  return percentOf(
    slice.count,
    slices.reduce((sum, s) => sum + s.count, 0),
  )
}

/** Tris communs aux listings de contenus (articles, StatsData). */
export const LISTING_SORTS: {
  value: Extract<CatalogSort, 'trend' | 'created' | 'recent'>
  label: string
}[] = [
  { value: 'trend', label: 'Popularité' },
  { value: 'created', label: 'Création' },
  { value: 'recent', label: 'Modification' },
]

export function sortContextLabel(sort: CatalogSort): string {
  if (sort === 'created') return 'Classés par date de création'
  if (sort === 'recent') return 'Classés par date de modification'
  return 'Classés par popularité'
}
