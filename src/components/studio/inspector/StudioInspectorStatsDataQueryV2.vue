<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { StudioBlockPayload, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { StatsDataQueryRequest } from '@/types/statsdata-query'
import type {
  StatsDataFormulaAst,
  StatsDataQueryAggregationV2,
  StatsDataQueryRequestV2,
  StatsDataQuerySelectV2,
} from '@/types/statsdata-query-v2'
import {
  ensureUniqueAliases,
  normalizedFieldOptionsForSource,
  parseFrom,
  TABLE_ALIAS_POOL,
} from '@/components/studio/inspector/statsdata-query-editor'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const sourcesById = computed(() => new Map(props.dataSources.map((s) => [s.id, s] as const)))

const dataSourceSelectOptions = computed(() => [
  { value: '', label: '— Choisir une source —' },
  ...props.dataSources.map((s) => ({ value: s.id, label: s.name })),
])

const joinTypeSelectOptions = [
  { value: 'inner', label: 'Inner' },
  { value: 'left', label: 'Left' },
]

const aliasOptions = computed(() => sourceEntries.value.map((se) => ({ value: se.alias, label: se.alias })))

function fieldOptionsForAlias(alias: string) {
  const sourceId = sourceEntries.value.find((x) => x.alias === alias)?.sourceId || ''
  const src = sourcesById.value.get(sourceId)
  return [
    { value: '', label: '— Champ —' },
    ...normalizedFieldOptionsForSource(src).map((f) => ({ value: f, label: f })),
  ]
}

const isV2 = computed(() => (props.block.query as any)?.specVersion === 2)

const baseV1 = computed<StatsDataQueryRequest | null>(() => {
  const q = props.block.query as any
  if (q?.specVersion === 2) return null
  if (q?.sources?.length && q?.columns?.length) return q as StatsDataQueryRequest
  return null
})

const v2Query = computed<StatsDataQueryRequestV2 | null>(() => {
  const q = props.block.query as any
  if (q?.specVersion !== 2) return null
  return q as StatsDataQueryRequestV2
})

const selectedSource = computed(() => {
  const id = props.block.dataBinding.sourceId
  if (!id) return undefined
  return props.dataSources.find((s) => s.id === id)
})

const toV2FromV1 = (q: StatsDataQueryRequest): StatsDataQueryRequestV2 => ({
  specVersion: 2,
  sources: q.sources.map((s) => ({ ...s })),
  ...(q.join ? { join: { type: q.join.type, on: [...q.join.on] } } : {}),
  select: q.columns.map((c) => ({ kind: 'from', label: c.label, from: c.from })),
  ...(q.search?.q ? { search: { q: q.search.q } } : {}),
  ...(typeof q.limit === 'number' ? { limit: q.limit } : {}),
  ...(typeof q.offset === 'number' ? { offset: q.offset } : {}),
})

const commitV2 = (q: StatsDataQueryRequestV2) => {
  const b = props.block
  const nextSourceId = q.sources?.[0]?.sourceId ?? b.dataBinding.sourceId
  const labels = q.select.map((c) => c.label.trim()).filter(Boolean)
  emit('push-payload', {
    ...b,
    dataBinding: { ...b.dataBinding, sourceId: nextSourceId, visibleColumnKeys: labels.length ? labels : [] },
    query: q,
  } as unknown as StudioBlockPayload)
}

const enableV2 = () => {
  const b = props.block
  const fromV1 = baseV1.value
  const q = fromV1
    ? toV2FromV1(fromV1)
    : ({
        specVersion: 2,
        sources: [{ alias: 's', sourceId: b.dataBinding.sourceId }],
        select: [{ kind: 'from', label: 'Colonne 1', from: 's.' }],
      } as StatsDataQueryRequestV2)
  commitV2(q)
}

const qDraft = computed(() => v2Query.value ?? null)

const didAutoUpgrade = ref(false)
const alive = ref(true)
onBeforeUnmount(() => {
  alive.value = false
})

const scheduleAutoUpgrade = async () => {
  if (!alive.value) return
  if (isV2.value) return
  if (didAutoUpgrade.value) return
  didAutoUpgrade.value = true
  // Defer to avoid triggering parent updates during the same mount/patch cycle.
  await nextTick()
  if (!alive.value) return
  if (isV2.value) return
  enableV2()
}

onMounted(() => {
  void scheduleAutoUpgrade()
})

watch(
  () => [isV2.value, props.block.query, props.block.dataBinding.sourceId] as const,
  () => {
    void scheduleAutoUpgrade()
  },
)

const sourceEntries = computed(() => (qDraft.value?.sources ?? []).map((s) => ({ alias: s.alias.trim(), sourceId: s.sourceId.trim() })))

const setSources = (entries: { alias: string; sourceId: string }[]) => {
  const cur = qDraft.value
  if (!cur) return
  const cleaned = entries
    .map((e) => ({ alias: e.alias.trim(), sourceId: e.sourceId.trim() }))
    .filter((e) => e.sourceId)
  const uniq = ensureUniqueAliases(cleaned)
  const next: StatsDataQueryRequestV2 = { ...cur, sources: uniq, ...(uniq.length <= 1 ? { join: undefined } : {}) }
  commitV2(next)
}

const addSource = () => {
  const cur = qDraft.value
  if (!cur) return
  const used = new Set(cur.sources.map((s) => s.alias))
  const alias = TABLE_ALIAS_POOL.find((x) => !used.has(x)) ?? `a${cur.sources.length + 1}`
  commitV2({ ...cur, sources: [...cur.sources, { alias, sourceId: '' }] })
}

const removeSource = (alias: string) => {
  const cur = qDraft.value
  if (!cur) return
  const nextSources = ensureUniqueAliases(cur.sources.filter((s) => s.alias !== alias))
  commitV2({ ...cur, sources: nextSources, ...(nextSources.length <= 1 ? { join: undefined } : {}) })
}

const joinFieldOptions = computed(() => {
  const entries = sourceEntries.value
  const selected = entries.map((e) => sourcesById.value.get(e.sourceId)).filter(Boolean) as StudioDataSource[]
  if (selected.length < 2) return [] as string[]
  const sets = selected.map((s) => new Set(normalizedFieldOptionsForSource(s)))
  const first = sets[0]!
  const inter = [...first].filter((x) => sets.every((st) => st.has(x)))
  return inter.sort((a, b) => a.localeCompare(b))
})

const joinType = computed({
  get: () => (qDraft.value?.join?.type === 'left' ? 'left' : 'inner'),
  set: (t: 'inner' | 'left') => {
    const cur = qDraft.value
    if (!cur) return
    const on = cur.join?.on?.length ? [...cur.join.on] : []
    commitV2({ ...cur, join: { type: t, on } })
  },
})

const joinOn = computed(() => qDraft.value?.join?.on ?? [])

const toggleJoinOnField = (field: string, checked: boolean) => {
  const cur = qDraft.value
  if (!cur) return
  const on = [...(cur.join?.on ?? [])]
  const has = on.includes(field)
  const next = checked && !has ? [...on, field] : !checked && has ? on.filter((x) => x !== field) : on
  commitV2({ ...cur, join: next.length ? { type: joinType.value, on: next } : undefined })
}

const selectList = computed<StatsDataQuerySelectV2[]>(() => qDraft.value?.select ?? [])

const addFromSelect = () => {
  const cur = qDraft.value
  if (!cur) return
  const n = cur.select.length + 1
  commitV2({ ...cur, select: [...cur.select, { kind: 'from', label: `Colonne ${n}`, from: 's.' }] })
}

const removeSelect = (index: number) => {
  const cur = qDraft.value
  if (!cur) return
  commitV2({ ...cur, select: cur.select.filter((_, i) => i !== index) })
}

const setSelect = (index: number, next: StatsDataQuerySelectV2) => {
  const cur = qDraft.value
  if (!cur) return
  commitV2({ ...cur, select: cur.select.map((c, i) => (i === index ? next : c)) })
}

const setSelectLabel = (index: number, label: string) => {
  const cur = selectList.value[index]
  if (!cur) return
  setSelect(index, { ...cur, label })
}

const setSelectFromParts = (index: number, alias: string, field: string) => {
  const cur = selectList.value[index]
  if (!cur || cur.kind !== 'from') return
  setSelect(index, { ...cur, from: alias && field ? `${alias}.${field}` : `${alias}.` })
}

const formulaLabel = ref<string>('Calcul')
const formulaExprByIdx = ref<Record<number, string>>({})
const formulaErrorByIdx = ref<Record<number, string | null>>({})
const lastFromByIdx = ref<Record<number, string>>({})
const formulaDebounceTimers = ref<Record<number, number>>({})

const refOptions = computed(() => selectList.value.map((c) => c.label).filter(Boolean))

const formulaRefButtons = computed(() => {
  const out: { label: string; hint?: string }[] = []
  const seen = new Set<string>()
  for (let i = 0; i < selectList.value.length; i++) {
    const c = selectList.value[i]
    if (!c) continue
    const label = String(c.label ?? '').trim()
    if (!label) continue
    if (seen.has(label)) continue
    seen.add(label)
    out.push({
      label,
      hint: c.kind === 'from' ? String((c as any).from ?? '') : undefined,
    })
  }
  return out
})

const formulaFieldButtons = computed(() => {
  const out: { label: string; hint?: string }[] = []
  const seen = new Set<string>()
  for (const se of sourceEntries.value) {
    const alias = se.alias
    const src = sourcesById.value.get(se.sourceId)
    const fields = normalizedFieldOptionsForSource(src)
    for (const f of fields) {
      const ref = `${alias}.${f}`
      if (seen.has(ref)) continue
      seen.add(ref)
      out.push({ label: ref, hint: src?.name })
    }
  }
  return out
})

type FormulaToolGroup = {
  id: 'math' | 'text'
  label: string
  items: { label: string; insert: string }[]
}

const formulaToolGroups: FormulaToolGroup[] = [
  {
    id: 'math',
    label: 'Mathématique',
    items: [
      { label: '+', insert: '+' },
      { label: '−', insert: '-' },
      { label: '×', insert: '*' },
      { label: '÷', insert: '/' },
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
      { label: '100', insert: '100' },
    ],
  },
  {
    id: 'text',
    label: 'Textuelle',
    items: [
      { label: 'concat(…)', insert: 'concat(' },
      { label: 'upper(…)', insert: 'upper(' },
      { label: 'lower(…)', insert: 'lower(' },
      { label: 'upperFirst(…)', insert: 'upperFirst(' },
      { label: 'upperLast(…)', insert: 'upperLast(' },
      { label: 'first(…)', insert: 'first(' },
      { label: 'last(…)', insert: 'last(' },
    ],
  },
]

type FormulaToken =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'ref'; ref: string }
  | { kind: 'op'; op: 'add' | 'sub' | 'mul' | 'div' }
  | { kind: 'comma' }
  | { kind: 'ident'; name: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightFormulaHtml(expr: string): string {
  const s = expr ?? ''
  // Color rules:
  // - refs: [ ... ] in red
  // - numbers in blue
  // - function names (ident followed by "(") in orange
  const re = /\[[^\]]*\]|\d+(?:[.,]\d+)?|[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()|\s+|./g
  const parts = s.match(re) ?? []
  return parts
    .map((p) => {
      if (/^\s+$/.test(p)) return p.replace(/ /g, '&nbsp;')
      const esc = escapeHtml(p)
      if (p.startsWith('[') && p.endsWith(']')) return `<span class="text-rose-600">${esc}</span>`
      if (/^\d+(?:[.,]\d+)?$/.test(p)) return `<span class="text-sky-600">${esc}</span>`
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) return `<span class="text-orange-600">${esc}</span>`
      return `<span class="text-slate-900">${esc}</span>`
    })
    .join('')
}

