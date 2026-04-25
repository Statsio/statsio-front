export type StatsDataFormulaAst =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'ref'; ref: string }
  | { kind: 'op'; op: 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'pow' | 'neg' | 'abs'; args: StatsDataFormulaAst[] }
  | { kind: 'cmp'; op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'; args: [StatsDataFormulaAst, StatsDataFormulaAst] }
  | { kind: 'logic'; op: 'and' | 'or'; args: StatsDataFormulaAst[] }
  | { kind: 'not'; arg: StatsDataFormulaAst }
  | { kind: 'if'; cond: StatsDataFormulaAst; then: StatsDataFormulaAst; else: StatsDataFormulaAst }
  | {
      kind: 'fn'
      fn:
        | 'coalesce'
        | 'round'
        | 'floor'
        | 'ceil'
        | 'min'
        | 'max'
        // text
        | 'concat'
        | 'upper'
        | 'lower'
        | 'upperFirst'
        | 'upperLast'
        | 'first'
        | 'last'
      args: StatsDataFormulaAst[]
    }

export type StatsDataQueryOrderByV2 = {
  by: string
  dir: 'asc' | 'desc'
}

export type StatsDataQuerySelectFromV2 = {
  kind: 'from'
  label: string
  /** alias.field (après fusion keys+values) */
  from: string
}

export type StatsDataQuerySelectFormulaV2 = {
  kind: 'formula'
  label: string
  expr: StatsDataFormulaAst
}

export type StatsDataQuerySelectV2 = StatsDataQuerySelectFromV2 | StatsDataQuerySelectFormulaV2

export type StatsDataQueryAggregationV2 = {
  label: string
  fn: 'count' | 'sum' | 'avg' | 'min' | 'max'
  /** Ref ou expression. Pour count, peut être omis. */
  expr?: StatsDataFormulaAst
}

export type StatsDataQueryRequestV2 = {
  specVersion: 2
  sources: { alias: string; sourceId: string }[]
  join?: { type: 'inner' | 'left'; on: string[] }
  /** Colonnes projetées / calculées (appliquées avant groupBy/aggregations). */
  select: StatsDataQuerySelectV2[]
  /** Recherche serveur (filtrage avant pagination). */
  search?: { q: string }
  /** GroupBy sur des noms de colonnes (labels de select) ou refs directes. */
  groupBy?: string[]
  aggregations?: StatsDataQueryAggregationV2[]
  orderBy?: StatsDataQueryOrderByV2[]
  limit?: number
  offset?: number
}

