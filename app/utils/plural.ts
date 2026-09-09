/**
 * Accord en nombre à la française : singulier pour -1 ≤ n ≤ 1, pluriel au-delà.
 * `plural('dataset', 2)` → « datasets » ; `plural('contenu', 1, 'contenus')` → « contenu ».
 */
export function plural(singular: string, n: number, many = `${singular}s`): string {
  return Math.abs(n) > 1 ? many : singular
}