function astToExpr(ast: StatsDataFormulaAst): string {
  const prec = (n: StatsDataFormulaAst): number => {
    if (n.kind !== 'op') return 10
    if (n.op === 'mul' || n.op === 'div') return 2
    if (n.op === 'add' || n.op === 'sub') return 1
    return 0
  }
  const opSym = (op: string) => (op === 'add' ? '+' : op === 'sub' ? '-' : op === 'mul' ? '*' : op === 'div' ? '/' : op)

  const render = (n: StatsDataFormulaAst, parentPrec = 0): string => {
    if (n.kind === 'number') return String(n.value)
    if (n.kind === 'ref') return `[${n.ref}]`
    if (n.kind === 'string') return JSON.stringify(n.value ?? '')
    if (n.kind === 'boolean') return n.value ? 'true' : 'false'
    if (n.kind === 'null') return 'null'
    if (n.kind === 'op' && (n.op === 'add' || n.op === 'sub' || n.op === 'mul' || n.op === 'div')) {
      const p = prec(n)
      const a = render(n.args[0] ?? { kind: 'null' }, p)
      const b = render(n.args[1] ?? { kind: 'null' }, p + 0.1)
      const s = `${a} ${opSym(n.op)} ${b}`
      return p < parentPrec ? `(${s})` : s
    }
    if (n.kind === 'fn') {
      const args = (n.args ?? []).map((a) => render(a, 0)).filter((x) => x !== '')
      return `${String((n as any).fn)}(${args.join(', ')})`
    }
    // For unsupported AST nodes, fallback to empty to avoid lying.
    return ''
  }
  return render(ast)
}

