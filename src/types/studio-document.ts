export type StudioDocumentKind = 'statsdata' | 'article'

export type StudioBlockType = 'text_heading' | 'text_paragraph' | 'chart' | 'table' | 'image'

/** Corps JSON d’un bloc tel que stocké côté API (sans identifiant client). */
export type StudioBlockPayload =
  | { type: 'text_heading'; text: string }
  | { type: 'text_paragraph'; text: string }
  | { type: 'chart'; caption: string }
  | { type: 'table'; caption: string }
  | { type: 'image'; alt: string }

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
      return { type: 'text_heading', text: block.text }
    case 'text_paragraph':
      return { type: 'text_paragraph', text: block.text }
    case 'chart':
      return { type: 'chart', caption: block.caption }
    case 'table':
      return { type: 'table', caption: block.caption }
    case 'image':
      return { type: 'image', alt: block.alt }
  }
}

export function mergeBlockWithPayload(id: string, payload: StudioBlockPayload): StudioBlock {
  switch (payload.type) {
    case 'text_heading':
      return { id, type: 'text_heading', text: payload.text }
    case 'text_paragraph':
      return { id, type: 'text_paragraph', text: payload.text }
    case 'chart':
      return { id, type: 'chart', caption: payload.caption }
    case 'table':
      return { id, type: 'table', caption: payload.caption }
    case 'image':
      return { id, type: 'image', alt: payload.alt }
  }
}

/** Sérialisation pour l’API : liste de payloads sans `id`. */
export function blocksToApiPayloads(blocks: StudioBlock[]): StudioBlockPayload[] {
  return blocks.map(blockToPayload)
}

export function createEmptyBlock(type: StudioBlockType): StudioBlock {
  const id = newStudioBlockId()
  switch (type) {
    case 'text_heading':
      return { id, type: 'text_heading', text: 'Titre' }
    case 'text_paragraph':
      return { id, type: 'text_paragraph', text: 'Votre texte…' }
    case 'chart':
      return { id, type: 'chart', caption: 'Graphique' }
    case 'table':
      return { id, type: 'table', caption: 'Tableau' }
    case 'image':
      return { id, type: 'image', alt: 'Légende' }
  }
}

export function cloneBlock(block: StudioBlock): StudioBlock {
  const id = newStudioBlockId()
  return mergeBlockWithPayload(id, blockToPayload(block))
}
