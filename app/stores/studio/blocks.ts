import type { ComputedRef, Ref } from 'vue'
import type { BlockConfig, BlockType, Section, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { scriptIdFromZone, scriptZoneId, scriptZoneBranch, isContainerBlock } from '@/types/studio'
import { scriptDescendantsOf } from '@/lib/studio-tree'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

const TEXT_DEFAULTS: Partial<Record<BlockType, object>> = {
  heading:   { content: '<h2></h2>', headingLevel: 2, textAlign: 'left' },
  paragraph: { content: '<p></p>', textAlign: 'left' },
  quote:     { content: '<p></p>', textAlign: 'left' },
  callout:   { content: '<p></p>', textAlign: 'left', calloutColor: '#eff6ff' },
}

const FORM_DEFAULTS: Partial<Record<BlockType, object>> = {
  choice:     { formOptions: ['Option 1', 'Option 2'] },
  checkboxes: { formOptions: ['Option 1', 'Option 2'] },
  dropdown:   { formOptions: ['Option 1', 'Option 2'] },
  scale:      { scaleMin: 1, scaleMax: 5 },
  rating:     { ratingMax: 5 },
  'sd-embed': { showSourceLink: true },
  layout:     { layoutType: '2-cols' },
}

export function useStudioBlocks(deps: {
  blocks: Ref<StudioBlock[]>
  sections: Ref<Section[]>
  pages: Ref<StudioDocumentPage[]>
  currentPageId: Ref<string>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isSidebarRightOpen: Ref<boolean>
  selectedBlock: ComputedRef<StudioBlock | null>
  canPlaceInZone: (type: BlockType, zoneId: string) => boolean
  loopChildIds: (scriptBlockId: string) => string[]
  dropCanvasRef: (kind: 'section' | 'block', id: string) => void
  addSection: () => Section
  syncParamBlockPageParam: (blockId: string) => void
  syncAutoPageParam: (blockId: string) => void
  snapshot: () => void
  markDirty: () => void
}) {
  const {
    blocks, sections, pages, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    selectedBlock, canPlaceInZone, loopChildIds, dropCanvasRef, addSection, syncParamBlockPageParam, syncAutoPageParam,
    snapshot, markDirty,
  } = deps

  /** Zone de la première colonne de la dernière section de la page courante (en crée une au besoin). */
  function fallbackZoneId(): string {
    const pageSections = sections.value.filter(
      (s: Section) => (s.pageId ?? 'default') === currentPageId.value && !s.zoneId,
    )
    const last = pageSections[pageSections.length - 1]
    if (last) return `${last.id}-0`
    return `${addSection().id}-0`
  }

  function addBlock(type: BlockType, zoneId: string, atIndex?: number, locked?: boolean): StudioBlock {
    // Zone de boucle : un bloc loop / recherche / formulaire n'y est pas autorisé →
    // on le place dans une section normale plutôt que de créer un bloc invalide.
    if (!canPlaceInZone(type, zoneId)) {
      zoneId = fallbackZoneId()
      atIndex = undefined
    }
    snapshot()
    const block: StudioBlock = {
      id: uid(),
      type,
      zoneId,
      locked: locked || undefined,
      fieldMapping: {},
      config: { title: '', ...TEXT_DEFAULTS[type], ...FORM_DEFAULTS[type] },
    }

    if (atIndex !== undefined) {
      const zoneBlockIds = blocks.value.filter((b: StudioBlock) => b.zoneId === zoneId).map((b: StudioBlock) => b.id)
      if (atIndex < zoneBlockIds.length) {
        const flatIdx = blocks.value.findIndex((b: StudioBlock) => b.id === zoneBlockIds[atIndex])
        if (flatIdx >= 0) {
          blocks.value.splice(flatIdx, 0, block)
        } else {
          blocks.value.push(block)
        }
      } else {
        blocks.value.push(block)
      }
    } else {
      blocks.value.push(block)
    }

    selectedBlockId.value = block.id
    isSidebarRightOpen.value = true
    markDirty()
    return block
  }

  /**
   * Ajoute un bloc sans drag & drop (clic sur une carte du panneau « Éléments »).
   * Cible : la zone du bloc sélectionné, sinon la première zone de la dernière
   * section de la page courante, sinon une nouvelle section 1-col.
   */
  function addBlockSmart(type: BlockType): StudioBlock {
    const selected = selectedBlock.value
    if (selected) return addBlock(type, selected.zoneId)

    const pageSections = sections.value.filter(
      (s: Section) => (s.pageId ?? 'default') === currentPageId.value && !s.zoneId,
    )
    const lastSection = pageSections[pageSections.length - 1]
    if (lastSection) return addBlock(type, `${lastSection.id}-0`)

    const section = addSection()
    return addBlock(type, `${section.id}-0`)
  }

  function removeBlock(blockId: string) {
    const target = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (target?.locked) return
    snapshot()
    const toRemove = new Set<string>([blockId])
    let sectionsToRemove = new Set<string>()
    if (target && isContainerBlock(target.type)) {
      const d = scriptDescendantsOf(blockId, blocks.value, sections.value)
      d.blocks.forEach((id) => toRemove.add(id))
      sectionsToRemove = d.sections
    }
    blocks.value = blocks.value.filter((b: StudioBlock) => !toRemove.has(b.id))
    if (sectionsToRemove.size) sections.value = sections.value.filter((s: Section) => !sectionsToRemove.has(s.id))
    // Retire les `PageParam` auto-déclarés par les blocs recherche / paramètre supprimés.
    for (const page of pages.value) {
      if (!page.params?.length) continue
      const keep = page.params.filter(
        (p) =>
          (!p.searchBlockId || !toRemove.has(p.searchBlockId)) &&
          (!p.paramBlockId || !toRemove.has(p.paramBlockId)),
      )
      if (keep.length !== page.params.length) page.params = keep.length ? keep : undefined
    }
    // Un bloc recherche supprimé peut rendre le fan-out à un bloc paramètre resté sur la page.
    for (const b of blocks.value) if (b.type === 'param') syncParamBlockPageParam(b.id)
    dropCanvasRef('block', blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
    }
    markDirty()
  }

  function duplicateBlock(blockId: string): StudioBlock | null {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.locked) return null

    snapshot()
    const clone: StudioBlock = { ...deepClone(block), id: uid(), locked: undefined }
    const originalIdx = blocks.value.findIndex((b: StudioBlock) => b.id === blockId)
    const inserts: StudioBlock[] = [clone]

    // Bloc conteneur (loop / if / layout) : cloner aussi ses enfants et les rattacher à la zone du clone.
    if (isContainerBlock(block.type)) {
      const idMap = new Map<string, string>([[blockId, clone.id]])
      for (const childId of loopChildIds(blockId)) {
        const child = blocks.value.find((b: StudioBlock) => b.id === childId)
        if (!child) continue
        const newId = uid()
        idMap.set(childId, newId)
        const parentOldId = scriptIdFromZone(child.zoneId)!
        inserts.push({
          ...deepClone(child),
          id: newId,
          locked: undefined,
          zoneId: scriptZoneId(idMap.get(parentOldId) ?? clone.id, scriptZoneBranch(child.zoneId)),
        })
      }
    }

    blocks.value.splice(originalIdx + 1, 0, ...inserts)

    selectedBlockId.value = clone.id
    isSidebarRightOpen.value = true
    markDirty()
    return clone
  }

  function selectBlock(blockId: string | null) {
    selectedBlockId.value = blockId
    if (blockId) selectedSectionId.value = null
    isSidebarRightOpen.value = blockId !== null
  }

  function moveBlock(blockId: string, toZoneId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.zoneId = toZoneId
    syncAutoPageParam(blockId)
    markDirty()
  }

  /** Réordonne un bloc à l'intérieur de sa zone (flèches ↑/↓ de la barre d'outils du bloc). */
  function moveBlockWithinZone(blockId: string, dir: -1 | 1) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    const zoneBlocks = blocks.value.filter((b: StudioBlock) => b.zoneId === block.zoneId)
    const posInZone = zoneBlocks.findIndex((b: StudioBlock) => b.id === blockId)
    const target = zoneBlocks[posInZone + dir]
    if (!target) return
    snapshot()
    const i = blocks.value.findIndex((b: StudioBlock) => b.id === blockId)
    const j = blocks.value.findIndex((b: StudioBlock) => b.id === target.id)
    const next = [...blocks.value]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    blocks.value = next
    markDirty()
  }

  function setZoneBlocks(zoneId: string, blockIds: string[]) {
    // Zone de boucle : ignore les blocs qu'on ne peut pas y placer (loop imbriquée,
    // recherche, formulaire) — ils gardent leur zone d'origine, le drop est annulé.
    if (zoneId.startsWith('loop:')) {
      blockIds = blockIds.filter((id) => {
        const b = blocks.value.find((x: StudioBlock) => x.id === id)
        return !b || b.zoneId === zoneId || canPlaceInZone(b.type, zoneId)
      })
    }
    snapshot()
    for (const block of blocks.value) {
      if (blockIds.includes(block.id)) {
        block.zoneId = zoneId
      }
    }
    const zoneBlocks = blockIds
      .map((id) => blocks.value.find((b: StudioBlock) => b.id === id))
      .filter(Boolean) as StudioBlock[]
    const otherBlocks = blocks.value.filter((b: StudioBlock) => !blockIds.includes(b.id) && b.zoneId !== zoneId)
    blocks.value = [...otherBlocks, ...zoneBlocks]
    for (const b of zoneBlocks) syncAutoPageParam(b.id)
    markDirty()
  }

  function updateBlockConfig(blockId: string, config: Partial<BlockConfig>) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    // Text content changes are handled by Tiptap's internal history — no structural snapshot
    const isTextOnly = Object.keys(config).length === 1 && 'content' in config
    if (!isTextOnly) snapshot()
    block.config = { ...block.config, ...config }
    if (block.type === 'param') syncParamBlockPageParam(blockId)
    markDirty()
  }

  return {
    addBlock,
    addBlockSmart,
    removeBlock,
    duplicateBlock,
    selectBlock,
    moveBlock,
    moveBlockWithinZone,
    setZoneBlocks,
    updateBlockConfig,
  }
}
