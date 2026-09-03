/**
 * Sous-marque de publication (« domaine ») d'un contenu ou d'une chaîne.
 * Miroir des cas concrets de `App\Domain\Content\Enums\SubBrandEnum` côté API
 * (la valeur `all` reste une classification back-office, non proposée ici).
 */
export type SubBrand = 'statsio' | 'tvstats' | 'medistats'

export const SUB_BRAND_OPTIONS: { value: SubBrand; label: string }[] = [
  { value: 'statsio', label: 'Statsio' },
  { value: 'tvstats', label: 'TVStats' },
  { value: 'medistats', label: 'Medistats' },
]

/** Valeur brute renvoyée par l'API pour une catégorie (peut être « toutes les marques »). */
export type CategorySubBrand = 'all' | SubBrand

/** Normalise une valeur d'API (`all`, `null`, inconnue…) vers un domaine choisissable. */
export function normalizeSubBrand(value: string | null | undefined): SubBrand {
  return value === 'tvstats' || value === 'medistats' ? value : 'statsio'
}

/** Une catégorie est-elle proposée pour ce domaine ? (`all` = partout.) */
export function categoryMatchesDomain(
  categorySubBrand: CategorySubBrand | null | undefined,
  domain: SubBrand,
): boolean {
  return !categorySubBrand || categorySubBrand === 'all' || categorySubBrand === domain
}
