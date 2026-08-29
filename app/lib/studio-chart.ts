import type { ChartMarkRule } from '@/types/studio'

/**
 * Couleur d'une marque de graphique selon les règles conditionnelles (Phase 5).
 * Renvoie `fallback` si aucune règle ne s'applique. La première règle qui matche gagne.
 */
export function markColor(
  rules: ChartMarkRule[] | undefined,
  value: number | null,
  ctx: { min: number; max: number; ref: number | null },
  fallback: string,
): string {
  if (!rules?.length || value === null || Number.isNaN(value)) return fallback

  for (const rule of rules) {
    let hit = false
    switch (rule.when) {
      case 'positive': hit = value > 0; break
      case 'negative': hit = value < 0; break
      case 'gt': hit = rule.value !== undefined && value > rule.value; break
      case 'lt': hit = rule.value !== undefined && value < rule.value; break
      case 'top': hit = value === ctx.max; break
      case 'bottom': hit = value === ctx.min; break
      case 'above-ref': hit = ctx.ref !== null && value > ctx.ref; break
      case 'below-ref': hit = ctx.ref !== null && value < ctx.ref; break
    }
    if (hit) return rule.color
  }
  return fallback
}
