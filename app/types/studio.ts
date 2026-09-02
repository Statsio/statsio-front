// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentType = 'statsdata' | 'article' | 'survey'

export type ContentVisibility = 'public' | 'protege' | 'private'

export interface StudioContent {
  id: string
  type: ContentType
  title: string
  slug?: string
  status?: 'draft' | 'published'
  categories?: string[]
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export type BlockType = 'bar' | 'line' | 'pie' | 'table' | 'kpi' | 'record' | 'related' | 'heading' | 'paragraph' | 'quote' | 'callout' | 'search' | 'param' | 'image' | 'video' | 'button' | 'link-card' | 'retenir' | 'map' | 'field-grid' | 'choice' | 'checkboxes' | 'dropdown' | 'scale' | 'rating' | 'loop' | 'if' | 'layout' | 'sd-embed'

/**
 * Types de blocs qu'un article peut réutiliser via un bloc `sd-embed`
 * (« Bloc Statsdata »). Miroir de StudioContentController::EMBEDDABLE_BLOCK_TYPES.
 */
export const EMBEDDABLE_BLOCK_TYPES: BlockType[] = ['bar', 'line', 'pie', 'kpi', 'table', 'search']

export const TEXT_BLOCK_TYPES: BlockType[] = ['heading', 'paragraph', 'quote', 'callout']
export const EDITORIAL_BLOCK_TYPES: BlockType[] = ['image', 'video', 'button', 'link-card', 'retenir', 'map', 'field-grid']
export const FORM_BLOCK_TYPES: BlockType[] = ['choice', 'checkboxes', 'dropdown', 'scale', 'rating']
/** Blocs de logique (script) : conteneurs qui répètent (`loop`) / conditionnent (`if`) d'autres blocs. */
export const SCRIPT_BLOCK_TYPES: BlockType[] = ['loop', 'if']
/** Tout bloc « conteneur » possédant ses propres zones enfants (script + mise en page). */
export const CONTAINER_BLOCK_TYPES: BlockType[] = [...SCRIPT_BLOCK_TYPES, 'layout']
export function isTextBlock(type: BlockType) { return TEXT_BLOCK_TYPES.includes(type) }
export function isEditorialBlock(type: BlockType) { return EDITORIAL_BLOCK_TYPES.includes(type) }
export function isFormBlock(type: BlockType) { return FORM_BLOCK_TYPES.includes(type) }
export function isScriptBlock(type: BlockType) { return SCRIPT_BLOCK_TYPES.includes(type) }
export function isContainerBlock(type: BlockType) { return CONTAINER_BLOCK_TYPES.includes(type) }
export function isLoopBlock(type: BlockType) { return type === 'loop' }

/**
 * Zone sentinelle des enfants d'un bloc de script (`loop` ou `if`) :
 * `loop:{blockId}:{branche}`. Le préfixe `loop:` est historique — conservé pour
 * que les `zoneId` déjà persistés restent valides. Une boucle n'a que la branche
 * `0` ; un bloc `if` a une zone par branche (`Si` / `Sinon si` / `Sinon`).
 */
export function scriptZoneId(blockId: string, branch = 0) { return `loop:${blockId}:${branch}` }
/** Renvoie l'id du bloc de script si `zoneId` est une zone de script, sinon null. */
export function scriptIdFromZone(zoneId: string): string | null {
  const m = /^loop:(.+):(\d+)$/.exec(zoneId)
  return m ? m[1]! : null
}
/** Index de branche d'une zone de script (`0` par défaut / si non reconnu). */
export function scriptZoneBranch(zoneId: string): number {
  const m = /^loop:(.+):(\d+)$/.exec(zoneId)
  return m ? Number(m[2]) : 0
}
/** @deprecated Utiliser {@link scriptZoneId} — alias conservé pour compat. */
export const loopZoneId = scriptZoneId
/** @deprecated Utiliser {@link scriptIdFromZone} — alias conservé pour compat. */
export const loopIdFromZone = scriptIdFromZone

/**
 * Zone racine d'une page : `page:{pageId}`. Un bloc `loop`/`if` peut y vivre pour
 * répéter / conditionner des sections entières (hors des sections). Analogue à
 * une colonne de section, mais au niveau page.
 */
export function pageZoneId(pageId: string) { return `page:${pageId}` }
export function isPageZone(zoneId: string): boolean { return zoneId.startsWith('page:') }
/** Renvoie l'id de page d'une zone `page:{pageId}`, sinon null. */
export function pageIdFromZone(zoneId: string): string | null {
  return isPageZone(zoneId) ? zoneId.slice('page:'.length) : null
}

export interface BlockDefinition {
  type: BlockType
  label: string
  icon: string
  description: string
}

/**
 * Libellé + icône (path Heroicons outline) + teinte par type de bloc.
 * Source unique pour l'entête de l'inspecteur, la carte de bloc sur le canevas
 * et le panneau « Éléments ».
 */
export const BLOCK_META: Record<BlockType, { label: string; iconPath: string; tint: string }> = {
  bar:        { label: 'Barres',           tint: 'bg-violet-100 text-violet-600',   iconPath: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
  line:       { label: 'Lignes',           tint: 'bg-blue-100 text-blue-600',       iconPath: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
  pie:        { label: 'Camembert',        tint: 'bg-emerald-100 text-emerald-600', iconPath: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z' },
  table:      { label: 'Tableau',          tint: 'bg-amber-100 text-amber-600',     iconPath: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375' },
  kpi:        { label: 'KPI',              tint: 'bg-rose-100 text-rose-600',       iconPath: 'M5.25 8.25h13.5m-13.5 7.5h13.5m-9-12L7.5 21M15.75 3 12.75 21' },
  record:     { label: 'Fiche',            tint: 'bg-amber-100 text-amber-600',     iconPath: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z' },
  related:    { label: 'Entités liées',    tint: 'bg-amber-100 text-amber-600',     iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
  heading:    { label: 'Titre',            tint: 'bg-slate-100 text-slate-600',     iconPath: 'M4 6h16M4 12h8m-8 6h16' },
  paragraph:  { label: 'Paragraphe',       tint: 'bg-slate-100 text-slate-600',     iconPath: 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5' },
  quote:      { label: 'Citation',         tint: 'bg-slate-100 text-slate-600',     iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
  callout:    { label: 'Encadré',          tint: 'bg-slate-100 text-slate-600',     iconPath: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z' },
  search:     { label: 'Recherche',        tint: 'bg-cyan-100 text-cyan-600',       iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
  param:      { label: 'Paramètre',        tint: 'bg-cyan-100 text-cyan-600',       iconPath: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75' },
  image:      { label: 'Image',            tint: 'bg-pink-100 text-pink-600',       iconPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z' },
  video:      { label: 'Vidéo',            tint: 'bg-red-100 text-red-600',         iconPath: 'M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z' },
  button:     { label: 'Bouton',           tint: 'bg-violet-100 text-violet-600',   iconPath: 'M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5' },
  'link-card':{ label: 'Carte de lien',    tint: 'bg-blue-100 text-blue-600',       iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
  retenir:    { label: 'À retenir',        tint: 'bg-emerald-100 text-emerald-600', iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
  map:        { label: 'Carte',            tint: 'bg-pink-100 text-pink-600',       iconPath: 'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z' },
  'field-grid':{ label: 'Grille de champs', tint: 'bg-slate-100 text-slate-600',    iconPath: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  choice:     { label: 'Choix unique',     tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z' },
  checkboxes: { label: 'Cases à cocher',   tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M9 12.75 11.25 15 15 9.75M3.75 12c0-4.556 3.694-8.25 8.25-8.25s8.25 3.694 8.25 8.25-3.694 8.25-8.25 8.25S3.75 16.556 3.75 12Z' },
  dropdown:   { label: 'Liste déroulante', tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' },
  scale:      { label: 'Échelle linéaire', tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M3 6.75h18M3 12h18M3 17.25h18M6 6.75v0M12 12v0M18 17.25v0' },
  rating:     { label: 'Avis',             tint: 'bg-amber-100 text-amber-600',     iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
  loop:       { label: 'Boucle',           tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' },
  if:         { label: 'Condition',        tint: 'bg-indigo-100 text-indigo-600',   iconPath: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z' },
  layout:     { label: 'Disposition',      tint: 'bg-slate-100 text-slate-600',     iconPath: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z' },
  'sd-embed': { label: 'Bloc Statsdata',   tint: 'bg-violet-100 text-violet-600',   iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'bar', label: 'Barres', icon: 'chart-bar', description: 'Graphique en barres' },
  { type: 'line', label: 'Lignes', icon: 'chart-line', description: 'Graphique linéaire' },
  { type: 'table', label: 'Tableau', icon: 'table-cells', description: 'Tableau de données' },
  { type: 'kpi', label: 'KPI', icon: 'hashtag', description: 'Indicateur clé' },
]

export interface SearchSource {
  datasetId: string
  columns: string[]
}

export interface SearchJoin {
  sourceDatasetId: string   // which search source this join enriches
  datasetId: string         // secondary dataset to join
  leftColumn: string        // column from sourceDataset
  rightColumn: string       // column from secondary dataset
  columns: string[]         // columns to pull from secondary dataset
  type: 'inner' | 'left'
}

export type AggregateFunction = 'sum' | 'avg' | 'count' | 'min' | 'max'

/** Agrégat par colonne : `{ column: refQualifiée, fn }`. Remplace le `FieldMapping.aggregate` unique. */
export interface BlockAggregate {
  column: string
  fn: AggregateFunction
}

// ─── Tableau v2 ───────────────────────────────────────────────────────────────

export interface TableColumnFormat {
  format?: 'text' | 'number' | 'percent' | 'currency' | 'mono'
  align?: 'left' | 'center' | 'right'
}

/** Colonne dérivée d'une expression par ligne : `{col}` réfs + agrégats `AVG(x@N)`. */
export interface TableComputedColumn {
  name: string
  expression: string
}

export type ArithOp = '+' | '-' | '*' | '/'

/** Un opérande d'une {@link CalcColumn} : une colonne OU un nombre, relié au précédent par `op`. */
export interface CalcOperand {
  /** Opérateur reliant cet opérande au précédent (absent pour le 1er). */
  op?: ArithOp
  /** Réf colonne (nue | `col@sourceId`) — exclusif de `value`. */
  column?: string
  /** Littéral numérique — exclusif de `column`. */
  value?: number
}

/**
 * Colonne calculée d'un bloc : combinaison arithmétique de colonnes, calculée par ligne
 * (côté SQL, avant agrégation). Référencée partout comme une colonne via la chaîne `calc:<id>`.
 * Distinct des `computedColumns` du tableau (expression texte + agrégats, calcul post-requête).
 */
export interface CalcColumn {
  id: string
  label: string
  operands: CalcOperand[]
}

/** Préfixe d'une référence de colonne calculée. */
export const CALC_REF_PREFIX = 'calc:'

/**
 * Un terme d'une valeur d'agrégat combinée : `FN(colonne)`, relié au terme précédent
 * par `op`. Ex. `[{fn:'max',column:'prix'}, {op:'-',fn:'min',column:'prix'}]` = `MAX(prix) - MIN(prix)`.
 * `column` accepte une réf `calc:<id>`.
 */
export interface AggTerm {
  op?: ArithOp
  fn: AggregateFunction
  column: string
}

/**
 * Fonction d'une part de camembert : un agrégat classique, ou `remainder`
 * (= `SUM(colonne)` moins la somme des autres parts — ex. « Non admis »).
 */
export type PieSegmentFn = AggregateFunction | 'remainder'

/** Part d'un camembert en mode « segments calculés » : fonction + colonne (comme une série bar/line). */
export interface PieSegment {
  fn: PieSegmentFn
  column: string
  /** Libellé affiché ; défaut = nom de la colonne (ou « Reste »). */
  label?: string
}

/** Règle de mise en forme conditionnelle d'une cellule. */
export interface TableCellRule {
  column: string
  /** positive/negative : signe ; gt/lt : vs `value` ; top/bottom : max/min de la colonne visible. */
  when: 'positive' | 'negative' | 'gt' | 'lt' | 'top' | 'bottom'
  value?: number
  /** Couleur du texte (hex). */
  color: string
  bold?: boolean
}

// ─── Graphiques v2 ────────────────────────────────────────────────────────────

/** Couleur conditionnelle d'une marque (barre, segment, barre de progression). */
export interface ChartMarkRule {
  /** above/below : vs la ligne de référence ; gt/lt : vs `value` ; top/bottom : max/min du jeu. */
  when: 'positive' | 'negative' | 'gt' | 'lt' | 'top' | 'bottom' | 'above-ref' | 'below-ref'
  value?: number
  color: string
}

export interface FieldMapping {
  xAxis?: string
  yAxis?: string
  yAxes?: string[]
  label?: string
  value?: string
  series?: string
  columns?: string[]
  /** Custom display label per column name — used by the table block */
  columnLabels?: Record<string, string>
  /** Table: format + alignment per column. */
  columnFormats?: Record<string, TableColumnFormat>
  /** Table: derived columns (expression per row). */
  computedColumns?: TableComputedColumn[]
  /** Table: conditional cell formatting rules. */
  cellRules?: TableCellRule[]
  /** Camembert en mode « segments calculés » (`config.pieMode === 'segments'`). */
  pieSegments?: PieSegment[]
  /** Colonnes calculées du bloc (combinaisons arithmétiques), référencées `calc:<id>`. */
  calcColumns?: CalcColumn[]
  /** KPI : valeur = combinaison d'agrégats (`MAX(x) - MIN(x)`…). Prioritaire sur `valueColumn` / `config.valueExpression`. */
  kpiValue?: AggTerm[]
  /** Record block: column used as the fiche title (default = first column). */
  recordTitleColumn?: string
  valueColumn?: string
  comparisonColumn?: string
  /** Legacy : fonction d'agrégation unique appliquée à toutes les colonnes de valeur. Fallback de migration vers `aggregates`. */
  aggregate?: AggregateFunction
  /** Agrégats par colonne (kpi/pie/bar/line), regroupés par xAxis/label/series. */
  aggregates?: BlockAggregate[]
  /** Loop block: column whose distinct values drive the iterations. */
  loopColumn?: string
  /** Loop block: variable name exposed to child blocks (default "item"). */
  loopVar?: string
  /** Param block: column whose distinct values populate the control. */
  paramColumn?: string
  /** Param block: name of the page parameter written on change (default = paramColumn). */
  paramName?: string
  searchColumn?: string    // legacy – kept for backward compat
  searchSources?: SearchSource[]
  searchJoins?: SearchJoin[]
  targetPageId?: string
  urlParams?: string[]
  urlParamMapping?: Record<string, string>
  resultTitleColumn?: string
  resultDescColumns?: string[]
  resultDescColumnLabels?: Record<string, string>
}

export interface BlockConfig {
  title?: string
  description?: string
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
  rowLimit?: number | null
  /** Nombre max de séries distinctes affichées sur un bar/line chart avec regroupement — garde-fou contre une colonne de série à forte cardinalité (voir Line/BarChartBlock.vue). */
  seriesLimit?: number | null
  distinctColumn?: string | null
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc' | null
  orientation?: 'vertical' | 'horizontal'
  showValueLabels?: boolean
  /** Bar block rendering mode — 'chart' (default, Chart.js canvas) or 'progress' (thin labeled progress-bar list) */
  barStyle?: 'chart' | 'progress'
  /** Camembert : 'column' (défaut, étiquettes + valeur) ou 'segments' (parts calculées via `fieldMapping.pieSegments`) */
  pieMode?: 'column' | 'segments'
  /** Bar/line value axis on a logarithmic scale — keeps small values visible when the dataset spans several orders of magnitude */
  logScale?: boolean
  // KPI comparison
  comparisonFormat?: 'percent' | 'number' | 'currency'
  /** KPI : libellé affiché après l'écart (ex. « vs 2020 »). Accepte les jetons `{{colonne}}`. */
  comparisonLabel?: string
  /** KPI : expression calculée servant de valeur (ex. `AVG(prix@7) * 50`) — remplace la colonne. */
  valueExpression?: string
  // ── Grille de champs (field-grid) ──
  fieldGridItems?: { label: string; value: string }[]
  fieldGridColumns?: 2 | 3 | 4
  // ── Carte (map) ──
  /** Latitude / longitude — supportent les `{{jetons}}` (ex. `{{latitude}}` sur une page fan-out). */
  mapLat?: string
  mapLng?: string
  mapLabel?: string
  // Line/bar chart trend badge shown in the block header (free text, not computed)
  trendLabel?: string
  trendDirection?: 'up' | 'down'
  /** Trend badge value from a calculated expression (ex. `AVG(prix@7) - MIN(prix@7)`). */
  trendExpression?: string
  // ── Graphiques v2 ──
  /** Bar/pie/progress : couleur de marque conditionnelle. */
  markRules?: ChartMarkRule[]
  /** Bar/line : ligne de référence horizontale = valeur d'une expression (ex. `AVG(prix@7)`). */
  referenceExpression?: string
  referenceLabel?: string
  /** Line : remplissage translucide sous la courbe (série unique). */
  lineFill?: boolean
  // Search block config
  searchPlaceholder?: string
  // Text block config
  content?: string
  fontFamily?: string
  fontSize?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  headingLevel?: 1 | 2 | 3
  calloutColor?: string
  // Image block config
  imageUrl?: string
  imageAlt?: string
  imageCaption?: string
  imageAlign?: 'left' | 'center' | 'right'
  imageWidth?: 'sm' | 'md' | 'lg' | 'full'
  // Video block config
  videoUrl?: string
  videoCaption?: string
  // Button block config
  buttonLabel?: string
  buttonUrl?: string
  buttonVariant?: 'primary' | 'secondary' | 'outline'
  buttonAlign?: 'left' | 'center' | 'right'
  buttonSize?: 'sm' | 'md' | 'lg'
  // Link card block config
  /** Cible du lien : URL externe, contenu publié du site, ou une page du Statsdata courant. */
  linkMode?: 'url' | 'content' | 'page'
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  linkImage?: string
  linkDomain?: string
  /** mode `content` — type + slug d'un contenu publié (article / statsdata / sondage). */
  linkContentType?: ContentType
  linkContentSlug?: string
  /** mode `page` — id d'une page du Statsdata en cours d'édition. */
  linkPageId?: string
  // Retenir block config
  retenirTitle?: string
  retenirItems?: string[]
  retenirColor?: 'violet' | 'emerald' | 'amber' | 'blue'
  // Form block config (choice / checkboxes / dropdown / scale / rating)
  formOptions?: string[]
  formRequired?: boolean
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  ratingMax?: number
  // Loop block config
  /** Max iterations rendered (guard-rail against high-cardinality columns). */
  loopLimit?: number
  /** Layout of the repeated iterations. */
  loopLayout?: '1-col' | '2-cols' | '3-cols'
  // ── Bloc Disposition (layout) ──
  /** Agencement en colonnes du bloc — pilote le nombre et la largeur des zones enfants. */
  layoutType?: SectionLayout
  // Param block config
  /** Control style: segmented pills (default) or a dropdown. */
  paramControl?: 'segmented' | 'dropdown'
  /** Initial value applied to the page parameter. */
  paramDefault?: string
  /** Show an "all values" option that clears the parameter. */
  paramAllowAll?: boolean
  /** Label of the "all values" option (default "Tout"). */
  paramAllLabel?: string
  /** Publish one indexable page per value (`/statsdata/{slug}/{valeur}`) — sets the param's `fanOut`. */
  paramFanOut?: boolean
  // Search block config
  /** Search block: results also declare a page parameter (like a Param block, but search-driven). */
  searchAsParam?: boolean
  // If block config
  /** @deprecated Remplacé par `ifConditions` — lu en repli par `readIfConditions`. */
  ifParam?: string
  /** @deprecated Remplacé par `ifConditions`. */
  ifOperator?: FilterOperator
  /** @deprecated Remplacé par `ifConditions`. */
  ifValue?: string
  /** Clauses de la branche `Si` — repli quand `ifBranches` est absent. */
  ifConditions?: IfCondition[]
  /** Combine les clauses de la branche `Si` : `all` = ET (défaut), `any` = OU. */
  ifMatch?: 'all' | 'any'
  /** Branches du bloc « Condition » : `Si`, puis `Sinon si` (elsif), puis `Sinon` (else). */
  ifBranches?: IfBranch[]
  // ── Bloc Statsdata (sd-embed) ──
  /** Slug du Statsdata publié dont on réutilise un bloc. */
  sourceSlug?: string
  /** Id du bloc réutilisé dans ce Statsdata. */
  sourceBlockId?: string
  /** Type du bloc réutilisé (pour l'affichage de l'inspecteur / sommaire). */
  sourceBlockType?: BlockType
  /** Titre du Statsdata source, mémorisé pour l'affichage hors ligne. */
  sourceDocTitle?: string
  /** Valeur des paramètres `{{param}}` de la page source (filtres/expressions du bloc réutilisé). Défaut = `defaultValue` de la page source. */
  sourceParams?: Record<string, string>
  /** Affiche le lien « Ouvrir le Statsdata complet » (défaut : true). */
  showSourceLink?: boolean
}

export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'not_contains'

/**
 * Opérateurs d'un filtre de bloc. Surensemble de {@link FilterOperator} : ajoute
 * `in` / `not_in` (sélection multi-valeurs). La valeur d'un filtre `in`/`not_in`
 * est un tableau JSON de chaînes (`'["2024","2025"]'`). Le bloc « Condition »
 * (`IfCondition`) n'utilise que {@link FILTER_OPERATORS} — pas ces deux-là.
 */
export type BlockFilterOperator = FilterOperator | 'in' | 'not_in'

export interface BlockFilter {
  column: string
  operator: BlockFilterOperator
  value: string
}

/** Une clause du bloc « Condition » : compare la valeur active d'un paramètre de page à une valeur. */
export interface IfCondition {
  /** Nom du paramètre de page comparé (`{{param}}`). */
  param: string
  operator: FilterOperator
  /** Valeur comparée — supporte les `{{tokens}}`. */
  value: string
}

/** Une branche du bloc « Condition ». */
export interface IfBranch {
  conditions: IfCondition[]
  /** Combine les clauses : `all` = ET, `any` = OU. */
  match: 'all' | 'any'
  /**
   * Branche « Sinon » (else) : s'affiche quand aucune branche au-dessus ne
   * correspond, `conditions` est ignoré. Un drapeau explicite plutôt qu'une
   * déduction sur `conditions` vide — une clause `elsif` tout juste ajoutée n'a
   * elle aussi encore aucun paramètre choisi.
   */
  else?: boolean
}

export const FILTER_OPERATORS: { value: FilterOperator; label: string; short: string }[] = [
  { value: '=', label: 'égal à', short: '=' },
  { value: '!=', label: 'différent de', short: '≠' },
  { value: '>', label: 'supérieur à', short: '>' },
  { value: '>=', label: 'sup. ou égal', short: '≥' },
  { value: '<', label: 'inférieur à', short: '<' },
  { value: '<=', label: 'inf. ou égal', short: '≤' },
  { value: 'contains', label: 'contient', short: '⊃' },
  { value: 'not_contains', label: 'ne contient pas', short: '⊄' },
]

/**
 * Opérateurs proposés dans le panneau de filtres d'un bloc — {@link FILTER_OPERATORS}
 * plus `in` / `not_in` pour la sélection multi-valeurs à facettes.
 */
export const BLOCK_FILTER_OPERATORS: { value: BlockFilterOperator; label: string; short: string }[] = [
  ...FILTER_OPERATORS,
  { value: 'in', label: 'est parmi', short: '∈' },
  { value: 'not_in', label: "n'est pas parmi", short: '∉' },
]

/** Une valeur distincte d'une colonne + son nombre d'occurrences (`null` si source en direct). */
export interface ColumnFacet {
  value: string
  count: number | null
}

/** Réponse du panneau à facettes d'une colonne (endpoint `?facet=1`). */
export interface ColumnFacetResult {
  column: string
  values: ColumnFacet[]
  /** Nombre total de valeurs distinctes (pour la pagination « Voir plus »). */
  total: number
  offset: number
  limit: number
  /** `false` en mode live : les décomptes ne sont pas disponibles. */
  hasCounts: boolean
  /** `true` si la liste est incomplète (source en direct ou scan plafonné). */
  partial: boolean
}

/** Une source d'un bloc data. `id` = id local stable (= datasetId si unique dans le bloc). */
export interface BlockSource {
  id: string
  datasetId: string
  /** Libellé d'affichage optionnel (utile en self-join). */
  alias?: string
}

/** Jointure entre deux sources du bloc (graphe : chaînage + self-join possibles). */
export interface BlockJoin {
  leftSourceId: string
  leftColumn: string
  rightSourceId: string
  rightColumn: string
  type: 'inner' | 'left'
}

export interface StudioBlock {
  id: string
  type: BlockType
  zoneId: string
  /** Legacy : source unique. Migré vers `sources` au chargement, réécrit = source primaire à la sauvegarde. */
  datasetId?: string
  /** Sources du bloc data (première = primaire par défaut, voir `primarySourceId`). */
  sources?: BlockSource[]
  /** Id de la source primaire (table du FROM). Défaut = sources[0].id. */
  primarySourceId?: string
  fieldMapping: FieldMapping
  config: BlockConfig
  filters?: BlockFilter[]
  comparisonFilters?: BlockFilter[]
  /** Graphe de jointures entre `sources`. */
  joins?: BlockJoin[]
  /** Non-removable via the block toolbar (still draggable/configurable) — used for the auto-provisioned search block on param pages. */
  locked?: boolean
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
  /** Pourcentage d'avancement du pipeline d'ingestion (0-100), uniquement pertinent tant que status === 'pending'. */
  progress?: number
  createdAt?: string
  /** False when attached from the public catalog rather than owned — see SidebarDataSources delete/detach. */
  isOwner?: boolean
  dataSourceId?: string
  /** Uniquement renseigné pour le propriétaire d'une source de type "api" — voir DatasetController::formatDataset. */
  sourceKind?: 'api'
  /** Uniquement renseigné pour une source "api" — une source "live" n'a de row_count fiable que si un count_path a été détecté (voir query_mapping). */
  materialization?: 'snapshot' | 'live'
  refreshFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  lastRefreshedAt?: string | null
  nextRefreshAt?: string | null
}

export interface DatasetWithSchema extends DatasetMeta {
  columns: DatasetColumn[]
}

// ─── Block data ───────────────────────────────────────────────────────────────

export interface BlockQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  totalRows: number
  /** Multi-sources : `refDemandée => cléRéelleDeLaLigne` (voir `rowKey`). */
  columnMap?: Record<string, string>
}

// ─── Autosave ─────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────

export type SidebarLeftTab = 'blocks' | 'script' | 'sources' | 'filters' | 'assistant'

// ─── Sections (canvas model) ──────────────────────────────────────────────────

export type SectionLayout = '1-col' | '2-cols' | '3-cols' | '2-1-cols' | '1-2-cols'

export type SectionTheme = 'default' | 'dark' | 'accent'

export interface Section {
  id: string
  layout: SectionLayout
  pageId?: string
  /**
   * Si renseigné, la section vit dans la zone d'un bloc de script de page
   * (`scriptZoneId(blockId, branch)`, préfixe `loop:`) plutôt qu'à la racine de
   * la page — calqué sur `StudioBlock.zoneId`. La section garde son `pageId`.
   */
  zoneId?: string
  /** Non-removable, non-reorderable via section controls — used for the auto-provisioned search section on param pages. */
  locked?: boolean
  /**
   * En-tête de section rendu au-dessus des blocs (supporte les `{{jetons}}`).
   * HTML « inline » restreint : gras / italique / souligné / barré / surlignage /
   * majuscules + jetons `{{…}}` (voir `sanitizeInlineHtml`). Les valeurs
   * héritées en texte brut restent valides.
   */
  kicker?: string
  title?: string
  description?: string
  /** Interlettrage de l'en-tête (em) — réglé depuis la toolbar de texte. */
  headerLetterSpacing?: number
  /** Interligne de l'en-tête — réglé depuis la toolbar de texte. */
  headerLineHeight?: number
  /** Fond de la section au rendu public. */
  theme?: SectionTheme
}

// ─── Document pages ───────────────────────────────────────────────────────────

/**
 * Paramètre déclaré sur une page : une variable `{{nom}}` que les blocs
 * peuvent référencer dans leurs filtres / titres / textes. Alimenté par un
 * contrôle (bloc `param`, barre de recherche) ou par le segment d'URL des
 * pages générées (fan-out — voir `fanOut`). Socle de la Brique 1 du plan v2 :
 * remplace le couple `isTemplate` / `paramName`.
 */
export interface PageParam {
  /** Nom du jeton, ex. `carburant` → `{{carburant}}`. */
  name: string
  /** Libellé affiché par les contrôles. Défaut = `name`. */
  label?: string
  /** Dataset source des valeurs distinctes proposées par un contrôle (optionnel). */
  datasetId?: string
  /** Colonne source des valeurs distinctes (optionnel). */
  column?: string
  /** Valeur initiale appliquée à l'ouverture de la page. */
  defaultValue?: string
  /** Phase 2 : publie une page indexable par valeur distincte (`/statsdata/{slug}/{valeur}`). */
  fanOut?: boolean
  /** Phase 2 : colonne utilisée pour construire le segment d'URL. Défaut = `column`. */
  slugColumn?: string
}

/** Référence à un élément de premier niveau du flux d'une page : une section racine ou un bloc de page. */
export interface CanvasItemRef {
  kind: 'section' | 'block'
  id: string
}

export interface StudioDocumentPage {
  id: string
  title: string
  slug?: string
  description?: string
  /**
   * Ordre des éléments de premier niveau du flux de la page : sections racine +
   * blocs `loop`/`if` de page, entrelacés. Absent (docs existants) → repli sur
   * l'ordre des sections racine. Matérialisé au 1ᵉʳ ajout de bloc de page / drag.
   */
  canvas?: CanvasItemRef[]
  /** @deprecated Le type « template » a été supprimé — migré en `params` au chargement (voir `migrateLegacyTemplatePages`). */
  isTemplate?: boolean
  /** @deprecated Migré vers une entrée `params` au chargement. */
  paramName?: string
  /** Paramètres déclarés sur la page — voir {@link PageParam}. */
  params?: PageParam[]
  /** Emoji libre affiché devant le titre de l'onglet public, ex. '🇫🇷' */
  icon?: string
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
    id: 'text',
    label: 'Texte',
    blocks: [
      { type: 'heading',   label: 'Titre',      description: 'Titre H1/H2/H3',          iconPath: 'M4 6h16M4 12h8m-8 6h16' },
      { type: 'paragraph', label: 'Paragraphe', description: 'Bloc de texte libre',       iconPath: 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5' },
      { type: 'quote',     label: 'Citation',   description: 'Bloc citation stylisé',     iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
      { type: 'callout',   label: 'Encadré',    description: 'Note ou info mise en avant', iconPath: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
    ],
  },
  {
    id: 'layout',
    label: 'Disposition',
    blocks: [
      { type: 'layout', label: 'Disposition', description: 'Grille de colonnes pour organiser des blocs côte à côte', iconPath: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z' },
    ],
  },
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
      { type: 'table',   label: 'Tableau',       description: 'Données tabulaires paginées',   iconPath: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375' },
      { type: 'kpi',     label: 'KPI',           description: 'Indicateur clé avec tendance', iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
      { type: 'record',  label: 'Fiche',         description: 'Une seule ligne (min/max/filtre) en fiche détaillée', iconPath: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z' },
      { type: 'related', label: 'Entités liées', description: 'Puces vers des enregistrements liés (communes voisines…)', iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
    ],
  },
  {
    id: 'editorial',
    label: 'Éditorial',
    blocks: [
      { type: 'image',     label: 'Image',     description: 'Image avec légende',              iconPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z' },
      { type: 'video',     label: 'Vidéo',     description: 'YouTube, Vimeo, Dailymotion',     iconPath: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z' },
      { type: 'button',    label: 'Bouton',    description: 'Bouton CTA cliquable',             iconPath: 'M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5' },
      { type: 'link-card', label: 'Lien',      description: 'Carte de prévisualisation de lien', iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
      { type: 'retenir',   label: 'À retenir', description: 'Bloc de points clés mis en avant', iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
      { type: 'field-grid', label: 'Grille de champs', description: 'Paires libellé / valeur (bandeau méta, encadré méthodo)', iconPath: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
      { type: 'map',        label: 'Carte',           description: 'Point GPS depuis des colonnes lat / lon', iconPath: 'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z' },
    ],
  },
  {
    id: 'form',
    label: 'Formulaire',
    blocks: [
      { type: 'choice',     label: 'Choix unique',      description: 'Question à réponse unique (radio)',    iconPath: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z' },
      { type: 'checkboxes', label: 'Cases à cocher',    description: 'Question à réponses multiples',         iconPath: 'M9 12.75 11.25 15 15 9.75M3.75 12c0-4.556 3.694-8.25 8.25-8.25s8.25 3.694 8.25 8.25-3.694 8.25-8.25 8.25S3.75 16.556 3.75 12Z' },
      { type: 'dropdown',   label: 'Liste déroulante', description: 'Sélection dans une liste d\'options',    iconPath: 'M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' },
      { type: 'scale',      label: 'Échelle linéaire', description: 'Note sur une échelle numérique',         iconPath: 'M3 6.75h18M3 12h18M3 17.25h18M6 6.75v0M12 12v0M18 17.25v0' },
      { type: 'rating',     label: 'Avis',              description: 'Notation en étoiles',                   iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
    ],
  },
  {
    id: 'script',
    label: 'Script',
    blocks: [
      { type: 'loop', label: 'Boucle',    description: 'Répète des blocs pour chaque valeur d\'une colonne', iconPath: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' },
      { type: 'if',   label: 'Condition', description: 'N\'affiche des blocs que si un paramètre remplit une condition', iconPath: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z' },
    ],
  },
  {
    id: 'special',
    label: 'Spécial',
    blocks: [
      { type: 'search', label: 'Recherche', description: 'Barre de recherche qui filtre la page ou ouvre une page par valeur', iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
      { type: 'param',  label: 'Paramètre', description: 'Sélecteur (pastilles ou liste) qui pilote toute la page', iconPath: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75' },
    ],
  },
  {
    id: 'statsio',
    label: 'Statsio',
    blocks: [
      { type: 'sd-embed', label: 'Bloc Statsdata', description: "Réutilise un graphique, KPI, tableau ou recherche d'un Statsdata publié", iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
    ],
  },
]
