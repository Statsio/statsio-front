import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  StudioBlock,
  StudioContent,
  StudioDocumentPage,
  BlockType,
  FieldMapping,
  BlockConfig,
  SaveStatus,
  SidebarLeftTab,
  Section,
  SectionLayout,
} from '@/types/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function getColCount(layout: SectionLayout): number {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout)?.cols ?? 1
}

interface HistoryEntry {
  pages: StudioDocumentPage[]
  sections: Section[]
  blocks: StudioBlock[]
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

const MAX_HISTORY = 50

export const useStudioStore = defineStore('studio', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const content = ref<StudioContent | null>(null)
  const pages = ref<StudioDocumentPage[]>([{ id: 'default', title: 'Page 1' }])
  const currentPageId = ref<string>('default')
  const pageParams = ref<Record<string, string>>({})
  const sections = ref<Section[]>([{ id: uid(), layout: '1-col', pageId: 'default' }])
  const blocks = ref<StudioBlock[]>([])

  const selectedBlockId = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const activeLeftTab = ref<SidebarLeftTab>('blocks')
  const isPanelOpen = ref(false)
  const isSidebarRightOpen = ref(false)
  const isDirty = ref(false)
  const dirtyVersion = ref(0)

  // ─── History (undo/redo) ─────────────────────────────────────────────────────

  const past = ref<HistoryEntry[]>([])
  const future = ref<HistoryEntry[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // Call BEFORE applying a mutation to save the current state
  function snapshot() {
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = []
  }

  function undo() {
    const prev = past.value[past.value.length - 1]
    if (!prev) return
    future.value = [
      ...future.value,
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    past.value = past.value.slice(0, -1)
    pages.value = prev.pages
    sections.value = prev.sections
    blocks.value = prev.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  function redo() {
    const next = future.value[future.value.length - 1]
    if (!next) return
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = future.value.slice(0, -1)
    pages.value = next.pages
    sections.value = next.sections
    blocks.value = next.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  const currentPage = computed<StudioDocumentPage | undefined>(
    () => pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value),
  )

  const currentPageSections = computed<Section[]>(
    () => sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value),
  )

  const selectedBlock = computed<StudioBlock | null>(() => {
    if (!selectedBlockId.value) return null
    return blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value) ?? null
  })

  // Zone IDs derived from sections: `${sectionId}-${colIndex}`
  const blocksByZone = computed<Record<string, StudioBlock[]>>(() => {
    const map: Record<string, StudioBlock[]> = {}
    for (const section of sections.value) {
      const cols = getColCount(section.layout)
      for (let i = 0; i < cols; i++) {
        map[`${section.id}-${i}`] = []
      }
    }
    for (const block of blocks.value) {
      if (!map[block.zoneId]) map[block.zoneId] = []
      map[block.zoneId]!.push(block)
    }
    return map
  })

  // ─── Page init ───────────────────────────────────────────────────────────────

  function initPage(
    pageContent: StudioContent,
    pageSections?: Section[],
    pageBlocks?: StudioBlock[],
    documentPages?: StudioDocumentPage[],
  ) {
    content.value = pageContent

    if (documentPages && documentPages.length > 0) {
      pages.value = documentPages
    } else {
      pages.value = [{ id: 'default', title: 'Page 1' }]
    }
    currentPageId.value = pages.value[0]?.id ?? 'default'
    pageParams.value = {}

    // Migrate sections without pageId to the first page
    const defaultPageId = pages.value[0]?.id ?? 'default'
    sections.value = (pageSections ?? [{ id: uid(), layout: '1-col', pageId: defaultPageId }]).map((s) => ({
      ...s,
      pageId: s.pageId ?? defaultPageId,
    }))

    blocks.value = pageBlocks ?? []
    selectedBlockId.value = null
    saveStatus.value = 'idle'
    isDirty.value = false
    dirtyVersion.value = 0
    past.value = []
    future.value = []
  }

  function setTitle(title: string) {
    if (!content.value) return
    content.value.title = title
    markDirty()
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  function addSection(layout: SectionLayout, atIndex?: number, locked?: boolean) {
    snapshot()
    const section: Section = { id: uid(), layout, pageId: currentPageId.value, locked }
    if (atIndex !== undefined) {
      sections.value.splice(atIndex, 0, section)
    } else {
      sections.value.push(section)
    }
    markDirty()
    return section
  }

  function removeSection(sectionId: string) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (section?.locked) return
    snapshot()
    sections.value = sections.value.filter((s: Section) => s.id !== sectionId)
    blocks.value = blocks.value.filter((b: StudioBlock) => !b.zoneId?.startsWith(`${sectionId}-`))
    if (selectedBlockId.value) {
      const stillExists = blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value)
      if (!stillExists) {
        selectedBlockId.value = null
        isSidebarRightOpen.value = false
      }
    }
    markDirty()
  }

  function changeSectionLayout(sectionId: string, layout: SectionLayout) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section || section.locked) return
    snapshot()
    const newCols = getColCount(layout)
    blocks.value = blocks.value.map((b: StudioBlock) => {
      if (!b.zoneId.startsWith(`${sectionId}-`)) return b
      const colIdx = parseInt(b.zoneId?.split('-').pop() ?? '0', 10)
      const safeIdx = Math.min(colIdx, newCols - 1)
      return { ...b, zoneId: `${sectionId}-${safeIdx}` }
    })
    section.layout = layout
    markDirty()
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