function insertFormulaText(idx: number, snippet: string) {
  const cur = formulaExprByIdx.value[idx] ?? ''
  formulaExprByIdx.value = {
    ...formulaExprByIdx.value,
    [idx]: cur && !cur.endsWith(' ') ? `${cur} ${snippet}` : `${cur}${snippet}`,
  }
  scheduleApplyFormulaAtIndex(idx)
}

watch(
  selectList,
  (list) => {
    // Hydrate expression inputs from saved AST (after reload).
    const next: Record<number, string> = { ...formulaExprByIdx.value }
    let changed = false
    for (let i = 0; i < list.length; i++) {
      const sel = list[i]
      if (!sel || sel.kind !== 'formula') continue
      if (next[i] != null && String(next[i]).trim() !== '') continue
      const expr = astToExpr((sel as any).expr as StatsDataFormulaAst)
      if (expr) {
        next[i] = expr
        changed = true
      }
    }
    if (changed) formulaExprByIdx.value = next
  },
  { immediate: true },
)

function tokenizeFormula(input: string): FormulaToken[] {
  const out: FormulaToken[] = []
  let i = 0
  // Normalize common unicode variants (copy/paste, IME).
  const s = input
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/\u202F/g, ' ') // narrow nbsp
    .replace(/\u200B/g, '') // zero-width space
    .replace(/＋/g, '+') // fullwidth plus
    .replace(/﹢/g, '+')
    .replace(/－/g, '-') // fullwidth minus
    .replace(/＊/g, '*') // fullwidth asterisk
    .replace(/／/g, '/') // fullwidth slash
    .trim()
  while (i < s.length) {
    const ch = s[i]!
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (ch === ',') {
      out.push({ kind: 'comma' })
      i++
      continue
    }
    // Accept common typographic operator variants.
    if (ch === '×') {
      out.push({ kind: 'op', op: 'mul' })
      i++
      continue
    }
    if (ch === '÷') {
      out.push({ kind: 'op', op: 'div' })
      i++
      continue
    }
    if (ch === '−' || ch === '–') {
      out.push({ kind: 'op', op: 'sub' })
      i++
      continue
    }
    if (ch === '(') {
      out.push({ kind: 'lparen' })
      i++
      continue
    }
    if (ch === ')') {
      out.push({ kind: 'rparen' })
      i++
      continue
    }
    if (ch === '+') {
      out.push({ kind: 'op', op: 'add' })
      i++
      continue
    }
    if (ch === '-') {
      out.push({ kind: 'op', op: 'sub' })
      i++
      continue
    }
    if (ch === '*') {
      out.push({ kind: 'op', op: 'mul' })
      i++
      continue
    }
    if (ch === '/') {
      out.push({ kind: 'op', op: 'div' })
      i++
      continue
    }
    if (ch === '[') {
      const end = s.indexOf(']', i + 1)
      if (end === -1) throw new Error('Référence invalide: `]` manquant. Utilise le format [Nom de colonne].')
      const name = s.slice(i + 1, end).trim()
      if (!name) throw new Error('Référence invalide: vide. Utilise le format [Nom de colonne].')
      out.push({ kind: 'ref', ref: name })
      i = end + 1
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      let buf = ''
      while (i < s.length) {
        const c = s[i]!
        if (c === '\\\\' && i + 1 < s.length) {
          const n = s[i + 1]!
          buf += n
          i += 2
          continue
        }
        if (c === quote) break
        buf += c
        i++
      }
      if (i >= s.length || s[i] !== quote) throw new Error('Chaîne invalide: guillemet manquant.')
      i++
      out.push({ kind: 'string', value: buf })
      continue
    }
    const identMatch = s.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    if (identMatch) {
      const name = identMatch[0]!
      out.push({ kind: 'ident', name })
      i += name.length
      continue
    }
    // number (accept 12, 12.34, 12,34)
    const numMatch = s.slice(i).match(/^\d+([.,]\d+)?/)
    if (numMatch) {
      const raw = numMatch[0]!
      const n = Number(raw.replace(',', '.'))
      if (!Number.isFinite(n)) throw new Error(`Nombre invalide: ${raw}`)
      out.push({ kind: 'number', value: n })
      i += raw.length
      continue
    }
    throw new Error(`Caractère invalide: \`${ch}\`. Utilise les boutons (références + opérateurs) ou des nombres.`)
  }
  return out
}

