export type FormulaToken =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'ref'; ref: string }
  | { kind: 'op'; op: 'add' | 'sub' | 'mul' | 'div' }
  | { kind: 'comma' }
  | { kind: 'ident'; name: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }

