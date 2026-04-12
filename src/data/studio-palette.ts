import type { StudioPaletteItem } from '@/types/studio-document'

export const studioPaletteText: StudioPaletteItem[] = [
  {
    paletteId: 'pt-title',
    blockType: 'text_heading',
    label: 'Titre',
    description: 'Titre de section court et lisible.',
  },
  {
    paletteId: 'pt-body',
    blockType: 'text_paragraph',
    label: 'Paragraphe',
    description: 'Texte éditorial, contexte et interprétation.',
  },
]

export const studioPaletteViz: StudioPaletteItem[] = [
  {
    paletteId: 'pv-chart',
    blockType: 'chart',
    label: 'Graphique',
    description: 'Courbes, barres ou aires reliées à une source.',
  },
  {
    paletteId: 'pv-table',
    blockType: 'table',
    label: 'Tableau',
    description: 'Données tabulaires comparables et exportables.',
  },
]

export const studioPaletteCharts: StudioPaletteItem[] = [studioPaletteViz[0]!]

export const studioPaletteTables: StudioPaletteItem[] = [studioPaletteViz[1]!]

export const studioPaletteMedia: StudioPaletteItem[] = [
  {
    paletteId: 'pm-image',
    blockType: 'image',
    label: 'Image',
    description: 'Visuel, schéma ou illustration annotée.',
  },
]
