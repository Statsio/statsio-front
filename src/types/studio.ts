// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentType = 'statsdata' | 'article' | 'survey'

export interface StudioContent {
  id: string
  type: ContentType
  title: string
  slug?: string
  status?: 'draft' | 'published'
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export type BlockType = 'bar' | 'line' | 'pie' | 'table' | 'kpi'

export interface BlockDefinition {
  type: BlockType
  label: string
  icon: string
  description: string
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'bar', label: 'Barres', icon: 'chart-bar', description: 'Graphique en barres' },
  { type: 'line', label: 'Lignes', icon: 'chart-line', description: 'Graphique linéaire' },
  { type: 'table', label: 'Tableau', icon: 'table-cells', description: 'Tableau de données' },
  { type: 'kpi', label: 'KPI', icon: 'hashtag', description: 'Indicateur clé' },
]

export interface FieldMapping {
  xAxis?: string
  yAxis?: string
  label?: string
  value?: string
  series?: string
  columns?: string[]
  valueColumn?: string
  comparisonColumn?: string
}

export interface BlockConfig {
  title?: string
  colors?: string[]
  stacked?: boolean
  smooth?: boolean
  showLegend?: boolean
  format?: 'number' | 'percent' | 'currency'
  prefix?: string
  suffix?: string
  sortable?: boolean
  showPagination?: boolean
  pageSize?: number
  orientation?: 'vertical' | 'horizontal'
}

export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'not_contains'

export interface BlockFilter {
  column: string
  operator: FilterOperator
  value: string
}

export interface StudioBlock {
  id: string
  type: BlockType
  zoneId: string
  datasetId?: string
  fieldMapping: FieldMapping
  config: BlockConfig
  filters?: BlockFilter[]
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export type LayoutType = 'full' | '2-cols' | '1-big-2-small' | 'grid-3'

export interface ZoneDefinition {
  id: string
  col: number    // CSS grid-column-start (1-based)
  row: number    // CSS grid-row-start (1-based)
  colSpan: number
  rowSpan: number
  allowedBlocks?: BlockType[]
}

export interface LayoutDefinition {
  type: LayoutType
  label: string
  zones: ZoneDefinition[]
  preview: string // emoji or short desc for UI
}

export interface PageLayout {
  type: LayoutType
  zones: ZoneDefinition[]
}

// ─── Layout presets ───────────────────────────────────────────────────────────

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    type: 'full',
    label: 'Pleine largeur',
    preview: '▬',
    zones: [{ id: 'zone-a', col: 1, row: 1, colSpan: 12, rowSpan: 1 }],
  },
  {
    type: '2-cols',
    label: '2 colonnes',
    preview: '▬▬',
    zones: [
      { id: 'zone-a', col: 1, row: 1, colSpan: 6, rowSpan: 1 },
      { id: 'zone-b', col: 7, row: 1, colSpan: 6, rowSpan: 1 },
    ],
  },
  {
    type: '1-big-2-small',
    label: '1 grande + 2 petites',
    preview: '▬|▪▪',
    zones: [
      { id: 'zone-a', col: 1, row: 1, colSpan: 8, rowSpan: 2 },
      { id: 'zone-b', col: 9, row: 1, colSpan: 4, rowSpan: 1 },
      { id: 'zone-c', col: 9, row: 2, colSpan: 4, rowSpan: 1 },
    ],
  },
  {
    type: 'grid-3',
    label: 'Grille 3 colonnes',
    preview: '▬▬▬',
    zones: [
      { id: 'zone-a', col: 1, row: 1, colSpan: 4, rowSpan: 1 },
      { id: 'zone-b', col: 5, row: 1, colSpan: 4, rowSpan: 1 },
      { id: 'zone-c', col: 9, row: 1, colSpan: 4, rowSpan: 1 },
    ],
  },
]

// ─── Page state ───────────────────────────────────────────────────────────────

export interface PageState {
  content: StudioContent
  layout: PageLayout
  blocks: StudioBlock[]
}

// ─── Datasets ─────────────────────────────────────────────────────────────────

export interface DatasetColumn {
  name: string
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime'
  nullable: boolean
  sampleValues?: (string | null)[]
  order?: number
}

export interface DatasetMeta {
  id: string
  name: string
  description?: string | null
  rowCount: number
  status: 'pending' | 'ready' | 'failed'
  createdAt?: string
}

export interface DatasetWithSchema extends DatasetMeta {
  columns: DatasetColumn[]
}

// ─── Block data ───────────────────────────────────────────────────────────────

export interface BlockQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  totalRows: number
}

// ─── Autosave ─────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────

export type SidebarLeftTab = 'blocks' | 'layouts' | 'sources'

// ─── Sections (canvas model) ──────────────────────────────────────────────────

export type SectionLayout = '1-col' | '2-cols' | '3-cols' | '2-1-cols' | '1-2-cols'

export interface Section {
  id: string
  layout: SectionLayout
}

export interface SectionLayoutDefinition {
  type: SectionLayout
  label: string
  cols: number
  gridCols: number[]   // col spans per column (must sum to 12)
  preview: string[][]  // visual preview blocks
}

export const SECTION_LAYOUT_DEFINITIONS: SectionLayoutDefinition[] = [
  { type: '1-col',    label: 'Pleine largeur',  cols: 1, gridCols: [12],      preview: [['████████████']] },
  { type: '2-cols',   label: '2 colonnes',       cols: 2, gridCols: [6, 6],    preview: [['██████', '██████']] },
  { type: '3-cols',   label: '3 colonnes',       cols: 3, gridCols: [4, 4, 4], preview: [['████', '████', '████']] },
  { type: '2-1-cols', label: 'Large + étroite',  cols: 2, gridCols: [8, 4],    preview: [['████████', '████']] },
  { type: '1-2-cols', label: 'Étroite + large',  cols: 2, gridCols: [4, 8],    preview: [['████', '████████']] },
]

// ─── Block categories ─────────────────────────────────────────────────────────

export interface BlockCategoryDef {
  id: string
  label: string
  blocks: { type: BlockType; label: string; description: string; iconPath: string }[]
}

export const BLOCK_CATEGORIES: BlockCategoryDef[] = [
  {
    id: 'charts',
    label: 'Graphiques',
    blocks: [
      { type: 'bar',  label: 'Barres',    description: 'Comparaison entre catégories',  iconPath: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
      { type: 'line', label: 'Lignes',    description: 'Évolution dans le temps',        iconPath: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
      { type: 'pie',  label: 'Camembert', description: 'Répartition proportionnelle',    iconPath: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z' },
    ],
  },
  {
    id: 'data',
    label: 'Données',
    blocks: [
      { type: 'table', label: 'Tableau', description: 'Données tabulaires paginées',   iconPath: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375' },
      { type: 'kpi',   label: 'KPI',     description: 'Indicateur clé avec tendance',  iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
    ],
  },
]
