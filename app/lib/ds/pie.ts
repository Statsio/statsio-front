/**
 * Géométrie des camemberts de la charte « Tranches ».
 * Angles en degrés, 0° = 3 h, sens horaire (repère SVG). Un camembert
 * commence à -90° (midi) et se dessine dans le sens horaire.
 */

const RAD = Math.PI / 180

export const PIE_START = -90

export type PieSlice = {
  /** angle de départ (degrés) */
  a0: number
  /** angle de fin (degrés) */
  a1: number
}

const fmt = (n: number) => Number(n.toFixed(2))

/** Chemin SVG d'une tranche (secteur) de centre (cx, cy) et de rayon r. */
export function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const span = a1 - a0
  if (span <= 0.01) return ''
  if (span >= 359.99) {
    return `M${fmt(cx - r)} ${fmt(cy)} A${r} ${r} 0 1 1 ${fmt(cx + r)} ${fmt(cy)} A${r} ${r} 0 1 1 ${fmt(cx - r)} ${fmt(cy)} Z`
  }
  const x0 = cx + r * Math.cos(a0 * RAD)
  const y0 = cy + r * Math.sin(a0 * RAD)
  const x1 = cx + r * Math.cos(a1 * RAD)
  const y1 = cy + r * Math.sin(a1 * RAD)
  return `M${fmt(cx)} ${fmt(cy)} L${fmt(x0)} ${fmt(y0)} A${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${fmt(x1)} ${fmt(y1)} Z`
}

/**
 * Répartit des valeurs en tranches contiguës à partir de `start`.
 * Les valeurs négatives ou non finies comptent pour 0 ; un total nul donne
 * des tranches vides (a0 === a1).
 */
export function segmentsToAngles(values: number[], start = PIE_START, total?: number): PieSlice[] {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0))
  const sum = total ?? clean.reduce((a, v) => a + v, 0)
  let a = start
  return clean.map((v) => {
    const span = sum > 0 ? (360 * v) / sum : 0
    const slice = { a0: a, a1: a + span }
    a += span
    return slice
  })
}

/** Décalage (dx, dy) qui détache une tranche de `d` unités le long de sa bissectrice. */
export function sliceOffset(slice: PieSlice, d: number): { x: number; y: number } {
  const mid = ((slice.a0 + slice.a1) / 2) * RAD
  return { x: fmt(Math.cos(mid) * d), y: fmt(Math.sin(mid) * d) }
}

/** Ease-in-out sinusoïdal — le balayage du camembert. */
export const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Ease-out cubique — les éléments qui « glissent ». */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Pourcentage arrondi, borné à [0, 100]. */
export function percentOf(part: number, total: number): number {
  if (!total || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)))
}

/** Segment d'un camembert DsPie. */
export type DsPieSegment = {
  value: number
  color: string
  label?: string
  /** « votre part » : violet clair, voir --ds-vous */
  you?: boolean
}
