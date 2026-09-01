import tvstatsLogo from '@/assets/brand/tvstats/tvstats-logo.svg'
import medistatsLogo from '@/assets/brand/medistats/medistats-logo.svg'
import { catalogThemeKey } from '@/lib/catalog-theme'
import { publicContentListPath } from '@/lib/content-display'
import type { ContentType } from '@/types/content-creation'

/**
 * Sous-marque Statsio (TVStats, Medistats) déduite des catégories d'un contenu.
 * Sert à afficher la pastille « Publié sur … » sur les cartes du catalogue et de
 * la page d'accueil : un contenu classé « santé » vit aussi sur Medistats, un
 * contenu « tv / people / médias » sur TVStats.
 */
export type ContentSubBrand = {
  id: 'tvstats' | 'medistats'
  name: string
  logo: string
  basePath: string
}

const SUB_BRANDS: Array<ContentSubBrand & { categories: string[] }> = [
  {
    id: 'tvstats',
    name: 'TVStats',
    logo: tvstatsLogo,
    basePath: '/tvstats',
    categories: ['tv', 'people', 'medias'],
  },
  {
    id: 'medistats',
    name: 'Medistats',
    logo: medistatsLogo,
    basePath: '/medistats',
    categories: ['sante'],
  },
]

export function resolveContentSubBrand(
  categories: string[] | null | undefined,
): ContentSubBrand | null {
  if (!categories?.length) return null
  const keys = categories.map(catalogThemeKey)
  for (const brand of SUB_BRANDS) {
    if (brand.categories.some((c) => keys.includes(c))) {
      const { categories: _omit, ...rest } = brand
      return rest
    }
  }
  return null
}

/** Lien de la pastille : la liste du même type de contenu, côté sous-marque. */
export function subBrandContentPath(brand: ContentSubBrand, type: ContentType): string {
  return publicContentListPath(type, brand.basePath)
}
