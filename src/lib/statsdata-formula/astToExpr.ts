import type { StatsDataFormulaAst } from '@/types/statsdata-query-v2'

export function astToExpr(ast: StatsDataFormulaAst): string {
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

