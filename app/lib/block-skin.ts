import { inject, provide, type InjectionKey } from 'vue'

/**
 * Habillage des blocs du Studio selon leur hôte.
 * - `studio` (défaut) : canevas de l'éditeur, rendu historique.
 * - `tranches` : pages publiques StatsData et Article (et leur mode embed),
 *   charte « Tranches » (Bold Outline) — posé via `provideBlockSkin`.
 *
 * Le CSS se scope sur `.sd-public` (voir assets/statsdata.css) ; ce flag sert
 * à ce que le CSS ne peut pas atteindre : couleurs des canvas Chart.js, rendu
 * SVG du camembert.
 */
export type BlockSkin = 'studio' | 'tranches'

export const BLOCK_SKIN: InjectionKey<BlockSkin> = Symbol('block-skin')

export function provideBlockSkin(skin: BlockSkin) {
  provide(BLOCK_SKIN, skin)
}

export function useBlockSkin(): BlockSkin {
  return inject(BLOCK_SKIN, 'studio')
}

/** Couleurs de séries de la charte (maquette StatsData : --s1…--s5, puis compléments). */
export const TRANCHES_SERIES = [
  '#8b5cf6', // violet (matière)
  '#0d9488', // sarcelle
  '#e8590c', // orange
  '#3b82f6', // bleu
  '#db2777', // rose
  '#6d28d9',
  '#0891b2',
  '#65a30d',
]
