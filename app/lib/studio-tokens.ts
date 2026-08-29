/**
 * Substitution des jetons `{{nom}}` dans une chaîne.
 *
 * Utilisé pour injecter :
 *  - les paramètres de page template (`studio.pageParams`) ;
 *  - la valeur courante d'un bloc boucle (`{{item}}`) dans les filtres / titres /
 *    textes des blocs enfants (voir `LoopBlock.vue`, `useBlockData`).
 *
 * Le nom du jeton peut contenir des espaces, accents, `/`, etc. — il correspond
 * en général à un nom de colonne brut (ex. `{{Code postal}}`,
 * `{{Commune / Arrondissement Municipal}}`). Les espaces autour du nom sont
 * ignorés (`{{ ville }}` ≡ `{{ville}}`).
 *
 * Un jeton non résolu est laissé tel quel (utile pour repérer une faute de nom).
 *
 * ⚠️ Ce motif est la référence unique du Studio — le garder synchronisé avec
 * `TextBlock.vue`, `useBlockData.ts` et `useStatsDataDetail.ts`.
 */
export const STUDIO_TOKEN_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

export function interpolateTokens(value: string, map: Record<string, string> | undefined | null): string {
  if (!value || !map) return value
  return value.replace(STUDIO_TOKEN_PATTERN, (match, key: string) => map[key] ?? match)
}
