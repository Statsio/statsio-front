import { computed, type Ref } from 'vue'
import type { CanvasItemRef, Section, SectionLayout, StudioBlock, StudioContent, StudioDocumentPage, BlockType } from '@/types/studio'
import {
  SECTION_LAYOUT_DEFINITIONS,
  scriptZoneId,
  scriptIdFromZone,
  pageZoneId,
  isPageZone,
  isScriptBlock,
  isContainerBlock,
  FORM_BLOCK_TYPES,
} from '@/types/studio'
import { readIfBranches } from '@/lib/studio-if'

export function getColCount(layout: SectionLayout): number {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout)?.cols ?? 1
}

export function useStudioCanvas(deps: {
  content: Ref<StudioContent | null>
  pages: Ref<StudioDocumentPage[]>
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isSidebarRightOpen: Ref<boolean>
  snapshot: () => void
  markDirty: () => void
}) {
  const {
    content, pages, sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    snapshot, markDirty,
  } = deps

  /**
   * Le multi-pages (sélecteur de pages, fan-out d'URL, blocs de page) n'existe
   * que pour les StatsData. Les articles et sondages restent sur une page unique
   * implicite (`default`).
   */
  const supportsPages = computed(() => content.value?.type === 'statsdata')

  const currentPage = computed<StudioDocumentPage | undefined>(
    () => pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value),
  )

  const currentPageSections = computed<Section[]>(
    () => sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value),
  )

  /** Sections racine de la page courante (pas nichées dans la zone d'un bloc de script de page). */
  const currentPageTopLevelSections = computed<Section[]>(
    () => currentPageSections.value.filter((s: Section) => !s.zoneId),
  )

  /** Sections nichées dans une zone de bloc de script (`scriptZoneId(blockId, branch)`), dans l'ordre du tableau. */
  function sectionsInZone(zoneId: string): Section[] {
    return sections.value.filter((s: Section) => s.zoneId === zoneId)
  }

  /**
   * Éléments de premier niveau du flux de la page courante — sections racine +
   * blocs `loop`/`if` posés au niveau page — dans l'ordre de `currentPage.canvas`.
   * Repli sur l'ordre des sections racine quand `canvas` est absent ; complète en
   * fin toute section / bloc de page manquant (robustesse + docs existants).
   */
  const currentPageCanvasItems = computed<Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }>>(() => {
    const rootSections = currentPageTopLevelSections.value
    const zone = pageZoneId(currentPageId.value)
    const pageBlocks = blocks.value.filter((b: StudioBlock) => b.zoneId === zone)
    const bySection = new Map(rootSections.map((s) => [s.id, s]))
    const byBlock = new Map(pageBlocks.map((b) => [b.id, b]))

    const out: Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }> = []
    const seen = new Set<string>()
    for (const ref of currentPage.value?.canvas ?? []) {
      const key = `${ref.kind}:${ref.id}`
      if (seen.has(key)) continue
      if (ref.kind === 'section' && bySection.has(ref.id)) {
        out.push({ ref, section: bySection.get(ref.id) }); seen.add(key)
      } else if (ref.kind === 'block' && byBlock.has(ref.id)) {
        out.push({ ref, block: byBlock.get(ref.id) }); seen.add(key)
      }
    }
    for (const s of rootSections) {
      if (!seen.has(`section:${s.id}`)) out.push({ ref: { kind: 'section', id: s.id }, section: s })
    }
    for (const b of pageBlocks) {
      if (!seen.has(`block:${b.id}`)) out.push({ ref: { kind: 'block', id: b.id }, block: b })
    }
    return out
  })

  const selectedBlock = computed<StudioBlock | null>(() => {
    if (!selectedBlockId.value) return null
    return blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value) ?? null
  })

  const selectedSection = computed<Section | null>(
    () => sections.value.find((s: Section) => s.id === selectedSectionId.value) ?? null,
  )

  function selectSection(sectionId: string | null) {
    selectedSectionId.value = sectionId
    if (sectionId) selectedBlockId.value = null
    isSidebarRightOpen.value = sectionId !== null
  }

  function updateSection(sectionId: string, patch: Partial<Omit<Section, 'id'>>) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section) return
    snapshot()
    Object.assign(section, patch)
    markDirty()
  }

  // Zone IDs derived from sections: `${sectionId}-${colIndex}`
  // Plus one zone per script block: a `loop` has `loop:${blockId}:0`, an `if` has
  // one zone per branch (`loop:${blockId}:${branchIndex}`).
  const blocksByZone = computed<Record<string, StudioBlock[]>>(() => {
    const map: Record<string, StudioBlock[]> = {}
    for (const page of pages.value) {
      // Zone racine de page : accueille les blocs `loop`/`if` posés hors des sections.
      map[pageZoneId(page.id)] = []
    }
    for (const section of sections.value) {
      const cols = getColCount(section.layout)
      for (let i = 0; i < cols; i++) {
        map[`${section.id}-${i}`] = []
      }
    }
    for (const block of blocks.value) {
      if (block.type === 'if') {
        const branchCount = Math.max(1, readIfBranches(block.config).length)
        for (let i = 0; i < branchCount; i++) map[scriptZoneId(block.id, i)] ??= []
      } else if (block.type === 'layout') {
        const cols = getColCount(block.config.layoutType ?? '2-cols')
        for (let i = 0; i < cols; i++) map[scriptZoneId(block.id, i)] ??= []
      } else if (isScriptBlock(block.type)) {
        map[scriptZoneId(block.id)] ??= []
      }
    }
    for (const block of blocks.value) {
      if (!map[block.zoneId]) map[block.zoneId] = []
      map[block.zoneId]!.push(block)
    }
    return map
  })

  /** Ids des blocs enfants (directs + descendants) d'un bloc de script — toutes branches confondues. */
  function loopChildIds(scriptBlockId: string): string[] {
    const out: string[] = []
    const stack = [scriptBlockId]
    while (stack.length) {
      const parentId = stack.pop()!
      for (const b of blocks.value) {
        if (scriptIdFromZone(b.zoneId) === parentId) {
          out.push(b.id)
          if (isContainerBlock(b.type)) stack.push(b.id)
        }
      }
    }
    return out
  }

  /** Blocs de script englobant `blockId`, du plus proche au plus lointain. */
  function loopAncestors(blockId: string): StudioBlock[] {
    const out: StudioBlock[] = []
    let current = blocks.value.find((b: StudioBlock) => b.id === blockId)
    const guard = new Set<string>()
    while (current) {
      const parentId = scriptIdFromZone(current.zoneId)
      if (!parentId || guard.has(parentId)) break
      guard.add(parentId)
      const parent = blocks.value.find((b: StudioBlock) => b.id === parentId && isContainerBlock(b.type))
      if (!parent) break
      out.push(parent)
      current = parent
    }
    return out
  }

  /**
   * Dans une zone de script (`loop:` / `if:`) on autorise tout SAUF `search`,
   * `param` et les blocs de formulaire. Le script imbriqué (loop/if dans loop/if)
   * est permis.
   */
  function canPlaceInZone(type: BlockType, zoneId: string): boolean {
    // Zone racine de page : uniquement des blocs de script (répètent / conditionnent des sections).
    if (isPageZone(zoneId)) return type === 'loop' || type === 'if'
    if (!zoneId.startsWith('loop:')) return true
    return type !== 'search' && type !== 'param' && !FORM_BLOCK_TYPES.includes(type)
  }

  /** Refs actuelles du flux de la page courante — sert à matérialiser `page.canvas`. */
  function currentCanvasRefs(): CanvasItemRef[] {
    return currentPageCanvasItems.value.map((i) => i.ref)
  }

  function insertCanvasRef(ref: CanvasItemRef, atIndex?: number) {
    const page = currentPage.value
    if (!page) return
    // Matérialise depuis l'ordre courant EN EXCLUANT l'élément qu'on insère
    // (l'auto-complétion de `currentPageCanvasItems` l'a déjà mis en fin).
    const base = (page.canvas ?? currentCanvasRefs()).filter((r) => !(r.kind === ref.kind && r.id === ref.id))
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= base.length) base.splice(atIndex, 0, ref)
    else base.push(ref)
    page.canvas = base
  }

  function dropCanvasRef(kind: CanvasItemRef['kind'], id: string) {
    const canvas = currentPage.value?.canvas
    if (canvas) currentPage.value!.canvas = canvas.filter((r) => !(r.kind === kind && r.id === id))
  }

  return {
    supportsPages,
    currentPage,
    currentPageSections,
    currentPageTopLevelSections,
    sectionsInZone,
    currentPageCanvasItems,
    selectedBlock,
    selectedSection,
    selectSection,
    updateSection,
    blocksByZone,
    loopChildIds,
    loopAncestors,
    canPlaceInZone,
    currentCanvasRefs,
    insertCanvasRef,
    dropCanvasRef,
  }
}
