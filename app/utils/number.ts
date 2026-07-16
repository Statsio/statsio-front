const compactFormatter = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

/** Notation compacte (k/M) au-delà de 10 000, sinon format fr-FR standard — évite les longues
 * suites de chiffres pour des valeurs brutes (ex. personnes vivant avec une maladie). */
export function formatCompactNumber(value: number): string {
  return Math.abs(value) >= 10_000 ? compactFormatter.format(value) : value.toLocaleString('fr-FR')
}
