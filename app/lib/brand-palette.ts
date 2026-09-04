import type { SubBrand } from '@/types/sub-brand'

/**
 * Palette hex d'une sous-marque — miroir des tokens `[data-theme]` de
 * `app/assets/tokens.css`. Utile hors du cascading `[data-theme]` (modales
 * en `Teleport to="body"`, canvas, e-mails…) où `var(--color-primary)`
 * retomberait sinon sur la valeur Statsio par défaut.
 */
export interface BrandPalette {
  primary: string
  accent: string
  /** Fond de pastille / puce. */
  soft: string
  /** Texte ou icône posé sur `soft`. */
  softFg: string
}

export const BRAND_PALETTES: Record<SubBrand, BrandPalette> = {
  statsio: { primary: '#8b5cf6', accent: '#3b82f6', soft: '#f2ecfd', softFg: '#6d28d9' },
  tvstats: { primary: '#166534', accent: '#22c55e', soft: '#dcfce7', softFg: '#166534' },
  medistats: { primary: '#991b1b', accent: '#ef4444', soft: '#fee2e2', softFg: '#991b1b' },
}

export function getBrandPalette(brand: SubBrand | null | undefined): BrandPalette {
  return (brand && BRAND_PALETTES[brand]) || BRAND_PALETTES.statsio
}

/** Variables CSS à poser en `:style` pour reteinter une sous-arborescence. */
export function brandCssVars(brand: SubBrand | null | undefined): Record<string, string> {
  const p = getBrandPalette(brand)
  return {
    '--color-primary': p.primary,
    '--color-secondary': p.soft,
    '--color-accent': p.accent,
  }
}
