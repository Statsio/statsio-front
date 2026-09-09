/**
 * Mise en forme conditionnelle partagée par le tableau (couleur de cellule) et la
 * carte (couleur de marqueur). Une règle compare la valeur numérique d'une colonne
 * à un seuil, à son signe, ou au max / min de la colonne sur les lignes chargées
 * (`top` / `bottom` — agrégat implicite).
 */
import type { TableCellRule } from '@/types/studio'
import { toNumericOrNull } from '@/utils/statsDataFormat'

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

export function matchesCellRule(rule: TableCellRule, n: number, bounds: RuleBounds): boolean {
  switch (rule.when) {
    case 'positive': return n > 0
    case 'negative': return n < 0
    case 'gt': return rule.value !== undefined && n > rule.value
    case 'lt': return rule.value !== undefined && n < rule.value
    case 'top': return bounds[rule.column]?.max === n
    case 'bottom': return bounds[rule.column]?.min === n
    default: return false
  }
}

/** Style (couleur + gras) de la dernière règle qui matche la valeur de `column`. */
export function cellRuleStyle(
  rules: TableCellRule[] | undefined,
  column: string,
  value: unknown,
  bounds: RuleBounds,
): { color: string; bold: boolean } | null {
  const n = toNumericOrNull(value)
  if (n === null) return null
  let hit: { color: string; bold: boolean } | null = null
  for (const rule of rules ?? []) {
    if (rule.column === column && matchesCellRule(rule, n, bounds)) {
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
    const n = toNumericOrNull(valueOf(rule.column))
    if (n !== null && matchesCellRule(rule, n, bounds)) return rule.color
  }
  return null
}
