import type { ExpressionNode } from '@/lib/studio-expression'
import { parseExpression } from '@/lib/studio-expression'
import type { AggregateFunction, AggTerm, ArithOp, BlockAggregate, FieldMapping, StudioBlock } from '@/types/studio'

export const AGG_OPTIONS: { value: AggregateFunction | ''; label: string }[] = [
  { value: '', label: 'Aucune' },
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'count', label: 'Nombre' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
]

/** Colonnes de valeur d'un bloc (celles auxquelles s'applique une fonction d'agrégation). */
export function valueColumnsFor(block: StudioBlock): string[] {
  const fm = block.fieldMapping
  switch (block.type) {
    case 'bar':
    case 'line': {
      const axes = fm.yAxes?.length ? fm.yAxes : fm.yAxis ? [fm.yAxis] : []
      return axes
    }
    case 'pie':
      return fm.value ? [fm.value] : []
    case 'kpi':
      return fm.valueColumn ? [fm.valueColumn] : []
    default:
      return []
  }
}

/** Fonction d'agrégation appliquée à une colonne de valeur (fallback : `fieldMapping.aggregate`). */
export function aggregateFor(fm: FieldMapping, col: string): AggregateFunction | undefined {
  return fm.aggregates?.find((a) => a.column === col)?.fn ?? fm.aggregate
}

/**
 * Reconstruit `fieldMapping.aggregates` après avoir fixé la fonction `fn` sur `col`.
 * Renvoie le patch à passer à `updateBlockFieldMapping` (purge le champ legacy `aggregate`).
 */
export function withAggregate(
  block: StudioBlock,
  col: string,
  fn: AggregateFunction | '',
): Pick<FieldMapping, 'aggregates' | 'aggregate'> {
  const fm = block.fieldMapping
  const cur = new Map<string, AggregateFunction | ''>(
    (fm.aggregates ?? []).map((a) => [a.column, a.fn]),
  )
  cur.set(col, fn)

  const next: BlockAggregate[] = valueColumnsFor(block)
    .map((c) => ({ column: c, fn: (cur.get(c) ?? fm.aggregate ?? '') as AggregateFunction | '' }))
    .filter((e): e is BlockAggregate => e.fn !== '')

  return { aggregates: next.length ? next : undefined, aggregate: undefined }
}

// ─── Valeur d'agrégat combinée (KPI) : FN(a) op FN(b) … ─────────────────────

const AGG_FN_SET = new Set<string>(['sum', 'avg', 'count', 'min', 'max'])

/** `[{fn:'max',column:'prix'},{op:'-',fn:'min',column:'prix'}]` → `MAX("prix") - MIN("prix")`. */
export function aggTermsToExpression(terms: AggTerm[]): string {
  return terms
    .filter((t) => t.column)
    .map((t, i) => `${i > 0 ? `${t.op ?? '+'} ` : ''}${t.fn.toUpperCase()}("${t.column.replace(/"/g, '')}")`)
    .join(' ')
    .trim()
}

/**
 * Inverse : `MAX(prix) - MIN(prix)` → terms, uniquement si l'expression est une chaîne
 * plate d'agrégats (`FN(colonne)` reliés par `+ - * /`, sans `@source`, sans filtres,
 * sans littéral ni parenthèse). Sinon `null` (expression trop riche pour l'éditeur visuel).
 */
export function expressionToAggTerms(expr: string): AggTerm[] | null {
  const parsed = parseExpression(expr.trim())
  if (!parsed) return null

  const terms: AggTerm[] = []
  const walk = (node: ExpressionNode, op?: ArithOp): boolean => {
    if (node.t === 'bin') {
      // Associativité gauche : … op FN(x)
      return walk(node.l, op) && walk(node.r, node.op)
    }
    if (node.t === 'agg') {
      const { fn, column, datasetId, filters } = node.ref
      if (datasetId !== null || filters.length || !AGG_FN_SET.has(fn) || !column || column === '*') return false
      terms.push({ ...(op ? { op } : {}), fn: fn as AggregateFunction, column })
      return true
    }
    return false
  }

  return walk(parsed.node) && terms.length ? terms : null
}
