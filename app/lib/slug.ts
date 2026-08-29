/**
 * Transforme une valeur en segment d'URL sûr : minuscules, sans accents, mots
 * séparés par des tirets. Utilisé pour les slugs de page et pour les URL
 * générées par valeur (fan-out — plan Statsdata v2).
 */
export function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
