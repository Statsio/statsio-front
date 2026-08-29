// Shared helpers for the Studio inspector field primitives (`fields/*`).

export interface SegOption {
  label: string
  value: string | number
  /** Optional flex weight for the segmented control (defaults to 1). */
  flex?: number
}

export type SegOptionInput = SegOption | string | number

export function normalizeOptions(opts: readonly SegOptionInput[]): SegOption[] {
  return opts.map((o) =>
    typeof o === 'object' ? o : { label: String(o), value: o },
  )
}
