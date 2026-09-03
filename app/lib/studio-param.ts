import type { PageParam, StudioBlock } from '@/types/studio'

/**
 * Helpers du bloc « Paramètre de page ».
 *
 * Comme le bloc recherche, un bloc `param` déclare toujours exactement un
 * `PageParam` sur sa propre page — mais **visible** (piloté par un contrôle
 * pastilles / liste, listé comme variable). La déclaration est réconciliée par
 * `studio.syncParamBlockPageParam` (voir {@link desiredParamBlockPageParam}) :
 * l'auteur n'a aucun réglage « générer une page » à activer, le fan-out est
 * automatique dès qu'une colonne pilote est choisie.
 *
 * Ce module ne dépend d'aucun store — testable en isolation.
 */

export interface ParamBlockParamOpts {
  /**
   * Vrai si la page porte déjà un axe fan-out prioritaire (bloc recherche). Dans
   * ce cas le bloc param reste déclaré mais ne pilote pas les URLs — un seul axe
   * fan-out par page (voir `findFanOutTarget` / `sitemap-content.ts`).
   */
  pageHasForeignFanOut?: boolean
}

/**
 * Le `PageParam` que le bloc param doit maintenir sur sa page. `null` s'il n'a
 * pas encore de colonne pilote.
 */
export function desiredParamBlockPageParam(
  block: StudioBlock,
  opts: ParamBlockParamOpts = {},
): PageParam | null {
  const column = block.fieldMapping.paramColumn ?? ''
  const name = block.fieldMapping.paramName || column
  if (!column || !name) return null

  const fanOut = opts.pageHasForeignFanOut ? undefined : true
  return {
    name,
    column,
    datasetId: block.datasetId,
    defaultValue: block.config.paramDefault || undefined,
    label: block.config.title || undefined,
    paramBlockId: block.id,
    fanOut,
    slugColumn: fanOut ? column : undefined,
  }
}

/** Deux `PageParam` param sont-ils structurellement équivalents ? (évite les mutations inutiles) */
export function sameParamBlockPageParam(a: PageParam | undefined, b: PageParam | null): boolean {
  if (!a || !b) return a == null && b == null
  return (
    a.name === b.name &&
    a.column === b.column &&
    a.datasetId === b.datasetId &&
    (a.defaultValue ?? '') === (b.defaultValue ?? '') &&
    (a.label ?? '') === (b.label ?? '') &&
    a.paramBlockId === b.paramBlockId &&
    Boolean(a.fanOut) === Boolean(b.fanOut) &&
    (a.slugColumn ?? '') === (b.slugColumn ?? '')
  )
}
