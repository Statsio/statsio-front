const categoryPalette = [
  'text-[var(--color-primary)]',
  'text-[var(--color-accent)]',
  'text-emerald-600',
  'text-amber-600',
  'text-rose-600',
] as const

function hashIndex(value: string, mod: number) {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return hash % mod
}

export function getCategoryColorClass(category: string): string {
  return categoryPalette[hashIndex(category, categoryPalette.length)]
}
