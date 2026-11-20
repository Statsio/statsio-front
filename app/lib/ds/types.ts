/** Pictogrammes de type de la charte (voir DsTypeGlyph). */
export type DsGlyphKind = 'statsdata' | 'article' | 'sondage' | 'dossier' | 'chaine' | 'data'

/** Étiquettes typées du fil et du bandeau (voir DsKindTag). */
export type DsKind = 'une' | 'actu' | 'chiffre' | 'sondage' | 'maj' | 'publication' | 'data'

/** Type de contenu catalogue → pictogramme. */
export function glyphForContentType(type: string | null | undefined): DsGlyphKind {
  if (type === 'statsdata') return 'statsdata'
  if (type === 'survey' || type === 'sondage') return 'sondage'
  if (type === 'dossier') return 'dossier'
  if (type === 'channel' || type === 'chaine') return 'chaine'
  return 'article'
}
