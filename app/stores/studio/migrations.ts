import type { Ref } from 'vue'
import type { PageParam, Section, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { scriptZoneId } from '@/types/studio'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ─── Migration : pages « template » → page normale + paramètre ───────────────
// Plan Statsdata v2 : plus qu'un seul type de page. Une page `isTemplate` est
// convertie en page normale portant un `PageParam` (avec `fanOut` pour la
// génération d'URL par valeur — Phase 2). Idempotent, sans effet sur une page
// déjà normale.

export function migrateLegacyTemplatePages(
  pages: Ref<StudioDocumentPage[]>,
  sections: Ref<Section[]>,
  blocks: Ref<StudioBlock[]>,
): void {
  for (const page of pages.value) {
    if (!page.isTemplate) continue

    // Colonne identifiante legacy : celle qui pilotait les filtres `{{param}}`.
    // Les pages pilotées par un bloc recherche sont ensuite réconciliées par
    // `syncAllSearchPageParams` (qui remplace ce param par le param auto-géré).
    const idColumn = page.paramName
    if (idColumn && !(page.params ?? []).some((p) => p.name === idColumn)) {
      const decl: PageParam = {
        name: idColumn,
        column: idColumn,
        fanOut: true,
        slugColumn: idColumn,
      }
      page.params = [decl, ...(page.params ?? [])]
    }

    page.isTemplate = undefined
    page.paramName = undefined
  }

  // Les sections/blocs verrouillés n'existaient que pour la barre de recherche
  // auto-provisionnée des pages template — plus de raison de les figer.
  for (const s of sections.value) if (s.locked) s.locked = undefined
  for (const b of blocks.value) if (b.locked) b.locked = undefined
}

// ─── Migration : sections multi-colonnes → bloc « Disposition » ─────────────
// Une section ne porte plus de mise en page en colonnes (toujours `1-col`) : les
// anciennes sections `2-cols`/`3-cols`/… sont converties en une section 1-col
// contenant un unique bloc `layout` qui reprend l'agencement et les blocs des
// anciennes colonnes. Idempotent (ne touche pas les sections déjà `1-col`).

export function migrateMultiColumnSections(sections: Ref<Section[]>, blocks: Ref<StudioBlock[]>): void {
  for (const section of sections.value) {
    if (section.layout === '1-col') continue

    const layoutBlock: StudioBlock = {
      id: uid(),
      type: 'layout',
      zoneId: `${section.id}-0`,
      fieldMapping: {},
      config: { title: '', layoutType: section.layout },
    }

    const prefix = `${section.id}-`
    for (const b of blocks.value) {
      if (!b.zoneId.startsWith(prefix)) continue
      const colIdx = parseInt(b.zoneId.slice(prefix.length), 10)
      if (Number.isNaN(colIdx)) continue
      b.zoneId = scriptZoneId(layoutBlock.id, colIdx)
    }

    blocks.value.push(layoutBlock)
    section.layout = '1-col'
  }
}
