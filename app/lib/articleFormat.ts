import { CATALOG_FORMAT_STYLE, catalogThemeKey } from '@/lib/catalog-theme'

/**
 * Format éditorial d'un article dérivé de ses `categories` — miroir de
 * `StudioContentListing::extractFormat` côté API. Le format est la 1re catégorie
 * qui correspond à une clé connue ; le « thème » est la 1re catégorie restante.
 */
const FORMAT_KEYS = ['enquete', 'decryptage', 'dossier', 'breve'] as const

export interface ArticleFormat {
  /** Libellé court du format (ex. « ENQUÊTE »), ou null si aucun format déclaré. */
  formatLabel: string | null
  /** Thème éditorial (catégorie hors format), en majuscules — ou null. */
  theme: string | null
}

export function resolveArticleFormat(categories: string[] | undefined | null): ArticleFormat {
  const list = (categories ?? []).filter((c): c is string => typeof c === 'string' && c.trim() !== '')

  let formatLabel: string | null = null
  const themeCandidates: string[] = []
  for (const category of list) {
    const key = catalogThemeKey(category)
    if (!formatLabel && (FORMAT_KEYS as readonly string[]).includes(key)) {
      formatLabel = CATALOG_FORMAT_STYLE[key]?.label ?? category.toUpperCase()
    } else {
      themeCandidates.push(category)
    }
  }

  return {
    formatLabel,
    theme: themeCandidates[0] ? themeCandidates[0].toUpperCase() : null,
  }
}