function parseFormulaToAst(tokens: FormulaToken[]): StatsDataFormulaAst {
  let i = 0
  const peek = () => tokens[i]
  const next = () => tokens[i++]

  const expect = (kind: FormulaToken['kind']) => {
    const t = next()
    if (!t || t.kind !== kind) throw new Error('Expression invalide.')
    return t as any
  }

  const parsePrimary = (): StatsDataFormulaAst => {
    const t = peek()
    if (!t) throw new Error('Expression invalide.')
    if (t.kind === 'number') {
      next()
      return { kind: 'number', value: t.value }
    }
    if (t.kind === 'string') {
      next()
      return { kind: 'string', value: t.value }
    }
    if (t.kind === 'ref') {
      next()
      return { kind: 'ref', ref: t.ref }
    }
    if (t.kind === 'ident') {
      const name = t.name
      next()
      const after = peek()
      if (!after || after.kind !== 'lparen') throw new Error(`Fonction invalide: ${name}`)
      next() // (
      const args: StatsDataFormulaAst[] = []
      if (peek() && peek()!.kind !== 'rparen') {
        args.push(parseExpr())
        while (peek() && peek()!.kind === 'comma') {
          next()
          args.push(parseExpr())
        }
      }
      expect('rparen')
      return { kind: 'fn', fn: name as any, args }
    }
    if (t.kind === 'lparen') {
      next()
      const e = parseExpr()
      expect('rparen')
      return e
    }
    throw new Error('Expression invalide.')
  }

  const parseUnary = (): StatsDataFormulaAst => {
    const t = peek()
    if (t && t.kind === 'op' && t.op === 'sub') {
      next()
      return { kind: 'op', op: 'neg', args: [parseUnary()] }
    }
    return parsePrimary()
  }

  const parseMulDiv = (): StatsDataFormulaAst => {
    let left = parseUnary()
    while (true) {
      const t = peek()
      if (!t || t.kind !== 'op' || (t.op !== 'mul' && t.op !== 'div')) break
      next()
      const right = parseUnary()
      left = { kind: 'op', op: t.op, args: [left, right] }
    }
    return left
  }

  const parseAddSub = (): StatsDataFormulaAst => {
    let left = parseMulDiv()
    while (true) {
      const t = peek()
      if (!t || t.kind !== 'op' || (t.op !== 'add' && t.op !== 'sub')) break
      next()
      const right = parseMulDiv()
      left = { kind: 'op', op: t.op, args: [left, right] }
    }
    return left
  }

  const parseExpr = (): StatsDataFormulaAst => parseAddSub()

  const expr = parseExpr()
  if (i < tokens.length) throw new Error('Expression invalide.')
  return expr
}

