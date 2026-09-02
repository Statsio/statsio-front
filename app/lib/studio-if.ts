/**
 * Bloc « Condition » (`if`) : lecture et évaluation des clauses.
 *
 * Une clause compare la valeur active d'un paramètre de page (`pageParams[param]`,
 * ou une variable de boucle du `scope`) à une valeur, elle-même interpolée pour
 * résoudre les `{{tokens}}`. Les clauses sont combinées en ET (`all`) ou OU (`any`).
 *
 * ⚠️ Référence unique — `IfBlock.vue` (rendu) et `IfBlockInspector.vue` (édition)
 * doivent passer par ces fonctions plutôt que dupliquer la comparaison.
 */
import type { BlockConfig, FilterOperator, IfBranch, IfCondition } from '@/types/studio'
import { interpolateTokens } from './studio-tokens'

/** Combinateur des clauses : toutes (ET) ou au moins une (OU). */
export type IfMatch = 'all' | 'any'

/**
 * Clauses du bloc, en repliant l'ancien schéma `ifParam` / `ifOperator` / `ifValue`
 * (une seule clause) sur le nouveau tableau `ifConditions`.
 */
export function readIfConditions(config: BlockConfig): IfCondition[] {
  if (config.ifConditions?.length) return config.ifConditions
  if (config.ifParam) {
    return [{ param: config.ifParam, operator: config.ifOperator ?? '=', value: config.ifValue ?? '' }]
  }
  return []
}

export function readIfMatch(config: BlockConfig): IfMatch {
  return config.ifMatch === 'any' ? 'any' : 'all'
}

/** Comparaison numérique quand les deux membres sont des nombres, sinon lexicographique. */
export function compareValues(left: string, op: FilterOperator, right: string): boolean {
  const ln = Number(left)
  const rn = Number(right)
  const numeric = left !== '' && right !== '' && !Number.isNaN(ln) && !Number.isNaN(rn)
  switch (op) {
    case '=': return left === right
    case '!=': return left !== right
    case '>': return numeric ? ln > rn : left > right
    case '>=': return numeric ? ln >= rn : left >= right
    case '<': return numeric ? ln < rn : left < right
    case '<=': return numeric ? ln <= rn : left <= right
    case 'contains': return left.toLowerCase().includes(right.toLowerCase())
    case 'not_contains': return !left.toLowerCase().includes(right.toLowerCase())
    default: return false
  }
}

/** Évalue une clause contre la table de jetons (`pageParams` + scope de boucle). */
export function evaluateCondition(cond: IfCondition, tokenMap: Record<string, string>): boolean {
  if (!cond.param) return false
  const left = tokenMap[cond.param] ?? ''
  const right = interpolateTokens(cond.value ?? '', tokenMap)
  return compareValues(String(left), cond.operator, String(right))
}

export function evaluateIf(
  conditions: IfCondition[],
  match: IfMatch,
  tokenMap: Record<string, string>,
): boolean {
  const real = conditions.filter((c) => c.param)
  if (!real.length) return false
  return match === 'any'
    ? real.some((c) => evaluateCondition(c, tokenMap))
    : real.every((c) => evaluateCondition(c, tokenMap))
}

// ─── Branches (Si / Sinon si / Sinon) ───────────────────────────────────────

/**
 * Branches du bloc, en repliant l'ancien schéma (`ifConditions` / `ifMatch`, ou
 * `ifParam`…) sur une unique branche `Si`. Toujours au moins une branche.
 */
export function readIfBranches(config: BlockConfig): IfBranch[] {
  if (config.ifBranches?.length) return config.ifBranches
  return [{ conditions: readIfConditions(config), match: readIfMatch(config) }]
}

/** Vrai si `branch` est la branche « Sinon » (drapeau explicite — voir {@link IfBranch.else}). */
export function isElseBranch(branches: IfBranch[], index: number): boolean {
  return branches[index]?.else === true
}

/**
 * Index de la première branche qui s'applique compte tenu des paramètres courants,
 * ou `-1` si aucune. La branche « Sinon » (`else: true`) s'applique toujours ;
 * une branche `Si`/`Sinon si` sans clause réelle (pas encore configurée) ne
 * s'applique jamais.
 */
export function matchingBranchIndex(branches: IfBranch[], tokenMap: Record<string, string>): number {
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i]!
    if (b.else) return i
    if (b.conditions.some((c) => c.param) && evaluateIf(b.conditions, b.match === 'any' ? 'any' : 'all', tokenMap)) {
      return i
    }
  }
  return -1
}

// ─── Édition des branches (ajout / retrait) ─────────────────────────────────
// Logique pure, partagée par le bloc `if` (dont les enfants sont réindexés par
// `zoneId`, dans `stores/studio.ts`) et le conteneur de section `if` (dont les
// enfants sont réindexés par `Section.branch`) — évite de dupliquer le calcul
// d'insertion/retrait dans les deux mutations de store.

export interface BranchEdit {
  /** Nouveau tableau de branches. */
  branches: IfBranch[]
  /** Reindexe l'ancien index de branche des enfants existants ; `null` = enfant à retirer. */
  remap: (branch: number) => number | null
}

/** Calcule l'ajout d'une branche `Sinon si` (insérée avant un éventuel `Sinon`) ou `Sinon` (en fin, unique). `null` si un `Sinon` existe déjà et qu'on tente d'en ajouter un autre. */
export function withAddedBranch(branches: IfBranch[], kind: 'elsif' | 'else'): BranchEdit | null {
  const elsePos = branches.findIndex((b) => b.else)
  const newBranch: IfBranch =
    kind === 'else'
      ? { conditions: [], match: 'all', else: true }
      : { conditions: [{ param: '', operator: '=', value: '' }], match: 'all' }

  if (kind === 'else') {
    if (elsePos !== -1) return null
    return { branches: [...branches, newBranch], remap: (i) => i }
  }
  if (elsePos !== -1) {
    const next = [...branches]
    next.splice(elsePos, 0, newBranch)
    return { branches: next, remap: (i) => (i >= elsePos ? i + 1 : i) }
  }
  return { branches: [...branches, newBranch], remap: (i) => i }
}

/** Calcule le retrait de la branche `branchIndex` (jamais la première, `Si`). `null` si hors bornes. */
export function withRemovedBranch(branches: IfBranch[], branchIndex: number): BranchEdit | null {
  if (branchIndex <= 0 || branchIndex >= branches.length) return null
  return {
    branches: branches.filter((_, i) => i !== branchIndex),
    remap: (i) => (i < branchIndex ? i : i === branchIndex ? null : i - 1),
  }
}
