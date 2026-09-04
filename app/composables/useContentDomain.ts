import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'
import type { SubBrand } from '@/types/sub-brand'

/**
 * Domaine (« sous-marque ») actif, déduit du préfixe de route :
 * `/tvstats/*` → `tvstats`, `/medistats/*` → `medistats`, sinon `statsio`.
 * C'est la valeur envoyée en paramètre `sub_brand` aux catalogues publics
 * (contenus, chaînes, dossiers) pour ne montrer que ce qui vit sur ce site.
 * `brandConfigs[*].id` vaut déjà exactement une valeur de `SubBrand`.
 */
export function useContentDomain() {
  const route = useRoute()
  return computed<SubBrand>(() => getBrandFromPath(route.path).id as SubBrand)
}
