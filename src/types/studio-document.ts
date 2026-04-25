import type { StatsDataQueryRequest } from '@/types/statsdata-query'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { defaultStudioBlockDataBinding } from '@/types/studio-data-source'

export type StudioDocumentKind = 'statsdata' | 'article'

export type StudioPage = {
  id: string
  name: string
  blocks: StudioBlock[]
  visible_in_tabs?: boolean
  visibility?: 'inherit' | 'public' | 'password' | 'private'
  password?: string | null
  order?: number
}

export type StudioBlockType =
  | 'text_heading'
  | 'text_paragraph'
  | 'layout_2col'
  | 'layout_3col'
  | 'chart'
  | 'chart_line'
  | 'chart_pie'
  | 'chart_donut'
  | 'table'
  | 'kpi'
  | 'callout'
  | 'divider'
  | 'image'
  | 'search_bar'
  | 'link'
  | 'link_button'
  | 'link_back'

export type StudioBlockAction =
  | {
      type: 'navigate_to_page'
      targetPageId: string
      /** Colonnes de la source à passer comme filtres à la page cible */
      passColumns?: string[]
    }
  | {
      type: 'set_filters'
      /** Filtres à appliquer aux blocs de la page courante */
      filters: Record<string, string>
    }

export type StudioSearchBarConfig = {
  /** Source de données dans laquelle rechercher */
  sourceId: string
  /** Colonnes dans lesquelles effectuer la recherche */
  searchColumns: string[]
  /** Formules de colonnes pour l'affichage des résultats */
  displayFormulas?: Array<{
    label: string
    formula: string
  }>
  /** Placeholder du champ de recherche */
  placeholder?: string
  /** Action à exécuter lors du clic sur un résultat */
  onResultClick?: StudioBlockAction
  /** Requête StatsData pour rechercher via l'API (mode remote) */
  query?: StatsDataQueryRequest
  /** @deprecated Utiliser displayFormulas à la place */
  displayColumns?: string[]
}

/** Filtrage côté client au-dessus du tableau (non envoyé au serveur de requêtes). */
export type StudioTableSearchConfig = {
  enabled: boolean
  /** Libellés d’en-tête à fouiller ; vide = toutes les colonnes affichées du tableau. */
  columnLabels: string[]
  /** Mode de recherche dans le tableau (local page vs requête serveur). */
  mode?: 'page' | 'api'
  /** Affichage du bloc sur le canvas : barre seule (transparent) ou tableau complet. */
  display?: 'bar_only' | 'table'
}

/** Filtrage côté client au-dessus du tableau (par colonnes, sur la page affichée). */
export type StudioTableFilterConfig = {
  enabled: boolean
  /** Libellés d’en-tête filtrables ; vide = toutes les colonnes affichées du tableau. */
  columnLabels: string[]
}

export type StudioTextStyle = {
  /** CSS color, ex. "#111827" */
  color?: string
  /** CSS background-color for highlight, ex. "#FEF08A" */
  highlight?: string
  /** CSS font-family, ex. "ui-sans-serif, system-ui" */
  fontFamily?: string
  /** CSS font-weight, ex. 400, 600, 700 */
  fontWeight?: number
  italic?: boolean
  underline?: boolean
  strike?: boolean
  align?: 'left' | 'center' | 'right' | 'justify'
}

/** Corps JSON d’un bloc tel que stocké côté API (sans identifiant client). */
export type StudioBlockPayload =
  | { type: 'text_heading'; text: string; style?: StudioTextStyle }
  | { type: 'text_paragraph'; text: string; style?: StudioTextStyle }
  | {
      type: 'layout_2col' | 'layout_3col'
      /** Colonnes de blocs (chaque bloc est un StudioBlock complet avec id). */
      columns: StudioBlock[][]
      gap?: 'sm' | 'md' | 'lg'
    }
  | {
      type: 'chart' | 'chart_line' | 'chart_pie' | 'chart_donut'
      caption: string
      dataBinding: StudioBlockDataBinding
      query?: StatsDataQueryRequest
      search?: StudioTableSearchConfig
      filters?: StudioTableFilterConfig
    }
  | { type: 'kpi'; label: string; value: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'slate' }
  | { type: 'callout'; title: string; text: string; tone?: 'info' | 'success' | 'warning' | 'danger' }
  | { type: 'divider' }
  | {
      type: 'table'
      caption: string
      dataBinding: StudioBlockDataBinding
      query?: StatsDataQueryRequest
      search?: StudioTableSearchConfig
      filters?: StudioTableFilterConfig
      rowsPerPage?: number
    }
  | { type: 'image'; alt: string }
  | { type: 'search_bar'; config: StudioSearchBarConfig }
  | { type: 'link'; label: string; url: string; targetPageId?: string; style?: StudioTextStyle }
  | { type: 'link_button'; label: string; url: string; targetPageId?: string; style?: StudioTextStyle }
  | { type: 'link_back'; label: string; url: string; targetPageId?: string; style?: StudioTextStyle }

