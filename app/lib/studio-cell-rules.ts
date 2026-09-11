/**
 * Mise en forme conditionnelle partagée par le tableau (couleur de cellule) et la
 * carte (couleur / taille de marqueur). Une règle est une liste de conditions
 * combinées en ET ; chaque condition teste la valeur d'une colonne : son signe, le
 * max / min de la colonne sur les lignes chargées (`top` / `bottom` — agrégat
 * implicite), ou une comparaison à seuil / texte via un opérateur de filtre
 * (`=`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `not_contains`) — vs une valeur
 * littérale, ou (`valueIsExpression`) vs un agrégat calculé (`AVG(prix)`…).
 */
import type { ConditionalRuleBase, FilterOperator, MapSizeRule, RuleCondition, TableCellRule } from '@/types/studio'
import { toNumericOrNull } from '@/utils/statsDataFormat'
import { compareValues } from '@/lib/studio-if'
import { evaluate, parseExpression, type AggregateRef } from '@/lib/studio-expression'

export type RuleBounds = Record<string, { min: number; max: number }>
export type RuleAggValues = Map<string, number | null>

/**
 * Conditions d'une règle, en repliant l'ancien schéma à plat (`column`/`when`/`value`)
 * sur le nouveau tableau `conditions` (même convention que `readIfConditions`).
 */
export function ruleConditions(rule: ConditionalRuleBase): RuleCondition[] {
  if (rule.conditions?.length) return rule.conditions
  if (rule.column && rule.when) {
    return [{ column: rule.column, when: rule.when, value: rule.value, valueIsExpression: rule.valueIsExpression }]
  }
  return []
}

/** Bornes min/max par colonne pour les conditions `top` / `bottom`, sur les lignes fournies. */
export function cellRuleBounds(
  rules: ConditionalRuleBase[] | undefined,
  rows: Record<string, unknown>[],
  valueOf: (row: Record<string, unknown>, column: string) => unknown,
): RuleBounds {
  const out: RuleBounds = {}
  for (const rule of rules ?? []) {
    for (const cond of ruleConditions(rule)) {
      if ((cond.when !== 'top' && cond.when !== 'bottom') || out[cond.column]) continue
      const vals = rows
        .map((r) => toNumericOrNull(valueOf(r, cond.column)))
        .filter((v): v is number => v !== null)
      if (vals.length) out[cond.column] = { min: Math.min(...vals), max: Math.max(...vals) }
    }
  }
  return out
}

/**
 * Références d'agrégats utilisées par les conditions en mode "expression"
 * (`valueIsExpression`) d'un jeu de règles — à résoudre via `useAggregateValues`
 * avant d'évaluer les règles.
 */
export function ruleAggregateRefs(rules: ConditionalRuleBase[] | undefined): AggregateRef[] {
  const map = new Map<string, AggregateRef>()
  for (const rule of rules ?? []) {
    for (const cond of ruleConditions(rule)) {
      if (!cond.valueIsExpression || typeof cond.value !== 'string') continue
      const parsed = parseExpression(cond.value)
      if (!parsed) continue
      for (const ref of parsed.aggregates) map.set(ref.key, ref)
    }
  }
  return [...map.values()]
}

function resolveExpressionValue(expr: string, aggValues: RuleAggValues | undefined): number | null {
  const parsed = parseExpression(expr)
  if (!parsed) return null
  return evaluate(parsed.node, aggValues ?? new Map())
}

export function matchesCondition(
  cond: RuleCondition,
  value: unknown,
  bounds: RuleBounds,
  aggValues?: RuleAggValues,
): boolean {
  const n = toNumericOrNull(value)
  switch (cond.when) {
    case 'positive': return n !== null && n > 0
    case 'negative': return n !== null && n < 0
    case 'top': return n !== null && bounds[cond.column]?.max === n
    case 'bottom': return n !== null && bounds[cond.column]?.min === n
    // Legacy : seuils numériques, remplacés par `>` / `<` dans l'UI.
    case 'gt': return n !== null && cond.value != null && n > Number(cond.value)
    case 'lt': return n !== null && cond.value != null && n < Number(cond.value)
    default: {
      // Opérateur de filtre (=, !=, >, >=, <, <=, contains, not_contains) vs `value`.
      if (cond.value == null || cond.value === '') return false
      const right = cond.valueIsExpression ? resolveExpressionValue(String(cond.value), aggValues) : cond.value
      if (right === null) return false
      return compareValues(String(value ?? ''), cond.when as FilterOperator, String(right))
    }
  }
}

/** Vrai si toutes les conditions de `rule` matchent (ET) — `valueOf` résout la valeur d'une colonne pour la ligne courante. */
function matchesRule(
  rule: ConditionalRuleBase,
  valueOf: (column: string) => unknown,
  bounds: RuleBounds,
  aggValues?: RuleAggValues,
): boolean {
  const conds = ruleConditions(rule)
  return conds.length > 0 && conds.every((c) => matchesCondition(c, valueOf(c.column), bounds, aggValues))
}

/** Style (couleur + gras) de la dernière règle dont la 1ère condition cible `column` et dont toutes les conditions matchent. */
export function cellRuleStyle(
  rules: TableCellRule[] | undefined,
  column: string,
  valueOf: (column: string) => unknown,
  bounds: RuleBounds,
  aggValues?: RuleAggValues,
): { color: string; bold: boolean } | null {
  let hit: { color: string; bold: boolean } | null = null
  for (const rule of rules ?? []) {
    const conds = ruleConditions(rule)
    if (!conds.length || conds[0]!.column !== column) continue
    if (matchesRule(rule, valueOf, bounds, aggValues)) {
      hit = { color: rule.color, bold: Boolean(rule.bold) }
    }
  }
  return hit
}

/**
 * Couleur de la première règle dont toutes les conditions matchent la ligne — pour
 * la carte, où le marqueur porte une seule couleur quelles que soient les colonnes visées.
 */
export function rowRuleColor(
  rules: TableCellRule[] | undefined,
  valueOf: (column: string) => unknown,
  bounds: RuleBounds,
  aggValues?: RuleAggValues,
): string | null {
  for (const rule of rules ?? []) {
    if (matchesRule(rule, valueOf, bounds, aggValues)) return rule.color
  }
  return null
}

/**
 * Rayon de la première règle dont toutes les conditions matchent la ligne — carte,
 * marqueur conditionnel par taille (même logique que `rowRuleColor`).
 */
export function rowRuleSize(
  rules: MapSizeRule[] | undefined,
  valueOf: (column: string) => unknown,
  bounds: RuleBounds,
  aggValues?: RuleAggValues,
): number | null {
  for (const rule of rules ?? []) {
    if (matchesRule(rule, valueOf, bounds, aggValues)) return rule.size
  }
  return null
}
