import type { DsPieSegment } from '@/lib/ds/pie'
import type { DsGlyphKind } from '@/lib/ds/types'
import type {
  DossierCatalogResponse,
  DossierCatalogSort,
  DossierContentCounts,
  DossierContentType,
} from '@/types/dossier'
import type { SubBrand } from '@/types/sub-brand'

/**
 * Logique pure du listing des dossiers (charte « Tranches ») : types de contenu
 * rangés (couleur d'intercalaire, libellés), composition d'un dossier, chiffres
 * du hero, tris, domaines et filtres actifs. La « tranche » des thèmes est
 * partagée (`lib/listing-rubrics`).
 */

export type DossierTypeMeta = {
  value: DossierContentType
  /** singulier, capitale (« Article ») */
  label: string
  /** singulier / pluriel pour les phrases (« 1 article », « 3 articles ») */
  one: string
  many: string
  /** option du filtre « Contient » */
  filterLabel: string
  /** pastille de filtre actif */
  activeLabel: string
  glyph: DsGlyphKind
  /** couleur de l'intercalaire et de la composition */
  color: string
  /** texte posé sur `color` */
  ink: string
}

export const DOSSIER_CONTENT_TYPES: DossierTypeMeta[] = [
  {
    value: 'statsdata',
    label: 'StatsData',
    one: 'StatsData',
    many: 'StatsData',
    filterLabel: 'Des StatsData',
    activeLabel: 'Avec StatsData',
    glyph: 'statsdata',
    color: 'var(--ds-violet-500)',
    ink: '#ffffff',
  },
  {
    value: 'article',
    label: 'Article',
    one: 'article',
    many: 'articles',
    filterLabel: 'Des articles',
    activeLabel: 'Avec articles',
    glyph: 'article',
    color: 'var(--ds-blue-500)',
    ink: '#ffffff',
  },
  {
    value: 'survey',
    label: 'Sondage',
    one: 'sondage',
    many: 'sondages',
    filterLabel: 'Des sondages',
    activeLabel: 'Avec sondages',
    glyph: 'sondage',
    color: 'var(--ds-violet-300)',
    ink: '#1b1530',
  },
]

export function dossierTypeMeta(type: DossierContentType): DossierTypeMeta {
  return DOSSIER_CONTENT_TYPES.find((t) => t.value === type) ?? DOSSIER_CONTENT_TYPES[0]!
}

export const plural = (n: number, unit: { one: string; many: string }) =>
  `${n.toLocaleString('fr-FR')} ${n > 1 ? unit.many : unit.one}`

export const CONTENT_UNIT = { one: 'contenu', many: 'contenus' }
export const DOSSIER_UNIT = { one: 'dossier', many: 'dossiers' }

/** Une part non vide de la composition d'un dossier. */
export type CompositionPart = DossierTypeMeta & { count: number }

/** Composition non vide, dans l'ordre StatsData → articles → sondages. */
export function compositionParts(counts: DossierContentCounts | undefined): CompositionPart[] {
  if (!counts) return []
  return DOSSIER_CONTENT_TYPES.map((t) => ({ ...t, count: counts[t.value] ?? 0 })).filter(
    (p) => p.count > 0,
  )
}

/** « 9 StatsData, 14 articles, 1 sondage » */
export function compositionText(counts: DossierContentCounts | undefined): string {
  return compositionParts(counts)
    .map((p) => `${p.count} ${p.count > 1 ? p.many : p.one}`)
    .join(', ')
}

/** Options du filtre « Contient » (« Tout » en tête) avec le nombre de dossiers concernés. */
export function dossierTypeOptions(
  facets: DossierCatalogResponse['facets']['types'],
): { value: DossierContentType | ''; label: string; count: number }[] {
  const countOf = (value: DossierContentType) => facets?.find((f) => f.value === value)?.count ?? 0
  return [
    { value: '', label: 'Tout', count: 0 },
    ...DOSSIER_CONTENT_TYPES.map((t) => ({
      value: t.value,
      label: t.filterLabel,
      count: countOf(t.value),
    })),
  ]
}

/** Camembert du hero : contenus rangés par type. */
export function dossierTypePie(byType: DossierContentCounts | undefined): DsPieSegment[] {
  return compositionParts(byType).map((p) => ({ value: p.count, color: p.color, label: p.many }))
}

/** Légende du hero : total et détail par type (un contenu peut être rangé deux fois). */
export function dossierHeroCaption(byType: DossierContentCounts | undefined): string | null {
  const parts = compositionParts(byType)
  if (!parts.length) return null
  const total = parts.reduce((sum, p) => sum + p.count, 0)
  return `${plural(total, { one: 'contenu rangé', many: 'contenus rangés' })} : ${compositionText(byType)}. Un contenu peut figurer dans plusieurs dossiers.`
}

export const DOSSIER_SORTS: { value: DossierCatalogSort; label: string }[] = [
  { value: 'maj', label: 'Activité' },
  { value: 'count', label: 'Taille' },
  { value: 'az', label: 'A → Z' },
]

export function dossierSortContext(sort: DossierCatalogSort): string {
  if (sort === 'count') return 'Classés par nombre de contenus'
  if (sort === 'az') return 'Classés par ordre alphabétique'
  return 'Épinglés puis derniers mis à jour'
}

/** Domaines proposés sur Statsio (qui agrège TVStats et Medistats). */
export const DOSSIER_DOMAINS: { value: SubBrand | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'statsio', label: 'Statsio' },
  { value: 'medistats', label: 'Medistats' },
  { value: 'tvstats', label: 'TVStats' },
]

export type DossierFilterKey = 'q' | 'type' | 'category' | 'domain' | 'followed'

/** Pastilles des filtres actifs, dans l'ordre de la barre d'outils. */
export function dossierActiveFilters(
  state: {
    q: string
    type: DossierContentType | ''
    category: string
    domain: SubBrand | ''
    followedOnly: boolean
  },
  categoryLabel: (value: string) => string,
): { key: DossierFilterKey; label: string }[] {
  const filters: { key: DossierFilterKey; label: string }[] = []
  const q = state.q.trim()
  if (q) filters.push({ key: 'q', label: `« ${q} »` })
  if (state.type) filters.push({ key: 'type', label: dossierTypeMeta(state.type).activeLabel })
  if (state.category) filters.push({ key: 'category', label: categoryLabel(state.category) })
  if (state.domain) {
    const label = DOSSIER_DOMAINS.find((d) => d.value === state.domain)?.label ?? state.domain
    filters.push({ key: 'domain', label })
  }
  if (state.followedOnly) filters.push({ key: 'followed', label: 'Dossiers suivis' })
  return filters
}

/** Graine entière stable d'une vignette générée (id numérique ou chaîne). */
export function thumbSeed(seed: string | number): number {
  if (typeof seed === 'number') return Math.abs(Math.trunc(seed))
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % 100_000
}