export type StudioBlock = { id: string } & StudioBlockPayload

export type StudioDocumentSettings = {
  subtitle: string
  visibility: 'private' | 'team' | 'public'
}

export type StudioPaletteItem = {
  paletteId: string
  blockType: StudioBlockType
  label: string
  description: string
}

export function newStudioBlockId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `blk_${Math.random().toString(36).slice(2, 11)}`
}

export function blockToPayload(block: StudioBlock): StudioBlockPayload {
  switch (block.type) {
    case 'text_heading':
      return { type: 'text_heading', text: block.text, ...(block.style ? { style: { ...block.style } } : {}) }
    case 'text_paragraph':
      return { type: 'text_paragraph', text: block.text, ...(block.style ? { style: { ...block.style } } : {}) }
    case 'layout_2col':
    case 'layout_3col':
      return {
        type: block.type,
        columns: block.columns.map((col) => col.map((b) => ({ ...b }))),
        ...(block.gap ? { gap: block.gap } : {}),
      }
    case 'chart':
    case 'chart_line':
    case 'chart_pie': {
      const q = block.query
      return {
        type: block.type,
        caption: block.caption,
        dataBinding: { ...block.dataBinding },
        ...(q
          ? {
              query: {
                ...(q as any),
                sources: Array.isArray((q as any).sources) ? [...(q as any).sources] : [],
                ...((q as any)?.specVersion === 2
                  ? {
                      select: Array.isArray((q as any).select) ? [...(q as any).select] : [],
                      ...(Array.isArray((q as any).groupBy) ? { groupBy: [...(q as any).groupBy] } : {}),
                      ...(Array.isArray((q as any).aggregations) ? { aggregations: [...(q as any).aggregations] } : {}),
                      ...(Array.isArray((q as any).orderBy) ? { orderBy: [...(q as any).orderBy] } : {}),
                    }
                  : {
                      columns: Array.isArray((q as any).columns) ? [...(q as any).columns] : [],
                    }),
                ...((q as any).join ? { join: { ...(q as any).join, on: [...((q as any).join?.on ?? [])] } } : {}),
              },
            }
          : {}),
        ...(block.search
          ? {
              search: {
                enabled: block.search.enabled,
                columnLabels: [...block.search.columnLabels],
                ...(block.search.mode ? { mode: block.search.mode } : {}),
                ...(block.search.display ? { display: block.search.display } : {}),
              },
            }
          : {}),
        ...(block.filters
          ? {
              filters: {
                enabled: block.filters.enabled,
                columnLabels: [...block.filters.columnLabels],
              },
            }
          : {}),
      }
    }
    case 'chart_donut': {
      const q = block.query
      return {
        type: 'chart_donut',
        caption: block.caption,
        dataBinding: { ...block.dataBinding },
        ...(q
          ? {
              query: {
                ...(q as any),
                sources: Array.isArray((q as any).sources) ? [...(q as any).sources] : [],
                ...((q as any)?.specVersion === 2
                  ? {
                      select: Array.isArray((q as any).select) ? [...(q as any).select] : [],
                      ...(Array.isArray((q as any).groupBy) ? { groupBy: [...(q as any).groupBy] } : {}),
                      ...(Array.isArray((q as any).aggregations) ? { aggregations: [...(q as any).aggregations] } : {}),
                      ...(Array.isArray((q as any).orderBy) ? { orderBy: [...(q as any).orderBy] } : {}),
                    }
                  : {
                      columns: Array.isArray((q as any).columns) ? [...(q as any).columns] : [],
                    }),
                ...((q as any).join ? { join: { ...(q as any).join, on: [...((q as any).join?.on ?? [])] } } : {}),
              },
            }
          : {}),
        ...(block.search
          ? {
              search: {
                enabled: block.search.enabled,
                columnLabels: [...block.search.columnLabels],
                ...(block.search.mode ? { mode: block.search.mode } : {}),
                ...(block.search.display ? { display: block.search.display } : {}),
              },
            }
          : {}),
        ...(block.filters
          ? {
              filters: {
                enabled: block.filters.enabled,
                columnLabels: [...block.filters.columnLabels],
              },
            }
          : {}),
      }
    }
    case 'kpi':
      return { type: 'kpi', label: block.label, value: block.value, ...(block.tone ? { tone: block.tone } : {}) }
    case 'callout':
      return {
        type: 'callout',
        title: block.title,
        text: block.text,
        ...(block.tone ? { tone: block.tone } : {}),
      }
    case 'divider':
      return { type: 'divider' }
    case 'table': {
      const q = block.query
      return {
        type: 'table',
        caption: block.caption,
        dataBinding: { ...block.dataBinding },
        ...(q
          ? {
              query: {
                ...(q as any),
                sources: Array.isArray((q as any).sources) ? [...(q as any).sources] : [],
                ...((q as any)?.specVersion === 2
                  ? {
                      select: Array.isArray((q as any).select) ? [...(q as any).select] : [],
                      ...(Array.isArray((q as any).groupBy) ? { groupBy: [...(q as any).groupBy] } : {}),
                      ...(Array.isArray((q as any).aggregations) ? { aggregations: [...(q as any).aggregations] } : {}),
                      ...(Array.isArray((q as any).orderBy) ? { orderBy: [...(q as any).orderBy] } : {}),
                    }
                  : {
                      columns: Array.isArray((q as any).columns) ? [...(q as any).columns] : [],
                    }),
                ...((q as any).join ? { join: { ...(q as any).join, on: [...((q as any).join?.on ?? [])] } } : {}),
              },
            }
          : {}),
        ...(block.search
          ? {
              search: {
                enabled: block.search.enabled,
                columnLabels: [...block.search.columnLabels],
                ...(block.search.mode ? { mode: block.search.mode } : {}),
                ...(block.search.display ? { display: block.search.display } : {}),
              },
            }
          : {}),
        ...(block.filters
          ? {
              filters: {
                enabled: block.filters.enabled,
                columnLabels: [...block.filters.columnLabels],
              },
            }
          : {}),
        ...(typeof block.rowsPerPage === 'number' ? { rowsPerPage: block.rowsPerPage } : {}),
      }
    }
    case 'image':
      return { type: 'image', alt: block.alt }
    case 'search_bar':
      return {
        type: 'search_bar',
        config: {
          sourceId: block.config.sourceId,
          searchColumns: [...block.config.searchColumns],
          ...(block.config.displayFormulas ? { displayFormulas: [...block.config.displayFormulas] } : {}),
          ...(block.config.displayColumns ? { displayColumns: [...block.config.displayColumns] } : {}),
          ...(block.config.placeholder ? { placeholder: block.config.placeholder } : {}),
          ...(block.config.onResultClick ? { onResultClick: { ...block.config.onResultClick } } : {}),
          ...(block.config.query ? { query: block.config.query } : {}),
        },
      }
    case 'link':
    case 'link_button':
    case 'link_back':
      return {
        type: block.type,
        label: block.label,
        url: block.url,
        ...(block.targetPageId ? { targetPageId: block.targetPageId } : {}),
        ...(block.style ? { style: { ...block.style } } : {}),
      }
  }
}

