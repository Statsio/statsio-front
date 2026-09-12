import type { ComputedRef, Ref } from 'vue'
import type { CanvasItemRef, Section, StudioBlock, StudioDocumentPage, BlockType } from '@/types/studio'
import { scriptIdFromZone, scriptZoneId, scriptZoneBranch, isContainerBlock, pageZoneId } from '@/types/studio'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

export function useStudioSections(deps: {
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isSidebarRightOpen: Ref<boolean>
  currentPage: ComputedRef<StudioDocumentPage | undefined>
  currentPageCanvasItems: ComputedRef<Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }>>
  sectionsInZone: (zoneId: string) => Section[]
  insertCanvasRef: (ref: CanvasItemRef, atIndex?: number) => void
  dropCanvasRef: (kind: CanvasItemRef['kind'], id: string) => void
  loopChildIds: (scriptBlockId: string) => string[]
  addBlock: (type: BlockType, zoneId: string, atIndex?: number, locked?: boolean) => StudioBlock
  snapshot: () => void
  markDirty: () => void
}) {
  const {
    sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    currentPage, currentPageCanvasItems, sectionsInZone, insertCanvasRef, dropCanvasRef, loopChildIds, addBlock,
    snapshot, markDirty,
  } = deps

  /**
   * `zoneId` : insère la section dans la zone d'un bloc de script de page
   * (`scriptZoneId(blockId, branch)`) plutôt qu'à la racine — `atIndex` se lit
   * alors parmi les sections de cette zone (défaut : à la fin). Sans `zoneId`,
   * insertion au niveau page ; `atIndex` = position dans le tableau `sections.value`
   * (bas niveau — l'ordre du flux visible passe par `page.canvas`). Toujours
   * `layout: '1-col'` (colonnes portées par le bloc « Disposition »).
   */
  function addSection(atIndex?: number, locked?: boolean, zoneId?: string): Section {
    snapshot()
    const section: Section = { id: uid(), layout: '1-col', pageId: currentPageId.value, locked, zoneId }
    if (zoneId) {
      const siblings = sectionsInZone(zoneId)
      const useAt = atIndex !== undefined && atIndex < siblings.length
      const anchor = useAt ? siblings[atIndex] : siblings[siblings.length - 1]
      if (anchor) {
        const at = sections.value.findIndex((s: Section) => s.id === anchor.id)
        sections.value.splice(useAt ? at : at + 1, 0, section)
      } else {
        sections.value.push(section)
      }
    } else if (atIndex !== undefined) {
      sections.value.splice(atIndex, 0, section)
    } else {
      sections.value.push(section)
    }
    markDirty()
    return section
  }

  /** Ajoute une section racine à la position `atIndex` du flux de la page (drag depuis le canevas). */
  function addSectionInFlow(atIndex?: number): Section {
    const section = addSection()
    insertCanvasRef({ kind: 'section', id: section.id }, atIndex)
    markDirty()
    return section
  }

  /**
   * Ajoute un bloc `loop`/`if` au niveau page (hors des sections) : répète ou
   * conditionne des sections entières. `atIndex` = position dans le flux de la page.
   */
  function addPageBlock(type: 'loop' | 'if', atIndex?: number): StudioBlock {
    const block = addBlock(type, pageZoneId(currentPageId.value))
    insertCanvasRef({ kind: 'block', id: block.id }, atIndex)
    markDirty()
    return block
  }

  /** Repositionne le groupe de sections d'une zone dans `sections.value`, dans l'ordre voulu (sans snapshot). */
  function applyZoneOrder(zoneId: string, orderIds: string[]) {
    const byId = new Map(sections.value.map((s) => [s.id, s]))
    const ordered = orderIds.map((id) => byId.get(id)).filter((s): s is Section => !!s).map((s) => ({ ...s, zoneId }))
    const kept = sections.value.filter((s: Section) => s.zoneId !== zoneId)
    const firstRemovedIdx = sections.value.findIndex((s: Section) => s.zoneId === zoneId)
    let at = kept.length
    if (firstRemovedIdx !== -1) {
      at = sections.value.slice(0, firstRemovedIdx).filter((s: Section) => s.zoneId !== zoneId).length
    }
    kept.splice(at, 0, ...ordered)
    sections.value = kept
  }

  /** Réordonne les sections d'une zone de bloc de script (drag & drop interne). */
  function reorderSectionZone(zoneId: string, newOrder: Section[]) {
    snapshot()
    applyZoneOrder(zoneId, newOrder.map((s) => s.id))
    markDirty()
  }

  /** Déplace une section (racine ou autre zone) DANS une zone de bloc de script, à l'index voulu. */
  function moveSectionToZone(sectionId: string, zoneId: string, atIndex: number) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section || section.zoneId === zoneId) return
    snapshot()
    dropCanvasRef('section', sectionId)
    const others = sectionsInZone(zoneId).filter((s) => s.id !== sectionId).map((s) => s.id)
    const at = Math.max(0, Math.min(atIndex, others.length))
    others.splice(at, 0, sectionId)
    section.zoneId = zoneId
    applyZoneOrder(zoneId, others)
    markDirty()
  }

  /** Sort une section d'une zone de script pour la remettre à la racine de la page, à l'index de flux voulu. */
  function moveSectionToFlow(sectionId: string, atFlowIndex: number) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section) return
    snapshot()
    section.zoneId = undefined
    insertCanvasRef({ kind: 'section', id: sectionId }, atFlowIndex)
    markDirty()
  }

  /** Réécrit l'ordre du flux de premier niveau de la page courante. */
  function reorderPageCanvas(newItems: CanvasItemRef[]) {
    const page = currentPage.value
    if (!page) return
    snapshot()
    page.canvas = [...newItems]
    markDirty()
  }

  /** Réordonne les sections racine de la page courante (compat — le canevas passe par `reorderPageCanvas`). */
  function reorderCurrentPageSections(newTopLevelOrder: Section[]) {
    snapshot()
    const otherSections = sections.value.filter((s: Section) => (s.pageId ?? 'default') !== currentPageId.value)
    const currentPageOriginal = sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value)
    const currentTopOriginal = currentPageOriginal.filter((s: Section) => !s.zoneId)
    const nested = currentPageOriginal.filter((s: Section) => s.zoneId)

    const currentNonLocked = newTopLevelOrder.filter((s) => !s.locked)
    const mergedTop: Section[] = []
    let idx = 0
    for (const orig of currentTopOriginal) {
      if (orig.locked) mergedTop.push(orig)
      else if (idx < currentNonLocked.length) mergedTop.push(currentNonLocked[idx++]!)
    }
    while (idx < currentNonLocked.length) mergedTop.push(currentNonLocked[idx++]!)

    sections.value = [...otherSections, ...mergedTop, ...nested]
    if (currentPage.value?.canvas) {
      const order = new Map(mergedTop.map((s, i) => [s.id, i]))
      currentPage.value.canvas = [...currentPage.value.canvas].sort((a, b) => {
        const av = a.kind === 'section' ? order.get(a.id) ?? Infinity : Infinity
        const bv = b.kind === 'section' ? order.get(b.id) ?? Infinity : Infinity
        return av - bv
      })
    }
    markDirty()
  }

  function removeSection(sectionId: string) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (section?.locked) return
    snapshot()
    sections.value = sections.value.filter((s: Section) => s.id !== sectionId)
    dropCanvasRef('section', sectionId)
    if (selectedSectionId.value === sectionId) {
      selectedSectionId.value = null
      isSidebarRightOpen.value = false
    }
    const removed = new Set<string>()
    for (const b of blocks.value) {
      if (!b.zoneId?.startsWith(`${sectionId}-`)) continue
      removed.add(b.id)
      if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => removed.add(id))
    }
    blocks.value = blocks.value.filter((b: StudioBlock) => !removed.has(b.id))
    if (selectedBlockId.value) {
      const stillExists = blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value)
      if (!stillExists) {
        selectedBlockId.value = null
        isSidebarRightOpen.value = false
      }
    }
    markDirty()
  }

  /** Réordonne une section racine dans le flux de la page (flèches ↑/↓ de la barre d'outils de section). */
  function moveSectionInFlow(sectionId: string, dir: -1 | 1) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section || section.locked || section.zoneId) return
    const items = currentPageCanvasItems.value
    const pos = items.findIndex((i) => i.ref.kind === 'section' && i.ref.id === sectionId)
    if (pos === -1) return
    const target = items[pos + dir]
    if (!target || (target.section?.locked ?? false)) return
    const refs = items.map((i) => i.ref)
    ;[refs[pos], refs[pos + dir]] = [refs[pos + dir]!, refs[pos]!]
    reorderPageCanvas(refs)
  }

  /** Duplique une section (en-tête + tous ses blocs, scripts imbriqués compris) juste après l'originale. */
  function duplicateSection(sectionId: string): Section | null {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section || section.locked) return null

    snapshot()
    const clone: Section = { ...deepClone(section), id: uid(), locked: undefined }

    // Blocs directs de la section (`${sectionId}-N`) + descendants de leurs blocs de script.
    const ids = new Set<string>()
    for (const b of blocks.value) {
      if (!b.zoneId?.startsWith(`${sectionId}-`)) continue
      ids.add(b.id)
      if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => ids.add(id))
    }
    const toClone = blocks.value.filter((b: StudioBlock) => ids.has(b.id))
    const idMap = new Map<string, string>()
    for (const b of toClone) idMap.set(b.id, uid())

    const clones: StudioBlock[] = toClone.map((b) => {
      let zoneId = b.zoneId
      if (zoneId.startsWith(`${sectionId}-`)) {
        zoneId = `${clone.id}-${zoneId.slice(sectionId.length + 1)}`
      } else {
        const parentOldId = scriptIdFromZone(zoneId)
        if (parentOldId && idMap.has(parentOldId)) {
          zoneId = scriptZoneId(idMap.get(parentOldId)!, scriptZoneBranch(b.zoneId))
        }
      }
      return { ...deepClone(b), id: idMap.get(b.id)!, locked: undefined, zoneId }
    })

    const origIdx = sections.value.findIndex((s: Section) => s.id === sectionId)
    sections.value.splice(origIdx + 1, 0, clone)
    blocks.value.push(...clones)

    if (!section.zoneId) {
      const items = currentPageCanvasItems.value
      const pos = items.findIndex((i) => i.ref.kind === 'section' && i.ref.id === sectionId)
      insertCanvasRef({ kind: 'section', id: clone.id }, pos === -1 ? undefined : pos + 1)
    }

    selectedSectionId.value = clone.id
    selectedBlockId.value = null
    isSidebarRightOpen.value = true
    markDirty()
    return clone
  }

  function reorderSections(newOrder: Section[]) {
    snapshot()
    // Keep locked sections in their original relative positions, only reorder non-locked ones
    const originalLocked = sections.value.filter(s => s.locked)
    const newNonLocked = newOrder.filter(s => !s.locked)

    // Create a map of locked section IDs to their original indices
    const lockedPositions = new Map<string, number>()
    originalLocked.forEach((s, idx) => lockedPositions.set(s.id, idx))

    // Merge locked sections (in original order) with non-locked sections (in new order), keeping locked in their original relative positions
    const result: Section[] = []
    let nonLockedIndex = 0

    // Iterate through original sections, inserting locked sections in original place and non-locked in new order
    for (const originalSection of sections.value) {
      if (originalSection.locked) {
        result.push(originalSection)
      } else if (nonLockedIndex < newNonLocked.length) {
        result.push(newNonLocked[nonLockedIndex++]!)
      }
    }
    // Add any remaining non-locked sections (shouldn't happen, but just in case)
    while (nonLockedIndex < newNonLocked.length) {
      result.push(newNonLocked[nonLockedIndex++]!)
    }

    sections.value = result
    markDirty()
  }

  return {
    addSection,
    addSectionInFlow,
    addPageBlock,
    reorderSectionZone,
    moveSectionToZone,
    moveSectionToFlow,
    reorderPageCanvas,
    reorderCurrentPageSections,
    removeSection,
    moveSectionInFlow,
    duplicateSection,
    reorderSections,
  }
}
