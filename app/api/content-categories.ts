import { apiHttp } from '@/lib/http'
import type { ContentCategory } from '@/types/content-creation'
import type { SubBrand } from '@/types/sub-brand'

export async function fetchContentCategories(subBrand?: SubBrand): Promise<ContentCategory[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: ContentCategory[] }>(
    '/content-categories',
    { params: subBrand ? { sub_brand: subBrand } : {} },
  )
  return data.data
}
