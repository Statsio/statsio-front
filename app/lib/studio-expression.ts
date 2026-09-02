import type { FilterOperator } from '@/types/studio'

/**
 * Moteur de valeurs calculées du Studio (Brique 3 du plan Statsdata v2).
 *
 * Un jeton `{{ … }}` qui contient un appel de fonction (`AVG(`, `SUM(`, …) est
 * une *expression* : agrégats sur un dataset filtré, arithmétique, mise en forme.
 *
 *   {{ AVG(prix@7) }}
 *   {{ MAX(prix@7) - MIN(prix@7) }}
 *   {{ (MAX(prix@7) - MIN(prix@7)) * 100 : 0 }}
 *   {{ AVG(prix@7 | carburant = $carburant & annee >= 2020) }}
 *
 * `@N`  → id d'une source du bloc appelant (`BlockSource.id`, = id du dataset quand la
 *         source est unique) ; sinon id de dataset brut. Absent → source primaire du bloc.
 * `|`   → filtres `colonne <op> valeur`, séparés par `&`. `$nom` = valeur d'un
 *         paramètre de page / d'une variable de boucle.
 * `: N` → nombre de décimales à la fin de l'expression (sinon : auto).
 * Une colonne avec espaces/accents se met entre guillemets : `AVG("prix moyen"@7)`.
 */

export type AggFn = 'avg' | 'sum' | 'min' | 'max' | 'count'

export interface AggregateRef {
  fn: AggFn
  column: string
  datasetId: string | null
  filters: { column: string; operator: FilterOperator; value: string }[]
  /** Clé stable : dédoublonnage + cache. */
  key: string
}

export type ExpressionNode =
  | { t: 'num'; v: number }
  | { t: 'agg'; ref: AggregateRef }
  | { t: 'col'; name: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; l: ExpressionNode; r: ExpressionNode }

type Node = ExpressionNode

export interface ParsedExpression {
  node: Node
  aggregates: AggregateRef[]
  /** Colonnes référencées via `{nom}` (colonnes calculées de tableau). */
  columns: string[]
  decimals?: number
}

const FN_RE = /\b(avg|sum|min|max|count)\s*\(/i
const OPERATORS: FilterOperator[] = ['>=', '<=', '!=', '=', '>', '<']

/** Le contenu d'un `{{ }}` est-il une expression (et non une simple variable) ? */
export function isExpressionToken(raw: string): boolean {
  return FN_RE.test(raw)
}

// ─── Tokenizer ───────────────────────────────────────────────────────────────

type Tok =
  | { k: 'num'; v: number }
  | { k: 'id'; v: string }
  | { k: 'str'; v: string }
  | { k: 'col'; v: string }
  | { k: 'punct'; v: string }

function tokenize(src: string): Tok[] | null {
  const out: Tok[] = []
  let i = 0
  // Les opérateurs de comparaison brisent un identifiant même sans espace autour
  // (`carburant=$carburant` ≡ `carburant = $carburant`). Sans ça, `=<>!` étaient
  // avalés dans le nom de colonne et le filtre ne parsait plus.
  const isIdChar = (c: string) => /[^\s(){}@|&:"=<>!]/.test(c)

  while (i < src.length) {
    const c = src[i]!
    if (/\s/.test(c)) { i++; continue }

    if (c === '"') {
      const end = src.indexOf('"', i + 1)
      if (end < 0) return null
      out.push({ k: 'str', v: src.slice(i + 1, end) })
      i = end + 1
      continue
    }

    // référence de colonne : {nom de colonne}
    if (c === '{') {
      const end = src.indexOf('}', i + 1)
      if (end < 0) return null
      out.push({ k: 'col', v: src.slice(i + 1, end).trim() })
      i = end + 1
      continue
    }

    if ('()@|&:'.includes(c)) { out.push({ k: 'punct', v: c }); i++; continue }

    if (c === '+' || c === '*' || c === '/') { out.push({ k: 'punct', v: c }); i++; continue }
    // '-' : opérateur binaire, ou signe d'un nombre (géré au parsing)
    if (c === '-') { out.push({ k: 'punct', v: '-' }); i++; continue }

    // opérateurs de comparaison (dans les filtres)
    const two = src.slice(i, i + 2)
    if (['>=', '<=', '!='].includes(two)) { out.push({ k: 'punct', v: two }); i += 2; continue }
    if (c === '>' || c === '<' || c === '=') { out.push({ k: 'punct', v: c }); i++; continue }

    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j]!)) j++
      const n = Number(src.slice(i, j))
      if (Number.isNaN(n)) return null
      out.push({ k: 'num', v: n })
      i = j
      continue
    }

    // identifiant (nom de fonction / colonne / valeur de filtre / $param)
    let j = i
    while (j < src.length && isIdChar(src[j]!)) j++
    if (j === i) return null
    out.push({ k: 'id', v: src.slice(i, j) })
    i = j
  }
  return out
}

// ─── Parser (descente récursive) ─────────────────────────────────────────────

class Parser {
  private p = 0
  readonly aggregates: AggregateRef[] = []
  readonly columns: string[] = []

  constructor(
    private readonly toks: Tok[],
    private readonly resolveParam: (name: string) => string | undefined,
  ) {}

  private peek() { return this.toks[this.p] }
  private next() { return this.toks[this.p++] }
  private eatPunct(v: string) {
    const t = this.peek()
    if (t?.k === 'punct' && t.v === v) { this.p++; return true }
    return false
  }

  parse(): Node {
    const node = this.expr()
    if (this.p !== this.toks.length) throw new Error('jeton inattendu')
    return node
  }

  private expr(): Node { return this.addSub() }

