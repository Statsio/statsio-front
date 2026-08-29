import type { StudioDocumentPage, PageParam } from '@/types/studio'

/**
 * « Fan-out » : une page dont un paramètre est marqué `fanOut` est publiée sous
 * une URL par valeur distincte — `/statsdata/{slug}/{valeur}` — chacune indexable
 * (Phase 2 du plan Statsdata v2). Ces helpers purs sont partagés par le rendu
 * public (`useStatsDataDetail`), la barre de recherche et le sitemap.
 */

/** Première page portant un paramètre `fanOut`, avec ce paramètre. */
export function findFanOutTarget(
  pages: StudioDocumentPage[],
): { page: StudioDocumentPage; param: PageParam } | null {
  for (const page of pages) {
    const param = page.params?.find((p) => p.fanOut && p.name)
    if (param) return { page, param }
  }
  return null
}

/** Colonne dont la valeur forme le segment d'URL (défaut : la colonne source, sinon le nom). */
export function fanOutSlugKey(param: PageParam): string {
  return param.slugColumn || param.column || param.name
}

export interface SegmentResolution {
  /** Page à afficher. */
  page: StudioDocumentPage | null
  /** Renseigné quand le segment est une valeur de fan-out (et non un slug de page). */
  fanOut: { param: PageParam; segment: string } | null
}

/**
 * Résout le segment d'URL `/statsdata/{slug}/{segment}` :
 *  - s'il correspond au slug/id d'une page → on affiche cette page (navigation par onglet) ;
 *  - sinon, s'il existe une page fan-out → c'est une valeur de fan-out pour cette page ;
 *  - sinon → page par défaut.
 */
export function resolveSegment(
  segment: string | undefined,
  pages: StudioDocumentPage[],
): SegmentResolution {
  if (!pages.length) return { page: null, fanOut: null }

  if (segment) {
    const match = pages.find((p) => p.slug === segment || p.id === segment)
    if (match) return { page: match, fanOut: null }

    const target = findFanOutTarget(pages)
    if (target) return { page: target.page, fanOut: { param: target.param, segment } }
  }

  return { page: pages.find((p) => !p.isTemplate) ?? pages[0] ?? null, fanOut: null }
}
