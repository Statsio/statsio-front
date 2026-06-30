import { apiHttp } from '@/lib/http'
import type { ContentCategory } from '@/types/content-creation'

export async function fetchContentCategories(): Promise<ContentCategory[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: ContentCategory[] }>(
    '/content-categories',
  )
  return data.data
}