  private addSub(): Node {
    let left = this.mulDiv()
    for (;;) {
      const t = this.peek()
      if (t?.k === 'punct' && (t.v === '+' || t.v === '-')) {
        this.p++
        left = { t: 'bin', op: t.v, l: left, r: this.mulDiv() }
      } else return left
    }
  }

  private mulDiv(): Node {
    let left = this.unary()
    for (;;) {
      const t = this.peek()
      if (t?.k === 'punct' && (t.v === '*' || t.v === '/')) {
        this.p++
        left = { t: 'bin', op: t.v, l: left, r: this.unary() }
      } else return left
    }
  }

  private unary(): Node {
    if (this.eatPunct('-')) {
      return { t: 'bin', op: '-', l: { t: 'num', v: 0 }, r: this.unary() }
    }
    return this.primary()
  }

  private primary(): Node {
    if (this.eatPunct('(')) {
      const n = this.expr()
      if (!this.eatPunct(')')) throw new Error('parenthèse fermante manquante')
      return n
    }
    const t = this.next()
    if (!t) throw new Error('expression tronquée')
    if (t.k === 'num') return { t: 'num', v: t.v }
    if (t.k === 'col') {
      if (!this.columns.includes(t.v)) this.columns.push(t.v)
      return { t: 'col', name: t.v }
    }
    if (t.k === 'id' && /^(avg|sum|min|max|count)$/i.test(t.v)) return this.aggCall(t.v.toLowerCase() as AggFn)
    throw new Error(`« ${t.k === 'id' || t.k === 'str' ? t.v : ''} » inattendu`)
  }

  private aggCall(fn: AggFn): Node {
    if (!this.eatPunct('(')) throw new Error(`${fn}( attendu`)

    // colonne (optionnelle pour count)
    let column = ''
    const c = this.peek()
    if (c?.k === 'str') { column = c.v; this.p++ }
    else if (c?.k === 'id' && c.v !== '*') { column = c.v; this.p++ }
    else if (c?.k === 'id' && c.v === '*') { this.p++ }

    let datasetId: string | null = null
    if (this.eatPunct('@')) {
      const d = this.next()
      if (!d || (d.k !== 'id' && d.k !== 'num')) throw new Error('id de dataset attendu après @')
      datasetId = String(d.k === 'num' ? d.v : d.v)
    }

    const filters: AggregateRef['filters'] = []
    if (this.eatPunct('|')) {
      do {
        const col = this.next()
        if (!col || (col.k !== 'id' && col.k !== 'str')) throw new Error('colonne de filtre attendue')
        const op = this.next()
        if (!op || op.k !== 'punct' || !OPERATORS.includes(op.v as FilterOperator)) {
          throw new Error('opérateur de filtre attendu')
        }
        const val = this.next()
        if (!val || (val.k !== 'id' && val.k !== 'str' && val.k !== 'num')) throw new Error('valeur de filtre attendue')
        let value = val.k === 'num' ? String(val.v) : val.v
        if (val.k === 'id' && value.startsWith('$')) value = this.resolveParam(value.slice(1)) ?? ''
        filters.push({ column: col.v, operator: op.v as FilterOperator, value })
      } while (this.eatPunct('&'))
    }

    if (!this.eatPunct(')')) throw new Error(`${fn}(…) : parenthèse fermante manquante`)
    if (fn !== 'count' && !column) throw new Error(`${fn}() : colonne manquante`)

    const ref: AggregateRef = {
      fn,
      column: column || '*',
      datasetId,
      filters,
      key: JSON.stringify([fn, column || '*', datasetId, filters]),
    }
    if (!this.aggregates.some((a) => a.key === ref.key)) this.aggregates.push(ref)
    return { t: 'agg', ref }
  }
}

/**
 * Parse le contenu (déjà trimé) d'un `{{ }}`. Renvoie `null` si ce n'est pas une
 * expression valide (le jeton sera laissé tel quel).
 */
export function parseExpression(
  raw: string,
  resolveParam: (name: string) => string | undefined = () => undefined,
): ParsedExpression | null {
  if (!isExpressionToken(raw) && !/\{[^{}]+\}/.test(raw)) return null

  let body = raw.trim()
  let decimals: number | undefined
  const m = /:\s*(\d+)\s*$/.exec(body)
  if (m) { decimals = Number(m[1]); body = body.slice(0, m.index).trim() }

  const toks = tokenize(body)
  if (!toks || !toks.length) return null

  try {
    const parser = new Parser(toks, resolveParam)
    const node = parser.parse()
    return { node, aggregates: parser.aggregates, columns: parser.columns, decimals }
  } catch {
    return null
  }
}

/**
 * Évalue l'arbre.
 *  - `aggValues` : `AggregateRef.key` → valeur numérique (ou null).
 *  - `colValues` : nom de colonne → valeur de la ligne courante (colonnes calculées de tableau).
 */
export function evaluate(
  node: Node,
  aggValues: Map<string, number | null>,
  colValues?: Map<string, number | null>,
): number | null {
  switch (node.t) {
    case 'num':
      return node.v
    case 'agg':
      return aggValues.get(node.ref.key) ?? null
    case 'col':
      return colValues?.get(node.name) ?? null
    case 'bin': {
      const l = evaluate(node.l, aggValues, colValues)
      const r = evaluate(node.r, aggValues, colValues)
      if (l === null || r === null) return null
      switch (node.op) {
        case '+': return l + r
        case '-': return l - r
        case '*': return l * r
        case '/': return r === 0 ? null : l / r
      }
    }
  }
}

/** Mise en forme française. `decimals` non fourni : entier si rond, sinon 2 décimales. */
export function formatNumber(n: number, decimals?: number): string {
  const d = decimals ?? (Number.isInteger(n) ? 0 : 2)
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  }).format(n)
}
