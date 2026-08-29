import type { InjectionKey } from 'vue'

/** Contexte de la section hôte, fourni par `CanvasSection`, lu par `BlockWrapper`. */
export interface SectionContext {
  /** Section en thème sombre → cartes/textes clairs. */
  dark: boolean
  /** Section rendue comme UNE carte → les blocs sont « nus » (flat). */
  carded: boolean
}

export const SECTION_CONTEXT: InjectionKey<SectionContext> = Symbol('studio-section-context')
