import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type {
  HelpArticleCategoryRef,
  HelpArticleDetail,
  HelpArticleDetailResponse,
  HelpArticleSummary,
  HelpCategory,
  HelpCategoryDetailResponse,
  HelpFeedbackResponse,
  HelpHomeResponse,
} from '@/types/help'

interface RawHelpCategory {
  slug: string
  name: string
  icon?: string | null
  color?: string | null
  description?: string | null
  articles_count: number
}

interface RawHelpArticleSummary {
  slug: string
  title: string
  excerpt?: string | null
  updated_at?: string | null
  category?: { slug: string; name: string } | null
}

interface RawHelpArticleDetail extends RawHelpArticleSummary {
  id: number
  content_html: string
}

function mapCategory(raw: RawHelpCategory): HelpCategory {
  return {
    slug: raw.slug,
    name: raw.name,
    icon: raw.icon ?? null,
    color: raw.color ?? null,
    description: raw.description ?? null,
    articlesCount: raw.articles_count ?? 0,
  }
}

function mapCategoryRef(raw?: { slug: string; name: string } | null): HelpArticleCategoryRef | null {
  return raw ? { slug: raw.slug, name: raw.name } : null
}

function mapArticleSummary(raw: RawHelpArticleSummary): HelpArticleSummary {
  return {
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt ?? null,
    updatedAt: raw.updated_at ?? null,
    category: mapCategoryRef(raw.category),
  }
}

function mapArticleDetail(raw: RawHelpArticleDetail): HelpArticleDetail {
  return {
    ...mapArticleSummary(raw),
    id: raw.id,
    contentHtml: raw.content_html,
  }
}

/** Accueil du centre d'aide : catégories, articles populaires et récents. */
export async function fetchHelpHome(): Promise<HelpHomeResponse> {
  const { data } = await apiHttp.get<{
    success: boolean
    data: { categories: RawHelpCategory[]; popular: RawHelpArticleSummary[]; recent: RawHelpArticleSummary[] }
  }>(STATSIO_API.help.home)

  return {
    categories: (data.data?.categories ?? []).map(mapCategory),
    popular: (data.data?.popular ?? []).map(mapArticleSummary),
    recent: (data.data?.recent ?? []).map(mapArticleSummary),
  }
}

/** Catégorie + liste de ses articles actifs. */
export async function fetchHelpCategory(slug: string): Promise<HelpCategoryDetailResponse> {
  const { data } = await apiHttp.get<{
    success: boolean
    data: { category: RawHelpCategory; articles: RawHelpArticleSummary[] }
  }>(STATSIO_API.help.category(slug))

  return {
    category: mapCategory(data.data.category),
    articles: (data.data.articles ?? []).map(mapArticleSummary),
  }
}

/** Détail d'un article du centre d'aide. */
export async function fetchHelpArticle(categorySlug: string, articleSlug: string): Promise<HelpArticleDetailResponse> {
  const { data } = await apiHttp.get<{
    success: boolean
    data: { article: RawHelpArticleDetail; category: RawHelpCategory }
  }>(STATSIO_API.help.article(categorySlug, articleSlug))

  return {
    article: mapArticleDetail(data.data.article),
    category: mapCategory(data.data.category),
  }
}

/** Recherche simple (titre / extrait) parmi les articles actifs. */
export async function searchHelp(q: string): Promise<HelpArticleSummary[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawHelpArticleSummary[] }>(STATSIO_API.help.search, {
    params: { q },
  })
  return (data.data ?? []).map(mapArticleSummary)
}

/** Vote "utile" / "pas utile" sur un article, public et anonyme. */
export async function sendHelpFeedback(articleId: number, helpful: boolean): Promise<HelpFeedbackResponse> {
  const { data } = await apiHttp.post<{
    success: boolean
    data: { helpful_yes_count: number; helpful_no_count: number }
  }>(STATSIO_API.help.feedback(articleId), { helpful })

  return {
    helpfulYesCount: data.data.helpful_yes_count,
    helpfulNoCount: data.data.helpful_no_count,
  }
}
