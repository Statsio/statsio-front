import { apiHttp } from '@/lib/http'
import type { PromoCategory } from '@/types/promo-category'
import type { SubBrand } from '@/types/sub-brand'

export async function fetchPromoCategories(subBrand?: SubBrand): Promise<PromoCategory[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: PromoCategory[] }>('/promo-categories', {
    params: subBrand ? { sub_brand: subBrand } : {},
  })
  return data.data
}
