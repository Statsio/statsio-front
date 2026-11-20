import { computed } from 'vue'
import { fetchContentCategories } from '@/api/content-categories'

/**
 * Table « slug de catégorie de contenu → nom » (les facettes du catalogue public
 * renvoient le slug comme libellé). Chargée une fois, partagée en SSR ; vide en
 * cas d'échec (on retombe alors sur le slug).
 */
export function useContentCategoryNames() {
  const { data } = useAsyncData(
    'content-category-names',
    async () => {
      const categories = await fetchContentCategories().catch(() => [])
      return Object.fromEntries(categories.map((c) => [c.slug, c.name])) as Record<string, string>
    },
    { default: () => ({}) as Record<string, string> },
  )
  return computed(() => data.value ?? {})
}
