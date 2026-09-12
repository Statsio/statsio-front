import type { ComputedRef, Ref } from 'vue'
import type { Section, StudioBlock, StudioContent, StudioDocumentPage } from '@/types/studio'
import { normalizeBlockSources } from '@/lib/studio-block-sources'
import { defaultParamsForPage } from '@/stores/studio/page-params'
import { migrateLegacyTemplatePages, migrateMultiColumnSections } from '@/stores/studio/migrations'

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

export function useStudioSerialization(deps: {
  content: Ref<StudioContent | null>
  pages: Ref<StudioDocumentPage[]>
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  pageParams: Ref<Record<string, string>>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isPanelOpen: Ref<boolean>
  isSidebarRightOpen: Ref<boolean>
  supportsPages: ComputedRef<boolean>
  syncAllSearchPageParams: () => void
  syncAllParamBlockPageParams: () => void
  snapshot: () => void
  dropLastSnapshot: () => void
  markDirty: () => void
}) {
  const {
    content, pages, sections, blocks, currentPageId, pageParams, selectedBlockId, selectedSectionId,
    isPanelOpen, isSidebarRightOpen, supportsPages, syncAllSearchPageParams, syncAllParamBlockPageParams,
    snapshot, dropLastSnapshot, markDirty,
  } = deps

  function getPayload() {
    return {
      title: content.value?.title,
      pages: pages.value,
      sections: sections.value,
      // Transition : on réécrit `datasetId` = dataset de la source primaire pour que
      // l'ancien back / les agrégateurs publics restent valides si le front est déployé avant.
      blocks: blocks.value.map((b: StudioBlock) => {
        const srcs = b.sources
        if (!srcs?.length) return b
        const primary = srcs.find((s) => s.id === b.primarySourceId) ?? srcs[0]
        return { ...b, datasetId: primary?.datasetId ?? b.datasetId }
      }),
    }
  }

  /**
   * Remplace tout le corps du document (titre + pages + sections + blocs) par un
   * payload JSON — même forme que {@link getPayload}. Réservé à l'outil « JSON »
   * du super-admin : on colle le JSON produit par une IA externe. Rejoue les
   * mêmes migrations / synchros que `initPage`, laisse le document `dirty`
   * (l'autosave prend le relais) et empilable dans l'historique (un Ctrl+Z
   * revient à l'état d'avant l'import).
   */
  function importPayload(raw: unknown): { ok: true } | { ok: false; error: string } {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, error: 'Le JSON doit être un objet { title, pages, sections, blocks }.' }
    }
    const p = raw as Record<string, unknown>
    if (!Array.isArray(p.sections)) return { ok: false, error: 'Champ `sections` manquant ou invalide (tableau attendu).' }
    if (!Array.isArray(p.blocks)) return { ok: false, error: 'Champ `blocks` manquant ou invalide (tableau attendu).' }
    if (p.pages !== undefined && !Array.isArray(p.pages)) {
      return { ok: false, error: 'Champ `pages` invalide (tableau attendu).' }
    }

    snapshot()
    const backup = {
      title: content.value?.title,
      pages: deepClone(pages.value),
      sections: deepClone(sections.value),
      blocks: deepClone(blocks.value),
    }

    try {
      if (typeof p.title === 'string' && p.title.trim() && content.value) {
        content.value.title = p.title.trim()
      }

      // Article / sondage : page unique implicite, on ignore d'éventuelles `pages`.
      const wantsPages = supportsPages.value && Array.isArray(p.pages) && p.pages.length > 0
      pages.value = wantsPages
        ? (p.pages as StudioDocumentPage[])
        : [{ id: 'default', title: 'Page 1' }]
      currentPageId.value = pages.value[0]?.id ?? 'default'
      const defaultPageId = currentPageId.value

      sections.value = (p.sections as Section[]).map((s) => ({
        ...s,
        pageId: wantsPages ? (s.pageId ?? defaultPageId) : defaultPageId,
      }))
      // Tolérance : une IA peut omettre `fieldMapping` / `config` sur un bloc de texte.
      blocks.value = (p.blocks as StudioBlock[])
        .map((b) => ({ ...b, fieldMapping: b.fieldMapping ?? {}, config: b.config ?? {} }))
        .map(normalizeBlockSources)

      migrateLegacyTemplatePages(pages, sections, blocks)
      migrateMultiColumnSections(sections, blocks)
      for (const b of blocks.value) {
        if (b.type === 'param' && 'paramFanOut' in b.config) {
          delete (b.config as Record<string, unknown>).paramFanOut
        }
      }
      syncAllSearchPageParams()
      syncAllParamBlockPageParams()
      pageParams.value = defaultParamsForPage(pages.value.find((pg) => pg.id === currentPageId.value))

      selectedBlockId.value = null
      selectedSectionId.value = null
      isPanelOpen.value = false
      isSidebarRightOpen.value = false

      markDirty()
      return { ok: true }
    } catch (e) {
      if (content.value && backup.title !== undefined) content.value.title = backup.title
      pages.value = backup.pages
      sections.value = backup.sections
      blocks.value = backup.blocks
      dropLastSnapshot()
      return { ok: false, error: e instanceof Error ? e.message : 'Import impossible : JSON incompatible.' }
    }
  }

  return { getPayload, importPayload }
}
