import type { ContentType } from '@/types/content-creation'

export type ContentCreationIcon = 'stats' | 'articles' | 'polls'

export interface ContentCreationMenuItem {
  id: ContentType
  label: string
  description: string
  icon: ContentCreationIcon
}

export const CONTENT_CREATION_MENU_ITEMS: ContentCreationMenuItem[] = [
  {
    id: 'statsdata',
    label: 'StatsData',
    description: 'Graphiques, blocs et tableaux dans le studio.',
    icon: 'stats',
  },
  {
    id: 'article',
    label: 'Article',
    description: 'Format éditorial enrichi par les données.',
    icon: 'articles',
  },
  {
    id: 'survey',
    label: 'Sondage',
    description: 'Créez et publiez un nouveau sondage.',
    icon: 'polls',
  },
]
