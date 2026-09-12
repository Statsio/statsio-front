/**
 * Groupes de conditions d'un bloc (`filterGroups` / `comparisonFilterGroups`) : lecture
 * (avec migration de l'ancien schéma plat), résolution des jetons et édition.
 *
 * Un bloc combine ses groupes entre eux par `filtersMatch` (`all` = ET, `any` = OU), et
 * chaque groupe combine ses conditions entre elles par son propre `match`.
 *
 * ⚠️ Référence unique — tout consommateur des filtres d'un bloc (rendu, comparaison KPI,
 * itération d'une boucle, expressions `{{ AVG(...) }}`) doit passer par ces fonctions
 * plutôt que de relire `block.filters` directement.
 */
import type { BlockFilter, FilterGroup, StudioBlock } from '@/types/studio'

export type FilterDrillInBlockMode = 'primary' | 'comparison'

/**
 * Groupes du bloc, en repliant l'ancien schéma plat (`filters`/`comparisonFilters`,
 * ET implicite) sur un unique groupe `{ conditions, match: 'all' }` quand `filterGroups`/
 * `comparisonFilterGroups` n'est pas défini.
 */
export function readFilterGroups(block: StudioBlock, mode: FilterDrillInBlockMode): FilterGroup[] {
  const groups = mode === 'comparison' ? block.comparisonFilterGroups : block.filterGroups
  if (groups?.length) return groups
  const flat = (mode === 'comparison' ? block.comparisonFilters : block.filters) ?? []
  return flat.length ? [{ conditions: flat, match: 'all' }] : []
}

/** Combinateur ENTRE les groupes (`filtersMatch`/`comparisonFiltersMatch`). Défaut `all`. */
export function readFiltersMatch(block: StudioBlock, mode: FilterDrillInBlockMode): 'all' | 'any' {
  return (mode === 'comparison' ? block.comparisonFiltersMatch : block.filtersMatch) === 'any' ? 'any' : 'all'
}

/** Nombre total de conditions, tous groupes confondus (pour le badge de comptage). */
export function countConditions(groups: FilterGroup[]): number {
  return groups.reduce((n, g) => n + g.conditions.length, 0)
}

/**
 * Résout les jetons `{{param}}` de chaque condition (synchrone), et retire les conditions
 * dont un jeton reste non résolu. Un groupe qui n'a plus aucune condition après ce filtrage
 * est retiré entièrement — pas gardé vide : un groupe vide combiné en OU au niveau supérieur
 * rendrait sinon la requête « toujours vraie » (régression silencieuse).
 */
export function resolveFilterGroupsSync(
  groups: FilterGroup[],
  resolveCondition: (f: BlockFilter) => BlockFilter | null,
): FilterGroup[] {
  return groups
    .map((g) => ({ ...g, conditions: g.conditions.map(resolveCondition).filter((f): f is BlockFilter => f !== null) }))
    .filter((g) => g.conditions.length > 0)
}

/** Variante asynchrone (résolution d'expressions `{{ AVG(...) }}` via l'agrégat serveur). */
export async function resolveFilterGroupsAsync(
  groups: FilterGroup[],
  resolveCondition: (f: BlockFilter) => Promise<BlockFilter | null>,
): Promise<FilterGroup[]> {
  const resolved = await Promise.all(
    groups.map(async (g) => ({
      ...g,
      conditions: (await Promise.all(g.conditions.map(resolveCondition))).filter((f): f is BlockFilter => f !== null),
    })),
  )
  return resolved.filter((g) => g.conditions.length > 0)
}

// ─── Édition (ajout / retrait / modification) ───────────────────────────────
// Logique pure, partagée par le composable de drill-in et les actions du store.

const EMPTY_CONDITION: BlockFilter = { column: '', operator: '=', value: '' }

export function withAddedGroup(groups: FilterGroup[]): FilterGroup[] {
  return [...groups, { conditions: [{ ...EMPTY_CONDITION }], match: 'all' }]
}

export function withRemovedGroup(groups: FilterGroup[], groupIndex: number): FilterGroup[] {
  return groups.filter((_, i) => i !== groupIndex)
}

export function withGroupMatch(groups: FilterGroup[], groupIndex: number, match: 'all' | 'any'): FilterGroup[] {
  return groups.map((g, i) => (i === groupIndex ? { ...g, match } : g))
}

export function withAddedCondition(groups: FilterGroup[], groupIndex: number, condition: BlockFilter): FilterGroup[] {
  return groups.map((g, i) => (i === groupIndex ? { ...g, conditions: [...g.conditions, condition] } : g))
}

export function withPatchedCondition(
  groups: FilterGroup[],
  groupIndex: number,
  conditionIndex: number,
  condition: BlockFilter,
): FilterGroup[] {
  return groups.map((g, i) =>
    i === groupIndex ? { ...g, conditions: g.conditions.map((c, j) => (j === conditionIndex ? condition : c)) } : g,
  )
}

/** Retire une condition ; si c'était la dernière du groupe, retire aussi le groupe. */
export function withRemovedCondition(groups: FilterGroup[], groupIndex: number, conditionIndex: number): FilterGroup[] {
  const next = groups.map((g, i) =>
    i === groupIndex ? { ...g, conditions: g.conditions.filter((_, j) => j !== conditionIndex) } : g,
  )
  return next.filter((g) => g.conditions.length > 0)
}
