import { apiHttp } from '@/lib/http'
import type { PromoCategory } from '@/types/promo-category'

export async function fetchPromoCategories(): Promise<PromoCategory[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: PromoCategory[] }>('/promo-categories')
  return data.data
}
