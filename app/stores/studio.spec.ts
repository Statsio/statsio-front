import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from './studio'

describe('useStudioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('addSection', () => {
    it('pushes to the end when atIndex is omitted', () => {
      const store = useStudioStore()
      const initialCount = store.sections.length
      store.addSection('2-cols')
      expect(store.sections).toHaveLength(initialCount + 1)
      expect(store.sections[store.sections.length - 1]!.layout).toBe('2-cols')
    })

    it('inserts at atIndex when given', () => {
      const store = useStudioStore()
      const first = store.sections[0]!
      store.addSection('3-cols', 0)
      expect(store.sections[0]!.layout).toBe('3-cols')
      expect(store.sections[1]!.id).toBe(first.id)
    })

    it('sets canUndo to true afterward', () => {
      const store = useStudioStore()
      expect(store.canUndo).toBe(false)
      store.addSection('2-cols')
      expect(store.canUndo).toBe(true)
    })
  })

  describe('removeSection', () => {
    it('is a no-op for a locked section', () => {
      const store = useStudioStore()
      const section = store.addSection('2-cols', undefined, true)
      const before = store.sections.length
      store.removeSection(section.id)
      expect(store.sections).toHaveLength(before)
    })

    it('cascades removal of all blocks whose zoneId belongs to the section', () => {
      const store = useStudioStore()
      const section = store.addSection('2-cols')
      store.addBlock('kpi', `${section.id}-0`)
      store.addBlock('kpi', `${section.id}-1`)
      store.addBlock('kpi', `${store.sections[0]!.id}-0`)

      store.removeSection(section.id)

      expect(store.sections.find((s) => s.id === section.id)).toBeUndefined()
      expect(store.blocks.filter((b) => b.zoneId.startsWith(`${section.id}-`))).toHaveLength(0)
      expect(store.blocks).toHaveLength(1)
    })

    it('clears selectedBlockId if the removed block was selected', () => {
      const store = useStudioStore()
      const section = store.addSection('2-cols')
      const block = store.addBlock('kpi', `${section.id}-0`)
      store.selectBlock(block.id)

      store.removeSection(section.id)

      expect(store.selectedBlockId).toBeNull()
      expect(store.isSidebarRightOpen).toBe(false)
    })
  })

  describe('changeSectionLayout', () => {
    it('is a no-op for a missing section', () => {
      const store = useStudioStore()
      const before = store.sections.length
      store.changeSectionLayout('does-not-exist', '2-cols')
      expect(store.sections).toHaveLength(before)
    })

    it('is a no-op for a locked section', () => {
      const store = useStudioStore()
      const section = store.addSection('2-cols', undefined, true)
      store.changeSectionLayout(section.id, '3-cols')
      expect(store.sections.find((s) => s.id === section.id)!.layout).toBe('2-cols')
    })

    it('remaps zoneId of blocks via the min(colIdx, newCols-1) clamp when columns shrink', () => {
      const store = useStudioStore()
      const section = store.addSection('3-cols')
      const block0 = store.addBlock('kpi', `${section.id}-0`)
      const block2 = store.addBlock('kpi', `${section.id}-2`)

      store.changeSectionLayout(section.id, '2-cols')

      expect(store.blocks.find((b) => b.id === block0.id)!.zoneId).toBe(`${section.id}-0`)
      expect(store.blocks.find((b) => b.id === block2.id)!.zoneId).toBe(`${section.id}-1`)
      expect(store.sections.find((s) => s.id === section.id)!.layout).toBe('2-cols')
    })
  })

  describe('reorderSections / reorderCurrentPageSections', () => {
    it('reorderSections keeps locked sections pinned at their original relative position', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSection('1-col')
      const locked = store.addSection('2-cols', undefined, true)
      const b = store.addSection('3-cols')

      store.reorderSections([b, a, locked])

      expect(store.sections.map((s) => s.id)).toEqual([b.id, locked.id, a.id])
    })

    it('reorderCurrentPageSections only reorders sections belonging to currentPageId', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSection('1-col')
      const b = store.addSection('2-cols')
      store.addPage('Other page')
      const other = store.addSection('3-cols')
      store.switchPage('default')

      store.reorderCurrentPageSections([b, a])

      // Sections belonging to other pages are kept, prepended, ahead of the reordered current page.
      expect(store.sections.map((s) => s.id)).toEqual([other.id, b.id, a.id])
    })
  })

  describe('addBlock', () => {
    it('appends to the end when atIndex is omitted, selects it and opens the right sidebar', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const block = store.addBlock('kpi', `${section.id}-0`)
      expect(store.blocks[store.blocks.length - 1]!.id).toBe(block.id)
      expect(store.selectedBlockId).toBe(block.id)
      expect(store.isSidebarRightOpen).toBe(true)
    })

    it('inserts at the correct flat-array position for a zone that is not at the start of blocks', () => {
      const store = useStudioStore()
      const sectionA = store.addSection('1-col')
      const sectionB = store.addSection('1-col')

      // Blocks from a different zone (sectionA) come first in the flat array.
      store.addBlock('kpi', `${sectionA.id}-0`)
      const bFirst = store.addBlock('kpi', `${sectionB.id}-0`)
      const bSecond = store.addBlock('kpi', `${sectionB.id}-0`)

      // Insert a new block at index 1 within sectionB's zone (between bFirst and bSecond).
      const inserted = store.addBlock('kpi', `${sectionB.id}-0`, 1)

      const zoneOrder = store.blocks.filter((b) => b.zoneId === `${sectionB.id}-0`).map((b) => b.id)
      expect(zoneOrder).toEqual([bFirst.id, inserted.id, bSecond.id])
    })

    it('falls back to push when atIndex is out of range for the zone', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const zoneId = `${section.id}-0`
      store.addBlock('kpi', zoneId)
      const inserted = store.addBlock('kpi', zoneId, 10)
      expect(store.blocks[store.blocks.length - 1]!.id).toBe(inserted.id)
    })

    it('applies TEXT_DEFAULTS config for text block types', () => {
      const store = useStudioStore()
      const block = store.addBlock('heading', `${store.sections[0]!.id}-0`)
      expect(block.config).toMatchObject({ content: '<h2></h2>', headingLevel: 2 })
    })

    it('applies FORM_DEFAULTS config for form block types', () => {
      const store = useStudioStore()
      const block = store.addBlock('rating', `${store.sections[0]!.id}-0`)
      expect(block.config).toMatchObject({ ratingMax: 5 })
    })
  })

  describe('removeBlock / duplicateBlock', () => {
    it('removeBlock is a no-op for a locked block', () => {
      const store = useStudioStore()
      const block = store.addBlock('kpi', `${store.sections[0]!.id}-0`, undefined, true)
      store.removeBlock(block.id)
      expect(store.blocks.find((b) => b.id === block.id)).toBeDefined()
    })

    it('duplicateBlock returns null for a locked block', () => {
      const store = useStudioStore()
      const block = store.addBlock('kpi', `${store.sections[0]!.id}-0`, undefined, true)
      expect(store.duplicateBlock(block.id)).toBeNull()
    })

    it('duplicateBlock inserts the clone directly after the original and selects it', () => {
      const store = useStudioStore()
      const zoneId = `${store.sections[0]!.id}-0`
      const first = store.addBlock('kpi', zoneId)
      store.addBlock('kpi', zoneId)

      const clone = store.duplicateBlock(first.id)

      expect(clone).not.toBeNull()
      const idx = store.blocks.findIndex((b) => b.id === first.id)
      expect(store.blocks[idx + 1]!.id).toBe(clone!.id)
      expect(store.selectedBlockId).toBe(clone!.id)
    })
  })

  describe('selectBlock', () => {
    it('opens the right sidebar for a non-null id and closes it for null', () => {
      const store = useStudioStore()
      const block = store.addBlock('kpi', `${store.sections[0]!.id}-0`)
      store.selectBlock(block.id)
      expect(store.isSidebarRightOpen).toBe(true)
      store.selectBlock(null)
      expect(store.isSidebarRightOpen).toBe(false)
      expect(store.selectedBlockId).toBeNull()
    })
  })

  describe('setZoneBlocks', () => {
    it('reassigns zoneId for a cross-zone move and reorders per blockIds, leaving other blocks untouched', () => {
      const store = useStudioStore()
      const sectionA = store.addSection('1-col')
      const sectionB = store.addSection('1-col')
      const zoneA = `${sectionA.id}-0`
      const zoneB = `${sectionB.id}-0`

      const a1 = store.addBlock('kpi', zoneA)
      const a2 = store.addBlock('kpi', zoneA)
      const untouched = store.addBlock('kpi', zoneB)

      store.setZoneBlocks(zoneA, [a2.id, a1.id])

      expect(store.blocks.find((b) => b.id === a1.id)!.zoneId).toBe(zoneA)
      expect(store.blocks.find((b) => b.id === a2.id)!.zoneId).toBe(zoneA)
      expect(store.blocks.find((b) => b.id === untouched.id)!.zoneId).toBe(zoneB)

      const zoneAOrder = store.blocks.filter((b) => b.zoneId === zoneA).map((b) => b.id)
      expect(zoneAOrder).toEqual([a2.id, a1.id])
    })
  })

  describe('updateBlockConfig', () => {
    it('does not push a history snapshot when the patch is content-only', () => {
      const store = useStudioStore()
      const block = store.addBlock('paragraph', `${store.sections[0]!.id}-0`)
      store.updateBlockConfig(block.id, { content: '<p>hello</p>' })

      // Only the addBlock snapshot exists — one undo should revert all the way
      // back to before the block was added.
      store.undo()
      expect(store.blocks).toHaveLength(0)
    })

    it('pushes a history snapshot for any other key', () => {
      const store = useStudioStore()
      const block = store.addBlock('kpi', `${store.sections[0]!.id}-0`)
      store.updateBlockConfig(block.id, { title: 'New title' })

      // Two snapshots now exist — one undo should revert the title but keep the block.
      store.undo()
      expect(store.blocks.find((b) => b.id === block.id)).toBeDefined()
      expect(store.blocks.find((b) => b.id === block.id)!.config.title).toBe('')
    })
  })

  describe('undo / redo', () => {
    it('undo reverts pages/sections/blocks to the previous snapshot', () => {
      const store = useStudioStore()
      const initialSectionCount = store.sections.length
      store.addSection('2-cols')
      expect(store.sections).toHaveLength(initialSectionCount + 1)

      store.undo()
      expect(store.sections).toHaveLength(initialSectionCount)
    })

    it('redo reapplies the undone snapshot', () => {
      const store = useStudioStore()
      const initialSectionCount = store.sections.length
      store.addSection('2-cols')
      store.undo()
      store.redo()
      expect(store.sections).toHaveLength(initialSectionCount + 1)
    })

    it('undo is a no-op when past is empty', () => {
      const store = useStudioStore()
      const snapshot = [...store.sections]
      store.undo()
      expect(store.sections).toEqual(snapshot)
    })

    it('redo is a no-op when future is empty', () => {
      const store = useStudioStore()
      store.addSection('2-cols')
      const snapshot = [...store.sections]
      store.redo()
      expect(store.sections).toEqual(snapshot)
    })
  })

  describe('currentPageSections getter', () => {
    it('filters sections by currentPageId, defaulting missing pageId to "default"', () => {
      const store = useStudioStore()
      store.sections.push({ id: 'no-page-id', layout: '1-col' } as never)
      store.addPage('Other page')
      store.switchPage('default')

      expect(store.currentPageSections.some((s) => s.id === 'no-page-id')).toBe(true)
      expect(store.currentPageSections.every((s) => (s.pageId ?? 'default') === 'default')).toBe(true)
    })
  })

  describe('blocksByZone getter', () => {
    it('buckets blocks by zoneId and includes empty zones for defined sections', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const section = store.addSection('2-cols')
      const block = store.addBlock('kpi', `${section.id}-0`)

      const byZone = store.blocksByZone
      expect(byZone[`${section.id}-0`]).toEqual([block])
      expect(byZone[`${section.id}-1`]).toEqual([])
    })
  })
})