export function mergeBlockWithPayload(id: string, payload: StudioBlockPayload): StudioBlock {
  switch (payload.type) {
    case 'text_heading':
      return { id, type: 'text_heading', text: payload.text, ...(payload.style ? { style: { ...payload.style } } : {}) }
    case 'text_paragraph':
      return { id, type: 'text_paragraph', text: payload.text, ...(payload.style ? { style: { ...payload.style } } : {}) }
    case 'layout_2col':
    case 'layout_3col':
      return {
        id,
        type: payload.type,
        columns: payload.columns.map((col) => col.map((b) => ({ ...b }))),
        ...(payload.gap ? { gap: payload.gap } : {}),
      }
    case 'chart':
    case 'chart_line':
    case 'chart_pie':
      return {
        id,
        type: payload.type,
        caption: payload.caption,
        dataBinding: { ...payload.dataBinding },
        ...(payload.query ? { query: payload.query } : {}),
        ...(payload.search ? { search: payload.search } : {}),
        ...(payload.filters ? { filters: payload.filters } : {}),
      }
    case 'chart_donut':
      return {
        id,
        type: 'chart_donut',
        caption: payload.caption,
        dataBinding: { ...payload.dataBinding },
        ...(payload.query ? { query: payload.query } : {}),
        ...(payload.search ? { search: payload.search } : {}),
        ...(payload.filters ? { filters: payload.filters } : {}),
      }
    case 'kpi':
      return { id, type: 'kpi', label: payload.label, value: payload.value, ...(payload.tone ? { tone: payload.tone } : {}) }
    case 'callout':
      return {
        id,
        type: 'callout',
        title: payload.title,
        text: payload.text,
        ...(payload.tone ? { tone: payload.tone } : {}),
      }
    case 'divider':
      return { id, type: 'divider' }
    case 'table':
      return {
        id,
        type: 'table',
        caption: payload.caption,
        dataBinding: { ...payload.dataBinding },
        ...(payload.query ? { query: payload.query } : {}),
        ...(payload.search
          ? { search: { ...payload.search, columnLabels: [...payload.search.columnLabels] } }
          : {}),
        ...(payload.filters
          ? { filters: { ...payload.filters, columnLabels: [...payload.filters.columnLabels] } }
          : {}),
        ...(payload.rowsPerPage ? { rowsPerPage: payload.rowsPerPage } : {}),
      }
    case 'image':
      return { id, type: 'image', alt: payload.alt }
    case 'search_bar':
      return {
        id,
        type: 'search_bar',
        config: {
          sourceId: payload.config.sourceId,
          searchColumns: [...payload.config.searchColumns],
          ...(payload.config.displayFormulas ? { displayFormulas: [...payload.config.displayFormulas] } : {}),
          ...(payload.config.displayColumns ? { displayColumns: [...payload.config.displayColumns] } : {}),
          ...(payload.config.placeholder ? { placeholder: payload.config.placeholder } : {}),
          ...(payload.config.onResultClick ? { onResultClick: { ...payload.config.onResultClick } } : {}),
          ...(payload.config.query ? { query: payload.config.query } : {}),
        },
      }
    case 'link':
    case 'link_button':
    case 'link_back':
      return {
        id,
        type: payload.type,
        label: payload.label,
        url: payload.url,
        ...(payload.targetPageId ? { targetPageId: payload.targetPageId } : {}),
        ...(payload.style ? { style: { ...payload.style } } : {}),
      }
  }
}

