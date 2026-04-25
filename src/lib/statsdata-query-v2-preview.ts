import type {
  StatsDataFormulaAst,
  StatsDataQueryAggregationV2,
  StatsDataQueryOrderByV2,
  StatsDataQueryRequestV2,
  StatsDataQuerySelectV2,
} from '@/types/statsdata-query-v2'

export type StatsDataTuple = Record<string, Record<string, unknown>>

const stableKeyPart = (v: unknown): string => {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return `n:${String(v)}`
  if (typeof v === 'string') return `s:${v}`
  try {
    return `j:${JSON.stringify(v)}`
  } catch {
    return `j:`
  }
}

const joinKey = (vals: unknown[]): string => vals.map(stableKeyPart).join('|')

const resolveFrom = (tuple: StatsDataTuple, from: string): unknown => {
  const [aliasRaw, fieldRaw] = String(from ?? '').split('.', 2)
  const alias = aliasRaw?.trim() ?? ''
  const field = fieldRaw?.trim() ?? ''
  if (!alias || !field) return null
  return tuple[alias]?.[field] ?? null
}

const resolveRef = (ref: string, row: Record<string, unknown>, tuple: StatsDataTuple): unknown => {
  const s = String(ref ?? '').trim()
  if (!s) return null
  if (s.includes('.')) return resolveFrom(tuple, s)
  return row[s] ?? null
}

const asNumber = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') {
    const cleaned = v.replace(/\s/g, '').replace(',', '.').trim()
    if (!cleaned) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const truthy = (v: unknown): boolean => Boolean(v)

export function evaluateFormula(expr: StatsDataFormulaAst, row: Record<string, unknown>, tuple: StatsDataTuple): unknown {
  switch (expr.kind) {
    case 'number':
    case 'string':
    case 'boolean':
      return expr.value
    case 'null':
      return null
    case 'ref':
      return resolveRef(expr.ref, row, tuple)
    case 'not':
      return !truthy(evaluateFormula(expr.arg, row, tuple))
    case 'if':
      return truthy(evaluateFormula(expr.cond, row, tuple))
        ? evaluateFormula(expr.then, row, tuple)
        : evaluateFormula(expr.else, row, tuple)
    case 'logic': {
      if (expr.op === 'and') return expr.args.every((a) => truthy(evaluateFormula(a, row, tuple)))
      if (expr.op === 'or') return expr.args.some((a) => truthy(evaluateFormula(a, row, tuple)))
      return false
    }
    case 'cmp': {
      const a = evaluateFormula(expr.args[0], row, tuple) as any
      const b = evaluateFormula(expr.args[1], row, tuple) as any
      switch (expr.op) {
        case 'eq':
          return a == b
        case 'ne':
          return a != b
        case 'lt':
          return a < b
        case 'lte':
          return a <= b
        case 'gt':
          return a > b
        case 'gte':
          return a >= b
      }
    }
    case 'op': {
      const nums = expr.args.map((a) => asNumber(evaluateFormula(a, row, tuple)))
      const n0 = nums[0] ?? null
      if (expr.op === 'neg') return n0 == null ? null : -n0
      if (expr.op === 'abs') return n0 == null ? null : Math.abs(n0)

      const reduceBinary = (fn: (a: number, b: number) => number | null) => {
        let acc: number = nums[0] ?? 0
        for (let i = 1; i < nums.length; i++) {
          const b = nums[i] ?? 0
          const next = fn(acc, b)
          if (next == null) return null
          acc = next
        }
        return acc
      }

      switch (expr.op) {
        case 'add':
          return nums.reduce((acc: number, n) => acc + (n ?? 0), 0)
        case 'sub':
          return reduceBinary((a, b) => a - b)
        case 'mul':
          return nums.reduce((acc: number, n) => acc * (n ?? 1), 1)
        case 'div':
          return reduceBinary((a, b) => (b === 0 ? null : a / b))
        case 'mod':
          return reduceBinary((a, b) => (b === 0 ? null : a % b))
        case 'pow':
          return reduceBinary((a, b) => a ** b)
      }
      return null
    }
    case 'fn': {
      switch (expr.fn) {
        case 'coalesce': {
          for (const a of expr.args) {
            const v = evaluateFormula(a, row, tuple)
            if (v !== null && v !== undefined) return v
          }
          return null
        }
        case 'round': {
          const x = asNumber(evaluateFormula(expr.args[0]!, row, tuple))
          const p = asNumber(evaluateFormula(expr.args[1] ?? { kind: 'number', value: 0 }, row, tuple)) ?? 0
          if (x == null) return null
          const pow = 10 ** Math.trunc(p)
          return Math.round(x * pow) / pow
        }
        case 'floor': {
          const x = asNumber(evaluateFormula(expr.args[0]!, row, tuple))
          return x == null ? null : Math.floor(x)
        }
        case 'ceil': {
          const x = asNumber(evaluateFormula(expr.args[0]!, row, tuple))
          return x == null ? null : Math.ceil(x)
        }
        case 'min':
        case 'max': {
          const vals = expr.args.map((a) => asNumber(evaluateFormula(a, row, tuple))).filter((n): n is number => n != null)
          if (!vals.length) return null
          return expr.fn === 'min' ? Math.min(...vals) : Math.max(...vals)
        }
      }
      return null
    }
  }
}

const selectRows = (tuples: StatsDataTuple[], select: StatsDataQuerySelectV2[]): Record<string, unknown>[] => {
  const out: Record<string, unknown>[] = []
  for (const tuple of tuples) {
    const row: Record<string, unknown> = {}
    for (const s of select) {
      if (s.kind === 'from') row[s.label] = resolveFrom(tuple, s.from)
      else row[s.label] = evaluateFormula(s.expr, row, tuple)
    }
    out.push(row)
  }
  return out
}