const applyFormulaAtIndex = (idx: number) => {
  const cur = qDraft.value
  if (!cur) return
  try {
    const exprSrc = formulaExprByIdx.value[idx] ?? ''
    const ast = parseFormulaToAst(tokenizeFormula(exprSrc))
    const sel = cur.select[idx]
    if (!sel) return
    formulaErrorByIdx.value = { ...formulaErrorByIdx.value, [idx]: null }
    commitV2({
      ...cur,
      select: cur.select.map((c, i) => (i === idx ? { kind: 'formula', label: c.label, expr: ast } : c)),
    })
  } catch (e) {
    formulaErrorByIdx.value = {
      ...formulaErrorByIdx.value,
      [idx]: e instanceof Error ? e.message : 'Expression invalide.',
    }
  }
}

const scheduleApplyFormulaAtIndex = (idx: number, opts?: { immediate?: boolean }) => {
  const immediate = opts?.immediate === true
  const prev = formulaDebounceTimers.value[idx]
  if (typeof prev === 'number') window.clearTimeout(prev)
  if (immediate) {
    applyFormulaAtIndex(idx)
    return
  }
  const t = window.setTimeout(() => applyFormulaAtIndex(idx), 450)
  formulaDebounceTimers.value = { ...formulaDebounceTimers.value, [idx]: t }
}

onBeforeUnmount(() => {
  for (const k of Object.keys(formulaDebounceTimers.value)) {
    const idx = Number(k)
    const t = formulaDebounceTimers.value[idx]
    if (typeof t === 'number') window.clearTimeout(t)
  }
})

const toggleComputedAtIndex = (idx: number, checked: boolean) => {
  const cur = qDraft.value
  if (!cur) return
  const sel = cur.select[idx]
  if (!sel) return
  if (checked) {
    if (sel.kind === 'from') {
      lastFromByIdx.value = { ...lastFromByIdx.value, [idx]: sel.from }
    }
    // Switch to formula with a safe default until user applies an expression.
    commitV2({
      ...cur,
      select: cur.select.map((c, i) => (i === idx ? { kind: 'formula', label: c.label, expr: { kind: 'number', value: 0 } } : c)),
    })
    return
  }
  // Back to "from" using previous from when available.
  const fallbackFrom = lastFromByIdx.value[idx] ?? 's.'
  commitV2({
    ...cur,
    select: cur.select.map((c, i) => (i === idx ? { kind: 'from', label: c.label, from: fallbackFrom } : c)),
  })
}

const groupBy = computed(() => qDraft.value?.groupBy ?? [])
const toggleGroupBy = (label: string, checked: boolean) => {
  const cur = qDraft.value
  if (!cur) return
  const set = new Set(cur.groupBy ?? [])
  if (checked) set.add(label)
  else set.delete(label)
  commitV2({ ...cur, groupBy: [...set] })
}

const aggregations = computed<StatsDataQueryAggregationV2[]>(() => qDraft.value?.aggregations ?? [])
const addAgg = () => {
  const cur = qDraft.value
  if (!cur) return
  commitV2({
    ...cur,
    aggregations: [...(cur.aggregations ?? []), { label: `Agg ${aggregations.value.length + 1}`, fn: 'sum', expr: { kind: 'ref', ref: refOptions.value[0] ?? '' } }],
  })
}
const removeAgg = (index: number) => {
  const cur = qDraft.value
  if (!cur) return
  commitV2({ ...cur, aggregations: (cur.aggregations ?? []).filter((_, i) => i !== index) })
}
const patchAgg = (index: number, patch: Partial<StatsDataQueryAggregationV2>) => {
  const cur = qDraft.value
  if (!cur) return
  const next = (cur.aggregations ?? []).map((a, i) => (i === index ? { ...a, ...patch } : a))
  commitV2({ ...cur, aggregations: next })
}