/** Sérialisation pour l’API : liste de payloads sans `id`. */
export function blocksToApiPayloads(blocks: StudioBlock[]): StudioBlockPayload[] {
  return blocks.map(blockToPayload)
}

export function createEmptyBlock(type: StudioBlockType): StudioBlock {
  const id = newStudioBlockId()
  const binding = defaultStudioBlockDataBinding()
  switch (type) {
    case 'text_heading':
      return { id, type: 'text_heading', text: 'Titre', style: { align: 'left', fontWeight: 700 } }
    case 'text_paragraph':
      return { id, type: 'text_paragraph', text: 'Votre texte…', style: { align: 'left' } }
    case 'layout_2col':
      return { id, type: 'layout_2col', columns: [[], []], gap: 'md' }
    case 'layout_3col':
      return { id, type: 'layout_3col', columns: [[], [], []], gap: 'md' }
    case 'chart':
      return { id, type: 'chart', caption: 'Graphique', dataBinding: binding }
    case 'chart_line':
      return { id, type: 'chart_line', caption: 'Graphique (ligne)', dataBinding: binding }
    case 'chart_pie':
      return { id, type: 'chart_pie', caption: 'Graphique (camembert)', dataBinding: binding }
    case 'chart_donut':
      return { id, type: 'chart_donut', caption: 'Graphique (donut)', dataBinding: binding }
    case 'table':
      return { id, type: 'table', caption: 'Tableau', dataBinding: binding }
    case 'kpi':
      return { id, type: 'kpi', label: 'Indicateur', value: '—', tone: 'primary' }
    case 'callout':
      return { id, type: 'callout', title: 'À retenir', text: 'Votre message…', tone: 'info' }
    case 'divider':
      return { id, type: 'divider' }
    case 'image':
      return { id, type: 'image', alt: 'Légende' }
    case 'search_bar':
      return {
        id,
        type: 'search_bar',
        config: {
          sourceId: '',
          searchColumns: [],
          displayFormulas: [],
          placeholder: 'Rechercher...',
        },
      }
    case 'link':
      return { id, type: 'link', label: 'Lien', url: '', style: { color: '#2563eb', underline: true } }
    case 'link_button':
      return { id, type: 'link_button', label: 'Bouton', url: '', style: { color: '#ffffff', highlight: '#2563eb', fontWeight: 600 } }
    case 'link_back':
      return { id, type: 'link_back', label: 'Retour', url: '', style: { color: '#64748b' } }
  }
}

export function cloneBlock(block: StudioBlock): StudioBlock {
  const id = newStudioBlockId()
  if (block.type === 'layout_2col' || block.type === 'layout_3col') {
    const columns = block.columns.map((col) => col.map(cloneBlock))
    return { id, type: block.type, columns, ...(block.gap ? { gap: block.gap } : {}) }
  }
  return mergeBlockWithPayload(id, blockToPayload(block))
}