  function reorderCurrentPageSections(newPageOrder: Section[]) {
    snapshot()
    const otherSections = sections.value.filter((s: Section) => (s.pageId ?? 'default') !== currentPageId.value)
    const currentPageOriginal = sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value)
    
    // Keep locked sections in their original positions for current page
    const currentNonLocked = newPageOrder.filter(s => !s.locked)
    const mergedCurrentPage: Section[] = []
    let nonLockedIdx = 0
    for (const originalSection of currentPageOriginal) {
      if (originalSection.locked) {
        mergedCurrentPage.push(originalSection)
      } else if (nonLockedIdx < currentNonLocked.length) {
        mergedCurrentPage.push(currentNonLocked[nonLockedIdx++]!)
      }
    }
    while (nonLockedIdx < currentNonLocked.length) {
      mergedCurrentPage.push(currentNonLocked[nonLockedIdx++]!)
    }
    
    sections.value = [...otherSections, ...mergedCurrentPage]
    markDirty()
  }

  // ─── Pages ───────────────────────────────────────────────────────────────────

  function addPage(title: string, options: { isTemplate?: boolean; paramName?: string; description?: string; icon?: string } = {}): StudioDocumentPage {
    snapshot()
    const page: StudioDocumentPage = {
      id: uid(),
      title,
      slug: title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: options.description,
      isTemplate: options.isTemplate,
      paramName: options.paramName,
      icon: options.icon,
    }
    pages.value.push(page)
    currentPageId.value = page.id
    pageParams.value = {}
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
    markDirty()
    return page
  }

  function updatePage(pageId: string, patch: Partial<Omit<StudioDocumentPage, 'id'>>) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    if (!page) return
    snapshot()
    Object.assign(page, patch)
    markDirty()
  }

  function switchPage(pageId: string) {
    if (!pages.value.find((p: StudioDocumentPage) => p.id === pageId)) return
    currentPageId.value = pageId
    pageParams.value = {}
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
  }

  // Like switchPage but keeps existing pageParams (used when URL navigation already set them)
  function switchPageKeepParams(pageId: string) {
    if (!pages.value.find((p: StudioDocumentPage) => p.id === pageId)) return
    currentPageId.value = pageId
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
  }

  function removePage(pageId: string) {
    if (pages.value.length <= 1) return
    snapshot()
    // Remove blocks that belong to sections of this page
    const pageSectionIds = sections.value
      .filter((s: Section) => (s.pageId ?? 'default') === pageId)
      .map((s: Section) => s.id)
    blocks.value = blocks.value.filter((b: StudioBlock) => {
      const sectionId = b.zoneId?.split('-').slice(0, -1).join('-') ?? ''
      return !pageSectionIds.includes(sectionId)
    })
    sections.value = sections.value.filter((s: Section) => (s.pageId ?? 'default') !== pageId)
    pages.value = pages.value.filter((p: StudioDocumentPage) => p.id !== pageId)
    if (currentPageId.value === pageId) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
      pageParams.value = {}
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
    }
    markDirty()
  }

  function setPageParam(name: string, value: string) {
    pageParams.value = { ...pageParams.value, [name]: value }
  }

  function setPageParams(params: Record<string, string>) {
    pageParams.value = { ...params }
  }

  function clearPageParams() {
    pageParams.value = {}
  }

  // ─── Blocks ──────────────────────────────────────────────────────────────────

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
  }

  function addBlock(type: BlockType, zoneId: string, atIndex?: number, locked?: boolean): StudioBlock {
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

  function removeBlock(blockId: string) {
    const target = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (target?.locked) return
    snapshot()
    blocks.value = blocks.value.filter((b: StudioBlock) => b.id !== blockId)
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
    blocks.value.splice(originalIdx + 1, 0, clone)

    selectedBlockId.value = clone.id
    isSidebarRightOpen.value = true
    markDirty()
    return clone
  }

  function selectBlock(blockId: string | null) {
    selectedBlockId.value = blockId
    isSidebarRightOpen.value = blockId !== null
  }

  function moveBlock(blockId: string, toZoneId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.zoneId = toZoneId
    markDirty()
  }

  function setZoneBlocks(zoneId: string, blockIds: string[]) {
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
    markDirty()
  }

  function updateBlockConfig(blockId: string, config: Partial<BlockConfig>) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    // Text content changes are handled by Tiptap's internal history — no structural snapshot
    const isTextOnly = Object.keys(config).length === 1 && 'content' in config
    if (!isTextOnly) snapshot()
    block.config = { ...block.config, ...config }
    markDirty()
  }

  function updateBlockDataset(blockId: string, datasetId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.datasetId = datasetId
    block.fieldMapping = {}
    markDirty()
  }

  function updateBlockFieldMapping(blockId: string, mapping: Partial<FieldMapping>) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.fieldMapping = { ...block.fieldMapping, ...mapping }
    markDirty()
  }

  function updateBlockFilters(blockId: string, filters: import('@/types/studio').BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.filters = filters
    markDirty()
  }

  function updateBlockComparisonFilters(blockId: string, filters: import('@/types/studio').BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.comparisonFilters = filters
    markDirty()
  }

  function updateBlockJoins(blockId: string, joins: import('@/types/studio').BlockJoin[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.joins = joins
    markDirty()
  }

  // ─── Save status ─────────────────────────────────────────────────────────────

  function setSaveStatus(status: SaveStatus) {
    saveStatus.value = status
    if (status === 'saved') isDirty.value = false
  }

  function markDirty() {
    isDirty.value = true
    saveStatus.value = 'idle'
    dirtyVersion.value++
  }

  // ─── Sidebar ─────────────────────────────────────────────────────────────────

  function setLeftTab(tab: SidebarLeftTab) {
    if (activeLeftTab.value === tab && isPanelOpen.value) {
      isPanelOpen.value = false
    } else {
      activeLeftTab.value = tab
      isPanelOpen.value = true
    }
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  // ─── Serialization ────────────────────────────────────────────────────────────

  function getPayload() {
    return {
      title: content.value?.title,
      pages: pages.value,
      sections: sections.value,
      blocks: blocks.value,
    }
  }

  return {
    content,
    pages,
    currentPageId,
    currentPage,
    currentPageSections,
    pageParams,
    sections,
    blocks,
    selectedBlock,
    selectedBlockId,
    blocksByZone,
    saveStatus,
    isDirty,
    dirtyVersion,
    activeLeftTab,
    isPanelOpen,
    isSidebarRightOpen,
    canUndo,
    canRedo,
    initPage,
    setTitle,
    addSection,
    removeSection,
    changeSectionLayout,
    reorderSections,
    addPage,
    updatePage,
    switchPage,
    removePage,
    setPageParam,
    setPageParams,
    clearPageParams,
    switchPageKeepParams,
    reorderCurrentPageSections,
    addBlock,
    removeBlock,
    duplicateBlock,
    selectBlock,
    moveBlock,
    setZoneBlocks,
    updateBlockConfig,
    updateBlockDataset,
    updateBlockFieldMapping,
    updateBlockFilters,
    updateBlockComparisonFilters,
    updateBlockJoins,
    setSaveStatus,
    markDirty,
    undo,
    redo,
    setLeftTab,
    closePanel,
    getPayload,
  }
})
