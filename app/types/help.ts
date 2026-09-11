/**
 * Centre d'aide public : catégories et articles gérés en back-office
 * (Filament, ressources HelpCategory/HelpArticle).
 */
export interface HelpCategory {
  slug: string
  name: string
  icon?: string | null
  color?: string | null
  description?: string | null
  articlesCount: number
}

export interface HelpArticleCategoryRef {
  slug: string
  name: string
}

export interface HelpArticleSummary {
  slug: string
  title: string
  excerpt?: string | null
  updatedAt?: string | null
  category?: HelpArticleCategoryRef | null
}

export interface HelpArticleDetail extends HelpArticleSummary {
  id: number
  contentHtml: string
}

export interface HelpHomeResponse {
  categories: HelpCategory[]
  popular: HelpArticleSummary[]
  recent: HelpArticleSummary[]
}

export interface HelpCategoryDetailResponse {
  category: HelpCategory
  articles: HelpArticleSummary[]
}

export interface HelpArticleDetailResponse {
  article: HelpArticleDetail
  category: HelpCategory
}

export interface HelpFeedbackResponse {
  helpfulYesCount: number
  helpfulNoCount: number
}
