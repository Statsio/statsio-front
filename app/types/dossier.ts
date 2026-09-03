/**
 * Dossier éditorial : conteneur nommé (titre, description, image) regroupant
 * plusieurs contenus autour d'un sujet suivi. Catalogue global géré en back-office.
 */
export interface Dossier {
  id: number
  slug: string
  name: string
  description?: string | null
  imageUrl?: string | null
  /** Slugs des catégories de contenu rattachées (présent sur `/dossiers` et les suggestions). */
  categorySlugs?: string[]
}

/**
 * Dossier épinglé en back-office, affiché en badge dans la barre de navigation
 * du header (payload allégé : identité seulement).
 */
export interface PinnedDossier {
  id: number
  slug: string
  name: string
}