const limitInput = computed(() => (qDraft.value?.limit == null ? '' : String(qDraft.value.limit)))
const setLimit = (ev: Event) => {
  const cur = qDraft.value
  if (!cur) return
  const raw = (ev.target as HTMLInputElement).value.trim()
  if (!raw) {
    const { limit, ...rest } = cur
    commitV2(rest)
    return
  }
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) commitV2({ ...cur, limit: Math.floor(n) })
}

const searchMode = computed(() => props.block.search?.mode ?? 'page')
const setSearchMode = (mode: 'page' | 'api') => {
  const b = props.block
  const nextSearch: StudioTableSearchConfig = {
    enabled: true,
    columnLabels: b.search?.columnLabels?.length ? [...b.search.columnLabels] : [],
    mode,
  }
  emit('push-payload', { ...b, search: nextSearch } as unknown as StudioBlockPayload)
}
</script>

<template>
  <details class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Sources</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>

    <template v-if="!isV2">
      <p class="mt-3 text-[11px] text-slate-600">Active le mode v2 pour configurer les sources.</p>
    </template>

    <template v-else-if="qDraft">
      <div
        v-if="selectedSource"
        class="mt-3 rounded-xl border border-slate-200/90 bg-white/85 px-2.5 py-2 text-[11px] text-slate-600"
      >
        <p class="font-semibold text-slate-800">{{ selectedSource.name }}</p>
        <p v-if="selectedSource.lastSnapshot" class="mt-1">
          <span :class="selectedSource.lastSnapshot.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'">
            {{ selectedSource.lastSnapshot.status === 'ok' ? 'Snapshot OK' : 'Échec snapshot' }}
          </span>
          <span v-if="typeof selectedSource.lastSnapshot.rowCount === 'number'">
            · {{ selectedSource.lastSnapshot.rowCount }} ligne(s)
          </span>
        </p>
      </div>

      <div class="mt-3 space-y-2 rounded-xl border border-slate-200/90 bg-white/75 px-2.5 py-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs font-semibold text-slate-800">Sources & jointure</p>
          <AppButton variant="ghost" size="sm" type="button" @click="addSource">+ Source</AppButton>
        </div>
        <ul class="flex flex-col gap-2">
          <li v-for="(se, i) in sourceEntries" :key="`src-${se.alias}-${i}`" class="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-end">
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Alias</label>
                <input
                  :value="se.alias"
                  type="text"
                  class="w-24 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-[11px] text-slate-900 outline-none focus:border-primary/40"
                  @change="
                    setSources(
                      sourceEntries.map((x) =>
                        x.alias === se.alias ? { ...x, alias: ($event.target as HTMLInputElement).value } : x,
                      ),
                    )
                  "
                />
              </div>
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Source</label>
                <AppSelect
                  :model-value="se.sourceId"
                  :options="dataSourceSelectOptions"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Source"
                  @change="
                    (v) =>
                      setSources(
                        sourceEntries.map((x) => (x.alias === se.alias ? { ...x, sourceId: String(v || '') } : x)),
                      )
                  "
                />
              </div>
              <div class="flex justify-end">
                <AppButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  class="text-rose-700"
                  :disabled="sourceEntries.length <= 1"
                  @click="removeSource(se.alias)"
                >
                  Retirer
                </AppButton>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="sourceEntries.length >= 2" class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <label class="text-[11px] font-semibold text-slate-700" :for="`${idPrefix}-join-type`">Type de jointure</label>
            <AppSelect
              :id="`${idPrefix}-join-type`"
              :model-value="joinType"
              :options="joinTypeSelectOptions"
              size="sm"
              button-class="rounded-lg bg-white px-2 py-1 text-[11px] text-slate-800 focus:ring-2 focus:ring-primary/20"
              panel-class="mt-1"
              aria-label="Type de jointure"
              @change="(v) => (joinType = String(v) as 'inner' | 'left')"
            />
          </div>

          <div v-if="joinFieldOptions.length" class="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
            <ul class="flex flex-col gap-1.5">
              <li v-for="f in joinFieldOptions" :key="`join-${f}`" class="flex items-center gap-2">
                <input
                  :id="`${idPrefix}-join-${f}`"
                  type="checkbox"
                  class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
                  :checked="joinOn.includes(f)"
                  @change="toggleJoinOnField(f, ($event.target as HTMLInputElement).checked)"
                />
                <label :for="`${idPrefix}-join-${f}`" class="text-sm text-slate-800">{{ f }}</label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </details>

  <div v-if="!isV2" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
    <p class="font-semibold">Formules & agrégations</p>
    <p class="mt-0.5">Active le mode v2 pour créer des colonnes calculées et des groupBy/sum/avg…</p>
    <div class="mt-2">
      <AppButton variant="secondary" size="sm" type="button" @click="enableV2">Passer aux formules (v2)</AppButton>
    </div>
  </div>

  <template v-else-if="qDraft">
    <details class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3" open>
      <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        <span>Colonnes</span>
        <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clip-rule="evenodd"
          />
        </svg>
      </summary>

      <div class="mt-3 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-700">Select</span>
          <AppButton variant="ghost" size="sm" type="button" :disabled="!block.dataBinding.sourceId" @click="addFromSelect">
            + From
          </AppButton>
        </div>

        <ul v-if="selectList.length" class="flex flex-col gap-2">
          <li v-for="(sel, idx) in selectList" :key="`sel-${idx}-${sel.kind}-${sel.label}`" class="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{{ sel.kind }}</span>
                <input
                  :value="sel.label"
                  type="text"
                  class="w-56 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-primary/40"
                  @change="setSelectLabel(idx, ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label class="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                    :checked="sel.kind === 'formula'"
                    @change="toggleComputedAtIndex(idx, ($event.target as HTMLInputElement).checked)"
                  />
                  Calculée
                </label>
                <AppButton variant="ghost" size="sm" type="button" class="text-rose-700" @click="removeSelect(idx)">Retirer</AppButton>
              </div>
            </div>

            <div v-if="sel.kind === 'from'" class="mt-2 grid grid-cols-1 gap-2">
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Alias</label>
                <AppSelect
                  :model-value="parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's'"
                  :options="aliasOptions"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Alias"
                  @change="(v) => setSelectFromParts(idx, String(v), parseFrom(sel.from).field)"
                />
              </div>
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Champ</label>
                <AppSelect
                  :model-value="parseFrom(sel.from).field"
                  :options="fieldOptionsForAlias(parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's')"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Champ"
                  @change="(v) => setSelectFromParts(idx, parseFrom(sel.from).alias || sourceEntries[0]?.alias || 's', String(v || ''))"
                />
              </div>
              <p class="sm:col-span-2 font-mono text-[10px] text-slate-500">from: {{ sel.from }}</p>
            </div>

            <div v-else class="mt-2 space-y-2 rounded-lg bg-slate-50 px-2 py-2">
              <div class="flex flex-col gap-2">
                <div class="grid grid-cols-1 gap-2">
                  <details
                    v-for="grp in formulaToolGroups"
                    :key="`ftg-${grp.id}`"
                    class="group rounded-xl border border-slate-200 bg-white/70 px-2 py-2"
                  >
                    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      <span>{{ grp.label }}</span>
                      <svg viewBox="0 0 20 20" fill="currentColor" class="details-chevron ml-auto h-4 w-4 text-slate-400 transition" aria-hidden="true">
                        <path
                          fill-rule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </summary>
                    <div class="mt-2 flex flex-wrap items-center gap-1">
                      <button
                        v-for="it in grp.items"
                        :key="`ftg-${grp.id}-${it.label}`"
                        type="button"
                        class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-slate-50"
                        :class="grp.id === 'text' ? 'text-orange-600' : it.insert.match(/^\d/) ? 'text-sky-600' : 'text-slate-700'"
                        @click="insertFormulaText(idx, it.insert)"
                      >
                        {{ it.label }}
                      </button>
                    </div>
                  </details>

                  <details class="group rounded-xl border border-slate-200 bg-white/70 px-2 py-2">
                    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      <span>Champs</span>
                      <svg viewBox="0 0 20 20" fill="currentColor" class="details-chevron ml-auto h-4 w-4 text-slate-400 transition" aria-hidden="true">
                        <path
                          fill-rule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </summary>
                    <div class="mt-2 flex flex-wrap gap-1">
                      <button
                        v-for="b in formulaFieldButtons"
                        :key="`fieldmenu-${idx}-${b.label}`"
                        type="button"
                        class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        :title="b.hint ? b.hint : undefined"
                        @click="insertFormulaText(idx, `[${b.label}]`)"
                      >
                        {{ b.label }}
                      </button>
                    </div>
                  </details>
                </div>

                <div class="flex flex-1 flex-wrap gap-1">
                  <button
                    v-for="b in formulaRefButtons.filter((x) => x.label !== sel.label)"
                    :key="`refbtn-${idx}-${b.label}`"
                    type="button"
                    class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    :title="b.hint ? b.hint : undefined"
                    @click="insertFormulaText(idx, `[${b.label}]`)"
                  >
                    {{ b.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Expression</label>
                <div class="relative">
                  <div
                    aria-hidden="true"
                    class="pointer-events-none w-full min-h-24 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[11px]"
                    v-html="highlightFormulaHtml(formulaExprByIdx[idx] ?? '') || '<span class=&quot;text-slate-400&quot;>[Champ A] * [Champ B] / 100</span>'"
                  />
                  <textarea
                    :value="formulaExprByIdx[idx] ?? ''"
                    rows="4"
                    class="absolute inset-0 w-full resize-none whitespace-pre-wrap break-words rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-mono text-[11px] text-transparent caret-slate-900 outline-none focus:border-primary/40"
                    @input="
                      (e) => {
                        formulaExprByIdx = { ...formulaExprByIdx, [idx]: (e.target as HTMLTextAreaElement).value }
                        scheduleApplyFormulaAtIndex(idx)
                      }
                    "
                    @blur="scheduleApplyFormulaAtIndex(idx, { immediate: true })"
                  />
                </div>
              </div>

              <p v-if="formulaErrorByIdx[idx]" class="text-[11px] text-rose-700">{{ formulaErrorByIdx[idx] }}</p>
            </div>
          </li>
        </ul>
      </div>
    </details>

    <details class="group mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
      <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        <span>Agrégations</span>
                      <svg viewBox="0 0 20 20" fill="currentColor" class="details-chevron ml-auto h-4 w-4 text-slate-400 transition" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clip-rule="evenodd"
          />
        </svg>
      </summary>

      <div class="mt-3 space-y-3">
        <div>
          <p class="text-[11px] font-medium text-slate-600">Group by</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <label v-for="r in refOptions" :key="`gb-${r}`" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs">
              <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" :checked="groupBy.includes(r)" @change="toggleGroupBy(r, ($event.target as HTMLInputElement).checked)" />
              {{ r }}
            </label>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-medium text-slate-600">Mesures</p>
          <AppButton variant="ghost" size="sm" type="button" @click="addAgg">+ Mesure</AppButton>
        </div>

        <ul v-if="aggregations.length" class="space-y-2">
          <li v-for="(a, i) in aggregations" :key="`agg-${i}-${a.label}`" class="rounded-xl border border-slate-200 bg-white p-2">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Libellé</label>
                <input :value="a.label" type="text" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-primary/40" @change="patchAgg(i, { label: ($event.target as HTMLInputElement).value })" />
              </div>
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Fn</label>
                <AppSelect
                  :model-value="a.fn"
                  :options="[
                    { value: 'sum', label: 'sum' },
                    { value: 'avg', label: 'avg' },
                    { value: 'min', label: 'min' },
                    { value: 'max', label: 'max' },
                    { value: 'count', label: 'count' },
                  ]"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Fonction"
                  @change="(v) => patchAgg(i, { fn: String(v) as any })"
                />
              </div>
              <div>
                <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Expr</label>
                <AppSelect
                  :model-value="(a.expr as any)?.ref ?? ''"
                  :options="[{ value: '', label: '—' }, ...refOptions.map((r) => ({ value: r, label: r }))]"
                  :disabled="a.fn === 'count'"
                  size="sm"
                  button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                  panel-class="mt-1"
                  aria-label="Expression"
                  @change="(v) => patchAgg(i, { expr: { kind: 'ref', ref: String(v || '') } })"
                />
              </div>
            </div>
            <div class="mt-2 flex justify-end">
              <AppButton variant="ghost" size="sm" type="button" class="text-rose-700" @click="removeAgg(i)">Retirer</AppButton>
            </div>
          </li>
        </ul>
      </div>
    </details>

    <details class="group mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
      <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        <span>Limite</span>
        <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clip-rule="evenodd"
          />
        </svg>
      </summary>

      <div class="mt-3">
        <label class="mb-0.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-v2-limit`">Limite de lignes (optionnel)</label>
        <input
          :id="`${idPrefix}-v2-limit`"
          :value="limitInput"
          type="number"
          min="1"
          placeholder="Défaut serveur"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary/40"
          @change="setLimit"
        />
      </div>
    </details>

    <details class="group mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
      <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        <span>Recherche</span>
        <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clip-rule="evenodd"
          />
        </svg>
      </summary>

      <div class="mt-3 flex flex-wrap gap-2">
        <div class="ml-auto flex flex-wrap gap-1">
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-[11px] font-semibold"
            :class="searchMode === 'page' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white/70'"
            @click="setSearchMode('page')"
          >
            Sur la page
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-[11px] font-semibold"
            :class="searchMode === 'api' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white/70'"
            @click="setSearchMode('api')"
          >
            Via l’API
          </button>
        </div>
      </div>
    </details>
  </template>
</template>

<style scoped>
details > summary .details-chevron {
  transform: rotate(0deg);
}
details[open] > summary .details-chevron {
  transform: rotate(180deg);
}
</style>

