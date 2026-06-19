import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  StudioBlock,
  StudioContent,
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

export const useStudioStore = defineStore('studio', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const content = ref<StudioContent | null>(null)
  const sections = ref<Section[]>([{ id: uid(), layout: '1-col' }])
  const blocks = ref<StudioBlock[]>([])

  const selectedBlockId = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const activeLeftTab = ref<SidebarLeftTab>('blocks')
  const isPanelOpen = ref(false)
  const isSidebarRightOpen = ref(false)
  const isDirty = ref(false)
  const dirtyVersion = ref(0)

  // ─── Computed ────────────────────────────────────────────────────────────────

  const selectedBlock = computed<StudioBlock | null>(() => {
    if (!selectedBlockId.value) return null
    return blocks.value.find((b) => b.id === selectedBlockId.value) ?? null
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
  ) {
    content.value = pageContent
    sections.value = pageSections ?? [{ id: uid(), layout: '1-col' }]
    blocks.value = pageBlocks ?? []
    selectedBlockId.value = null
    saveStatus.value = 'idle'
    isDirty.value = false
    dirtyVersion.value = 0
  }

  function setTitle(title: string) {
    if (!content.value) return
    content.value.title = title
    markDirty()
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  function addSection(layout: SectionLayout, atIndex?: number) {
    const section: Section = { id: uid(), layout }
    if (atIndex !== undefined) {
      sections.value.splice(atIndex, 0, section)
    } else {
      sections.value.push(section)
    }
    markDirty()
    return section
  }

  function removeSection(sectionId: string) {
    sections.value = sections.value.filter((s) => s.id !== sectionId)
    // Remove blocks that belonged to zones of this section
    blocks.value = blocks.value.filter((b) => !b.zoneId.startsWith(`${sectionId}-`))
    if (selectedBlockId.value) {
      const stillExists = blocks.value.find((b) => b.id === selectedBlockId.value)
      if (!stillExists) {
        selectedBlockId.value = null
        isSidebarRightOpen.value = false
      }
    }
    markDirty()
  }

  function changeSectionLayout(sectionId: string, layout: SectionLayout) {
    const section = sections.value.find((s) => s.id === sectionId)
    if (!section) return
    const oldCols = getColCount(section.layout)
    const newCols = getColCount(layout)
    // Migrate blocks: keep them in same column index if possible, else merge into last col
    blocks.value = blocks.value.map((b) => {
      if (!b.zoneId.startsWith(`${sectionId}-`)) return b
      const colIdx = parseInt(b.zoneId.split('-').pop() ?? '0', 10)
      const safeIdx = Math.min(colIdx, newCols - 1)
      return { ...b, zoneId: `${sectionId}-${safeIdx}` }
    })
    section.layout = layout
    markDirty()
  }

  function reorderSections(newOrder: Section[]) {
    sections.value = newOrder
    markDirty()
  }

  // ─── Blocks ──────────────────────────────────────────────────────────────────

  function addBlock(type: BlockType, zoneId: string): StudioBlock {
    const block: StudioBlock = {
      id: uid(),
      type,
      zoneId,
      fieldMapping: {},
      config: { title: '' },
    }
    blocks.value.push(block)
    selectedBlockId.value = block.id
    isSidebarRightOpen.value = true
    markDirty()
    return block
  }

  function removeBlock(blockId: string) {
    blocks.value = blocks.value.filter((b) => b.id !== blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
    }
    markDirty()
  }

  function selectBlock(blockId: string | null) {
    selectedBlockId.value = blockId
    isSidebarRightOpen.value = blockId !== null
  }

  function moveBlock(blockId: string, toZoneId: string) {
    const block = blocks.value.find((b) => b.id === blockId)
    if (!block) return
    block.zoneId = toZoneId
    markDirty()
  }

  // Called by vuedraggable v-model setter — handles both reorder within zone
  // and cross-zone moves (updates zoneId for moved blocks)
  function setZoneBlocks(zoneId: string, blockIds: string[]) {
    // Update zoneId for blocks that landed in this zone
    for (const block of blocks.value) {
      if (blockIds.includes(block.id)) {
        block.zoneId = zoneId
      }
    }
    // Reorder: place zone blocks in the declared order
    const zoneBlocks = blockIds
      .map((id) => blocks.value.find((b) => b.id === id))
      .filter(Boolean) as StudioBlock[]
    const otherBlocks = blocks.value.filter((b) => !blockIds.includes(b.id) && b.zoneId !== zoneId)
    blocks.value = [...otherBlocks, ...zoneBlocks]
    markDirty()
  }

  function updateBlockConfig(blockId: string, config: Partial<BlockConfig>) {
    const block = blocks.value.find((b) => b.id === blockId)
    if (!block) return
    block.config = { ...block.config, ...config }
    markDirty()
  }

  function updateBlockDataset(blockId: string, datasetId: string) {
    const block = blocks.value.find((b) => b.id === blockId)
    if (!block) return
    block.datasetId = datasetId
    block.fieldMapping = {}
    markDirty()
  }

  function updateBlockFieldMapping(blockId: string, mapping: Partial<FieldMapping>) {
    const block = blocks.value.find((b) => b.id === blockId)
    if (!block) return
    block.fieldMapping = { ...block.fieldMapping, ...mapping }
    markDirty()
  }

  function updateBlockFilters(blockId: string, filters: import('@/types/studio').BlockFilter[]) {
    const block = blocks.value.find((b) => b.id === blockId)
    if (!block) return
    block.filters = filters
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
      sections: sections.value,
      blocks: blocks.value,
    }
  }

  return {
    content,
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
    initPage,
    setTitle,
    addSection,
    removeSection,
    changeSectionLayout,
    reorderSections,
    addBlock,
    removeBlock,
    selectBlock,
    moveBlock,
    setZoneBlocks,
    updateBlockConfig,
    updateBlockDataset,
    updateBlockFieldMapping,
    updateBlockFilters,
    setSaveStatus,
    markDirty,
    setLeftTab,
    closePanel,
    getPayload,
  }
})
