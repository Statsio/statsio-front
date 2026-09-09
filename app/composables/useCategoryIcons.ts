import { fetchContentCategories } from '@/api/content-categories'
import { getChannelCategories } from '@/api/channels'
import { fetchTvCategories } from '@/api/tv-channel'
import { catalogThemeKey } from '@/lib/catalog-theme'

/**
 * Résolution « catégorie (slug ou libellé) → nom d'icône Heroicons ».
 *
 * Les catalogues publics n'exposent souvent qu'un slug/libellé de catégorie sur
 * chaque contenu (pas l'objet complet). On charge donc une fois les trois listes
 * de catégories (contenu, chaîne, TV) et on construit une table indexée à la fois
 * par slug normalisé et par nom normalisé, réutilisée partout où une pastille de
 * catégorie s'affiche (mégamenu, filtres de catalogue…).
 */
export function useCategoryIcons() {
  const map = useState<Record<string, string>>('category-icons-map', () => ({}))
  const status = useState<'idle' | 'loading' | 'ready'>('category-icons-status', () => 'idle')

  async function ensureCategoryIcons(): Promise<void> {
    if (status.value !== 'idle') return
    status.value = 'loading'
    try {
      const [content, channels, tv] = await Promise.all([
        fetchContentCategories().catch(() => []),
        getChannelCategories().catch(() => []),
        fetchTvCategories().catch(() => []),
      ])

      const next: Record<string, string> = {}
      const add = (key: string | null | undefined, icon: string | null | undefined) => {
        if (!key || !icon) return
        const normalized = catalogThemeKey(key)
        if (normalized && !next[normalized]) next[normalized] = icon
      }

      for (const c of content) {
        add(c.slug, c.icon)
        add(c.name, c.icon)
      }
      for (const c of channels) {
        add(c.slug, c.icon)
        add(c.label, c.icon)
      }
      for (const c of tv) {
        add(c.slug, c.icon)
        add(c.name, c.icon)
      }

      map.value = next
      status.value = 'ready'
    } catch {
      status.value = 'idle'
    }
  }

  function categoryIconName(category: string | null | undefined): string | null {
    if (!category) return null
    return map.value[catalogThemeKey(category)] ?? null
  }

  return { ensureCategoryIcons, categoryIconName, categoryIconMap: map }
}
