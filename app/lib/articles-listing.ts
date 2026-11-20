import type { CatalogFacet } from '@/types/catalog'
import { LISTING_SORTS } from '@/lib/listing-rubrics'

/**
 * Logique pure du listing des articles (charte « Tranches ») : formats, filtres
 * actifs, temps de lecture. Les rubriques et les tris, partagés avec le listing
 * StatsData, vivent dans `lib/listing-rubrics.ts` (ré-exportés ici).
 */
export * from '@/lib/listing-rubrics'

export const ARTICLE_SORTS = LISTING_SORTS

/** Formats proposés en filtre : seulement s'il existe au moins un article typé. */
export function visibleFormatFacets(facets: CatalogFacet[]): CatalogFacet[] {
  return facets.some((f) => f.value && f.count > 0)
    ? facets.filter((f) => !f.value || f.count > 0)
    : []
}

export type ActiveFilterKey = 'q' | 'category' | 'format' | 'hasData'
export type ActiveFilter = { key: ActiveFilterKey; label: string }

/** Filtres en cours, dans l'ordre de la barre d'outils (pastilles retirables). */
export function activeFilters(
  state: { q: string; category: string; format: string; hasData: boolean },
  labels: { category: (v: string) => string; format: (v: string) => string },
): ActiveFilter[] {
  const out: ActiveFilter[] = []
  const q = state.q.trim()
  if (q) out.push({ key: 'q', label: `« ${q} »` })
  if (state.category) out.push({ key: 'category', label: labels.category(state.category) })
  if (state.format) out.push({ key: 'format', label: labels.format(state.format) })
  if (state.hasData) out.push({ key: 'hasData', label: 'Avec StatsData lié' })
  return out
}

/** Cadran du temps de lecture : une tranche de 72° par minute, plein à 5 min. */
export function readingSweep(minutes: number): number {
  return Math.max(0, Math.min(5, Number.isFinite(minutes) ? minutes : 0)) * 72
}
