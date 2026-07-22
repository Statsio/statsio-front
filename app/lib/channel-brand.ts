// Chaque chaîne éditoriale a une identité de couleur : sa propre couleur personnalisée si elle en a
// défini une (custom_color_primary/secondary côté API), sinon une couleur déterministe piochée dans
// la palette de marque — pour que chaque carte/chaîne reste visuellement distincte même sans réglage.

const PALETTE: readonly [string, string][] = [
  ['#8b5cf6', '#3b82f6'], // violet → bleu (Statsio)
  ['#0e7490', '#22d3ee'], // sarcelle → cyan
  ['#166534', '#4ade80'], // vert
  ['#e11d48', '#fb7185'], // rose
  ['#b45309', '#f59e0b'], // ambre
  ['#4338ca', '#818cf8'], // indigo
  ['#be185d', '#f472b6'], // fuchsia
  ['#0369a1', '#38bdf8'], // ciel
]

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export type ChannelColors = { primary: string; secondary: string }

export function resolveChannelColors(
  seed: string,
  customPrimary?: string | null,
  customSecondary?: string | null,
): ChannelColors {
  if (customPrimary) return { primary: customPrimary, secondary: customSecondary || customPrimary }
  const [primary, secondary] = PALETTE[hashSeed(seed) % PALETTE.length]!
  return { primary, secondary }
}

export function channelBannerStyle(primary: string, secondary: string): { background: string } {
  return { background: `linear-gradient(135deg, ${primary}, ${secondary})` }
}

export function channelAccentStyle(primary: string): Record<string, string> {
  return { '--color-primary': primary }
}

// Motif décoratif en losange, teinté avec la couleur de la chaîne — utilisé comme visuel de
// substitution pour les vignettes de contenu sans image (cf. maquette « Chaînes · Profil »).
export function channelPatternStyle(primary: string): Record<string, string> {
  const light = `color-mix(in srgb, ${primary} 10%, white)`
  const dark = `color-mix(in srgb, ${primary} 18%, white)`
  return {
    backgroundImage: `repeating-linear-gradient(45deg, ${light} 0px, ${light} 10px, ${dark} 10px, ${dark} 20px)`,
    color: primary,
  }
}
