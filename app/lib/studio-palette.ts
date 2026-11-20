import { BLOCK_META, type BlockType, type ContentType } from '@/types/studio'

/**
 * Palette de blocs du Studio par type de contenu (maquette « Studio Statsio ») —
 * partagée par le panneau « Éléments » et le popover « + » du canevas.
 */
export interface PaletteBlock {
  type: BlockType
  label: string
  description: string
  /** Bloc branché sur des données (pastille bleue). */
  data: boolean
}

export interface PaletteCategory {
  id: string
  label: string
  blocks: PaletteBlock[]
}

const DESC: Partial<Record<BlockType, [label: string, description: string]>> = {
  heading: ['Titre', 'Intertitre H2 ou H3'],
  paragraph: ['Paragraphe', 'Texte, gras, surlignage, valeur liée'],
  quote: ['Citation', 'Exergue ou propos rapporté'],
  callout: ['Encadré', 'Note, méthode, avertissement'],
  retenir: ['À retenir', 'Points clés en liste'],
  image: ['Image', 'Avec légende et crédit'],
  video: ['Vidéo', 'YouTube, Vimeo, Dailymotion'],
  button: ['Bouton', 'Appel à l’action'],
  'link-card': ['Carte de lien', 'Aperçu d’un contenu ou d’une page'],
  layout: ['Disposition', 'Colonnes côte à côte'],
  'sd-embed': ['Bloc StatsData', 'Reprend un bloc d’un StatsData publié'],
  bar: ['Barres', 'Comparer des catégories'],
  line: ['Lignes', 'Évolution dans le temps'],
  pie: ['Camembert', 'Répartition, 5 parts au plus'],
  kpi: ['KPI', 'Un chiffre et sa tendance'],
  table: ['Tableau', 'Lignes paginées, export CSV'],
  record: ['Fiche', 'Une ligne en fiche détaillée'],
  related: ['Entités liées', 'Puces vers des fiches voisines'],
  map: ['Carte', 'Points GPS, fiche au survol'],
  search: ['Recherche', 'Trouver une fiche (multi-mots)'],
  param: ['Paramètre', 'Sélecteur qui pilote la page'],
  'field-grid': ['Grille de champs', 'Paires libellé / valeur'],
  loop: ['Boucle', 'Répète des blocs par valeur'],
  if: ['Condition', 'Affiche selon une règle'],
  choice: ['Choix unique', 'Une réponse parmi plusieurs'],
  checkboxes: ['Choix multiple', 'Plusieurs réponses possibles'],
  dropdown: ['Liste déroulante', 'Longue liste d’options'],
  scale: ['Échelle', 'Note de 1 à 10'],
  rating: ['Avis', 'De « pas du tout » à « tout à fait »'],
  number: ['Nombre', 'Valeur chiffrée, unité'],
  'text-answer': ['Réponse libre', 'Texte court ou long'],
}

/** Blocs branchés sur des données (pastille bleue, étiquette StatsData). */
export const DATA_BLOCK_TYPES = new Set<BlockType>([
  'sd-embed', 'bar', 'line', 'pie', 'kpi', 'table', 'record', 'related', 'map', 'search', 'param', 'loop', 'if',
])

const CATS: Record<ContentType, [id: string, label: string, types: BlockType[]][]> = {
  article: [
    ['text', 'Texte', ['heading', 'paragraph', 'quote', 'callout', 'retenir']],
    ['statsio', 'Depuis un StatsData', ['sd-embed']],
    ['media', 'Médias', ['image', 'video']],
    ['links', 'Liens', ['button', 'link-card']],
    ['layout', 'Mise en page', ['layout']],
  ],
  statsdata: [
    ['charts', 'Graphiques', ['bar', 'line', 'pie']],
    ['data', 'Données', ['kpi', 'table', 'record', 'related', 'map']],
    ['special', 'Interaction', ['search', 'param']],
    ['text', 'Texte', ['heading', 'paragraph', 'quote', 'callout', 'retenir']],
    ['editorial', 'Éditorial', ['image', 'field-grid', 'button', 'link-card']],
    ['script', 'Script', ['loop', 'if']],
    ['layout', 'Mise en page', ['layout']],
  ],
  survey: [
    ['form', 'Questions', ['choice', 'checkboxes', 'dropdown', 'scale', 'rating', 'number', 'text-answer']],
    ['text', 'Texte', ['heading', 'paragraph', 'callout']],
    ['media', 'Médias', ['image', 'video']],
  ],
}

export function paletteBlock(type: BlockType): PaletteBlock {
  const [label, description] = DESC[type] ?? [BLOCK_META[type]?.label ?? type, '']
  return { type, label, description, data: DATA_BLOCK_TYPES.has(type) }
}

export function paletteFor(contentType: ContentType | undefined | null): PaletteCategory[] {
  return (CATS[contentType ?? 'statsdata'] ?? CATS.statsdata).map(([id, label, types]) => ({
    id,
    label,
    blocks: types.filter((t) => t in BLOCK_META).map(paletteBlock),
  }))
}

/** Filtre plein texte (libellé + description), catégories vides retirées. */
export function filterPalette(cats: PaletteCategory[], query: string): PaletteCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return cats
  return cats
    .map((c) => ({ ...c, blocks: c.blocks.filter((b) => `${b.label} ${b.description}`.toLowerCase().includes(q)) }))
    .filter((c) => c.blocks.length > 0)
}
