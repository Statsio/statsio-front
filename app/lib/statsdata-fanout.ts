import type { StudioDocumentPage, PageParam } from '@/types/studio'
import { slugify } from '@/lib/slug'

/**
 * « Fan-out » : une page dont un paramètre est marqué `fanOut` est publiée sous
 * une URL par valeur distincte — `/statsdata/{slug}/{valeur}` — chacune indexable
 * (Phase 2 du plan Statsdata v2). Ces helpers purs sont partagés par le rendu
 * public (`useStatsDataDetail`), la barre de recherche et le sitemap.
 *
 * Quand plusieurs pages portent un axe fan-out, seule la première conserve l'URL
 * courte `/statsdata/{slug}/{valeur}` ; les suivantes utilisent
 * `/statsdata/{slug}/{pageSlug}/{valeur}` pour lever l'ambiguïté.
 */

/** Paramètre fan-out d'une page (s'il existe). */
export function pageFanOutParam(page: StudioDocumentPage): PageParam | undefined {
  return page.params?.find((p) => p.fanOut && p.name)
}

/** Première page portant un paramètre `fanOut`, avec ce paramètre. */
export function findFanOutTarget(
  pages: StudioDocumentPage[],
): { page: StudioDocumentPage; param: PageParam } | null {
  for (const page of pages) {
    const param = pageFanOutParam(page)
    if (param) return { page, param }
  }
  return null
}

/** Segment d'URL identifiant une page (slug public, sinon id). */
export function pageUrlSegment(page: StudioDocumentPage): string {
  return page.slug || page.id
}

/**
 * URL publique d'une valeur fan-out pour une page donnée.
 * La page primaire (première avec `fanOut`) garde l'URL courte historique.
 */
export function buildFanOutHref(
  docSlug: string,
  page: StudioDocumentPage,
  segment: string,
  pages: StudioDocumentPage[],
): string {
  const primary = findFanOutTarget(pages)
  if (primary?.page.id === page.id) {
    return `/statsdata/${docSlug}/${segment}`
  }
  return `/statsdata/${docSlug}/${pageUrlSegment(page)}/${segment}`
}

/** Colonne dont la valeur forme le segment d'URL (défaut : la colonne source, sinon le nom). */
export function fanOutSlugKey(param: PageParam): string {
  return param.slugColumn || param.column || param.name
}

/**
 * Colonnes dont les valeurs slugifiées, jointes par `-`, forment le segment
 * d'URL fan-out. Un bloc recherche multi-colonnes (`prénom` + `nom`) produit
 * `param.columns` ; sinon on retombe sur la colonne unique {@link fanOutSlugKey}.
 */
export function fanOutSegmentKeys(param: PageParam): string[] {
  return param.columns?.length ? param.columns : [fanOutSlugKey(param)]
}

/** Segment d'URL fan-out pour une ligne : `slug(val1)-slug(val2)…`. */
export function buildFanOutSegment(param: PageParam, row: Record<string, unknown>): string {
  return fanOutSegmentKeys(param)
    .map((k) => slugify(String(row[k] ?? '')))
    .filter(Boolean)
    .join('-')
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

/**
 * Résout `/statsdata/{slug}/{pageSlug}/{valeur}` (fan-out scoped) ou retombe
 * sur {@link resolveSegment} pour l'URL courte à un seul segment.
 */
export function resolveSegments(
  pageOrValue: string | undefined,
  fanOutValue: string | undefined,
  pages: StudioDocumentPage[],
): SegmentResolution {
  if (!pages.length) return { page: null, fanOut: null }

  if (pageOrValue && fanOutValue) {
    const page = pages.find((p) => p.slug === pageOrValue || p.id === pageOrValue)
    const param = page ? pageFanOutParam(page) : undefined
    if (page && param) {
      return { page, fanOut: { param, segment: fanOutValue } }
    }
  }

  return resolveSegment(pageOrValue, pages)
}
