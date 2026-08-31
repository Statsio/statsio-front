const KNOWN_THEME: Record<string, { fg: string; bg: string; dot: string }> = {
  energie: { fg: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  sante: { fg: '#047857', bg: '#e7f7f0', dot: '#059669' },
  climat: { fg: '#2563eb', bg: '#eaf1fe', dot: '#3b82f6' },
  economie: { fg: '#7c3aed', bg: '#f2ecfd', dot: '#7c3aed' },
  societe: { fg: '#be123c', bg: '#fdeef1', dot: '#e11d48' },
  medias: { fg: '#6d28d9', bg: '#f2ecfd', dot: '#a78bfa' },
  tv: { fg: '#6d28d9', bg: '#f2ecfd', dot: '#a78bfa' },
  people: { fg: '#be123c', bg: '#fdeef1', dot: '#e11d48' },
}

const FALLBACK_DOTS = ['#8b5cf6', '#3b82f6', '#059669', '#f59e0b', '#e11d48', '#a78bfa']

export const CATALOG_FORMAT_STYLE: Record<string, { label: string; fg: string; bg: string }> = {
  enquete: { label: 'ENQUÊTE', fg: '#be123c', bg: '#fdeef1' },
  decryptage: { label: 'DÉCRYPTAGE', fg: '#2563eb', bg: '#eaf1fe' },
  dossier: { label: 'DOSSIER', fg: '#7c3aed', bg: '#f2ecfd' },
  breve: { label: 'BRÈVE', fg: 'rgba(24,24,31,0.6)', bg: '#f4f3f8' },
}

export function catalogThemeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function catalogThemeStyle(category: string | null | undefined): { fg: string; bg: string; dot: string } {
  if (!category) return { fg: '#7c3aed', bg: '#f2ecfd', dot: '#8b5cf6' }
  const known = KNOWN_THEME[catalogThemeKey(category)]
  if (known) return known
  const dot = FALLBACK_DOTS[hashIndex(category, FALLBACK_DOTS.length)] ?? FALLBACK_DOTS[0]!
  return { fg: dot, bg: '#f4f3f8', dot }
}

function hashIndex(value: string, mod: number) {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return hash % mod
}
