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
    paletteId: 'pv-chart-line',
    blockType: 'chart_line',
    label: 'Graphique (linéaire)',
    description: 'Courbe simple (catégorie → valeur) reliée à une source.',
  },
  {
    paletteId: 'pv-chart-pie',
    blockType: 'chart_pie',
    label: 'Graphique (camembert)',
    description: 'Répartition en parts (catégorie → valeur) reliée à une source.',
  },
  {
    paletteId: 'pv-chart-donut',
    blockType: 'chart_donut',
    label: 'Graphique (donut)',
    description: 'Camembert avec trou (catégorie → valeur ou comptage).',
  },
  {
    paletteId: 'pv-table',
    blockType: 'table',
    label: 'Tableau',
    description: 'Données tabulaires comparables et exportables.',
  },
  {
    paletteId: 'pv-kpi',
    blockType: 'kpi',
    label: 'KPI',
    description: 'Indicateur clé (valeur unique).',
  },
]

export const studioPaletteCharts: StudioPaletteItem[] = [
  studioPaletteViz[0]!,
  studioPaletteViz[1]!,
  studioPaletteViz[2]!,
  studioPaletteViz[3]!,
]

export const studioPaletteTables: StudioPaletteItem[] = [studioPaletteViz.find((x) => x.blockType === 'table')!]

export const studioPaletteMedia: StudioPaletteItem[] = [
  {
    paletteId: 'pm-image',
    blockType: 'image',
    label: 'Image',
    description: 'Visuel, schéma ou illustration annotée.',
  },
  {
    paletteId: 'pm-divider',
    blockType: 'divider',
    label: 'Séparateur',
    description: 'Sépare visuellement deux sections.',
  },
  {
    paletteId: 'pm-callout',
    blockType: 'callout',
    label: 'Encadré',
    description: 'Message mis en avant (info, warning, etc.).',
  },
]

export const studioPaletteLayouts: StudioPaletteItem[] = [
  {
    paletteId: 'pl-2col',
    blockType: 'layout_2col',
    label: '2 colonnes',
    description: 'Deux blocs côte à côte sur desktop (empilés sur mobile).',
  },
  {
    paletteId: 'pl-3col',
    blockType: 'layout_3col',
    label: '3 colonnes',
    description: 'Trois colonnes (utile pour KPIs, mini-sections).',
  },
]