const filterRowsBySearch = (rows: Record<string, unknown>[], q: string) => {
  const needle = q.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter((r) =>
    Object.values(r).some((v) => {
      if (v == null) return false
      const s = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : null
      return s ? s.toLowerCase().includes(needle) : false
    }),
  )
}

const groupAndAggregate = (
  rows: Record<string, unknown>[],
  groupBy: string[],
  aggregations: StatsDataQueryAggregationV2[],
): Record<string, unknown>[] => {
  const groups = new Map<string, { keys: Record<string, unknown>; rows: Record<string, unknown>[] }>()
  for (const r of rows) {
    const keyVals = groupBy.map((k) => r[k])
    const k = joinKey(keyVals)
    const keys: Record<string, unknown> = {}
    for (const g of groupBy) keys[g] = r[g] ?? null
    const existing = groups.get(k)
    if (existing) existing.rows.push(r)
    else groups.set(k, { keys, rows: [r] })
  }

  const out: Record<string, unknown>[] = []
  for (const g of groups.values()) {
    const base: Record<string, unknown> = { ...g.keys }
    for (const a of aggregations) {
      if (a.fn === 'count') {
        base[a.label] = g.rows.length
        continue
      }
      const vals = g.rows
        .map((r) => (a.expr ? asNumber(evaluateFormula(a.expr, r, {})) : null))
        .filter((n): n is number => n != null)
      if (!vals.length) {
        base[a.label] = null
        continue
      }
      if (a.fn === 'sum') base[a.label] = vals.reduce((acc, x) => acc + x, 0)
      else if (a.fn === 'avg') base[a.label] = vals.reduce((acc, x) => acc + x, 0) / vals.length
      else if (a.fn === 'min') base[a.label] = Math.min(...vals)
      else if (a.fn === 'max') base[a.label] = Math.max(...vals)
    }
    out.push(base)
  }
  return out
}

const orderRows = (rows: Record<string, unknown>[], rules: StatsDataQueryOrderByV2[]) => {
  if (!rules.length) return rows
  const normalized = rules
    .filter((r) => r.by?.trim())
    .map((r) => ({ by: r.by, dir: r.dir === 'desc' ? 'desc' : 'asc' as const }))
  if (!normalized.length) return rows
  return [...rows].sort((a, b) => {
    for (const r of normalized) {
      const va: any = a[r.by]
      const vb: any = b[r.by]
      if (va == vb) continue
      const cmp = va < vb ? -1 : 1
      return r.dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

const joinTuplesHash = (
  rowsByAlias: Record<string, Record<string, unknown>[]>,
  on: string[],
  left: boolean,
): StatsDataTuple[] => {
  const aliases = Object.keys(rowsByAlias)
  const first = aliases[0]
  if (!first) return []

  let tuples: StatsDataTuple[] = (rowsByAlias[first] ?? []).map((r) => ({ [first]: r }))
  for (const alias of aliases.slice(1)) {
    const rows = rowsByAlias[alias] ?? []
    const index = new Map<string, Record<string, unknown>[]>()
    for (const r of rows) {
      if (on.some((f) => !(f in r))) continue
      const k = joinKey(on.map((f) => (r as any)[f]))
      const cur = index.get(k)
      if (cur) cur.push(r)
      else index.set(k, [r])
    }

    const next: StatsDataTuple[] = []
    for (const t of tuples) {
      const keyVals = on.map((f) => {
        for (const row of Object.values(t)) {
          if (f in row) return (row as any)[f]
        }
        return null
      })
      const k = joinKey(keyVals)
      const matches = index.get(k) ?? []
      if (matches.length) {
        for (const m of matches) next.push({ ...t, [alias]: m })
      } else if (left) {
        next.push({ ...t, [alias]: {} })
      }
    }
    tuples = next
    if (!left && !tuples.length) break
  }
  return tuples
}

export type PreviewExecuteOptions = {
  /** Protections perf côté front. */
  maxTuples?: number
}

export function executeStatsDataQueryV2Preview(
  spec: StatsDataQueryRequestV2,
  rowsByAlias: Record<string, Record<string, unknown>[]>,
  options?: PreviewExecuteOptions,
): Record<string, unknown>[] {
  const limit = spec.limit ?? 10_000
  const offset = spec.offset ?? 0

  const aliases = spec.sources.map((s) => s.alias)
  const selectedRowsByAlias: Record<string, Record<string, unknown>[]> = {}
  for (const a of aliases) selectedRowsByAlias[a] = rowsByAlias[a] ?? []

  const firstAlias = aliases[0] ?? 's'
  const tuples =
    aliases.length <= 1
      ? (selectedRowsByAlias[firstAlias] ?? []).map((r) => ({ [firstAlias]: r }))
      : joinTuplesHash(selectedRowsByAlias, spec.join?.on ?? [], spec.join?.type === 'left')

  const cappedTuples = options?.maxTuples && tuples.length > options.maxTuples ? tuples.slice(0, options.maxTuples) : tuples

  let rows = selectRows(cappedTuples, spec.select)
  rows = filterRowsBySearch(rows, spec.search?.q ?? '')

  if (spec.groupBy?.length && spec.aggregations?.length) {
    rows = groupAndAggregate(rows, spec.groupBy, spec.aggregations)
  }

  if (spec.orderBy?.length) {
    rows = orderRows(rows, spec.orderBy)
  }

  return rows.slice(Math.max(0, offset), Math.max(0, offset) + Math.max(1, limit))
}

