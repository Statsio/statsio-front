const compactNumberFormatter = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value)
}
