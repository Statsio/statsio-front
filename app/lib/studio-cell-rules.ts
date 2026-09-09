/**
 * Mise en forme conditionnelle partagée par le tableau (couleur de cellule) et la
 * carte (couleur de marqueur). Une règle teste la valeur d'une colonne : son signe,
 * le max / min de la colonne sur les lignes chargées (`top` / `bottom` — agrégat
 * implicite), ou une comparaison à seuil / texte via un opérateur de filtre
 * (`=`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`).
 */
import type { FilterOperator, TableCellRule } from '@/types/studio'
import { toNumericOrNull } from '@/utils/statsDataFormat'
import { compareValues } from '@/lib/studio-if'

export type RuleBounds = Record<string, { min: number; max: number }>

/** Bornes min/max par colonne pour les règles `top` / `bottom`, sur les lignes fournies. */
export function cellRuleBounds(
  rules: TableCellRule[] | undefined,
  rows: Record<string, unknown>[],
  valueOf: (row: Record<string, unknown>, column: string) => unknown,
): RuleBounds {
  const out: RuleBounds = {}
  for (const rule of rules ?? []) {
    if ((rule.when !== 'top' && rule.when !== 'bottom') || out[rule.column]) continue
    const vals = rows
      .map((r) => toNumericOrNull(valueOf(r, rule.column)))
      .filter((v): v is number => v !== null)
    if (vals.length) out[rule.column] = { min: Math.min(...vals), max: Math.max(...vals) }
  }
  return out
}

export function matchesCellRule(rule: TableCellRule, value: unknown, bounds: RuleBounds): boolean {
  const n = toNumericOrNull(value)
  switch (rule.when) {
    case 'positive': return n !== null && n > 0
    case 'negative': return n !== null && n < 0
    case 'top': return n !== null && bounds[rule.column]?.max === n
    case 'bottom': return n !== null && bounds[rule.column]?.min === n
    // Legacy : seuils numériques, remplacés par `>` / `<` dans l'UI.
    case 'gt': return n !== null && rule.value != null && n > Number(rule.value)
    case 'lt': return n !== null && rule.value != null && n < Number(rule.value)
    default:
      // Opérateur de filtre (=, !=, >, >=, <, <=, contains, not_contains) vs `value`.
      if (rule.value == null || rule.value === '') return false
      return compareValues(String(value ?? ''), rule.when as FilterOperator, String(rule.value))
  }
}

/** Style (couleur + gras) de la dernière règle qui matche la valeur de `column`. */
export function cellRuleStyle(
  rules: TableCellRule[] | undefined,
  column: string,
  value: unknown,
  bounds: RuleBounds,
): { color: string; bold: boolean } | null {
  let hit: { color: string; bold: boolean } | null = null
  for (const rule of rules ?? []) {
    if (rule.column === column && matchesCellRule(rule, value, bounds)) {
      hit = { color: rule.color, bold: Boolean(rule.bold) }
    }
  }
  return hit
}

/**
 * Couleur de la première règle qui matche l'une des colonnes de la ligne — pour la
 * carte, où le marqueur porte une seule couleur quelle que soit la colonne visée.
 */
export function rowRuleColor(
  rules: TableCellRule[] | undefined,
  valueOf: (column: string) => unknown,
  bounds: RuleBounds,
): string | null {
  for (const rule of rules ?? []) {
    if (matchesCellRule(rule, valueOf(rule.column), bounds)) return rule.color
  }
  return null
}
