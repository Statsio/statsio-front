import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from './studio'

describe('useStudioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('addSection', () => {
    it('pushes to the end when atIndex is omitted, always as 1-col', () => {
      const store = useStudioStore()
      const initialCount = store.sections.length
      store.addSection()
      expect(store.sections).toHaveLength(initialCount + 1)
      expect(store.sections[store.sections.length - 1]!.layout).toBe('1-col')
    })

    it('inserts at atIndex when given', () => {
      const store = useStudioStore()
      const first = store.sections[0]!
      store.addSection(0)
      expect(store.sections[0]!.layout).toBe('1-col')
      expect(store.sections[1]!.id).toBe(first.id)
    })

    it('sets canUndo to true afterward', () => {
      const store = useStudioStore()
      expect(store.canUndo).toBe(false)
      store.addSection()
      expect(store.canUndo).toBe(true)
    })
  })

  describe('removeSection', () => {
    it('is a no-op for a locked section', () => {
      const store = useStudioStore()
      const section = store.addSection(undefined, true)
      const before = store.sections.length
      store.removeSection(section.id)
      expect(store.sections).toHaveLength(before)
    })

    it('cascades removal of all blocks whose zoneId belongs to the section', () => {
      const store = useStudioStore()
      const section = store.addSection()
      store.addBlock('kpi', `${section.id}-0`)
      store.addBlock('kpi', `${section.id}-0`)
      store.addBlock('kpi', `${store.sections[0]!.id}-0`)

      store.removeSection(section.id)

      expect(store.sections.find((s) => s.id === section.id)).toBeUndefined()
      expect(store.blocks.filter((b) => b.zoneId.startsWith(`${section.id}-`))).toHaveLength(0)
      expect(store.blocks).toHaveLength(1)
    })

    it('clears selectedBlockId if the removed block was selected', () => {
      const store = useStudioStore()
      const section = store.addSection()
      const block = store.addBlock('kpi', `${section.id}-0`)
      store.selectBlock(block.id)

      store.removeSection(section.id)

      expect(store.selectedBlockId).toBeNull()
      expect(store.isSidebarRightOpen).toBe(false)
    })
  })

  describe('reorderSections / reorderCurrentPageSections', () => {
    it('reorderSections keeps locked sections pinned at their original relative position', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSection()
      const locked = store.addSection(undefined, true)
      const b = store.addSection()

      store.reorderSections([b, a, locked])

      expect(store.sections.map((s) => s.id)).toEqual([b.id, locked.id, a.id])
    })

    it('reorderCurrentPageSections only reorders sections belonging to currentPageId', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSection()
      const b = store.addSection()
      store.addPage('Other page')
      const other = store.addSection()
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
      const sectionA = store.addSection()
      const sectionB = store.addSection()

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

    it('seeds showSourceLink for a sd-embed block', () => {
      const store = useStudioStore()
      const block = store.addBlock('sd-embed', `${store.sections[0]!.id}-0`)
      expect(block.config).toMatchObject({ showSourceLink: true })
    })

    it('seeds a 2-cols layoutType for a layout block', () => {
      const store = useStudioStore()
      const block = store.addBlock('layout', `${store.sections[0]!.id}-0`)
      expect(block.config).toMatchObject({ layoutType: '2-cols' })
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

  describe('section chrome (selection + updateSection)', () => {
    it('selectSection and selectBlock are mutually exclusive and drive the right sidebar', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const block = store.addBlock('kpi', `${section.id}-0`)

      store.selectSection(section.id)
      expect(store.selectedSectionId).toBe(section.id)
      expect(store.selectedBlockId).toBeNull()
      expect(store.isSidebarRightOpen).toBe(true)

      store.selectBlock(block.id)
      expect(store.selectedSectionId).toBeNull()
      expect(store.selectedBlock?.id).toBe(block.id)

      store.selectSection(null)
      expect(store.isSidebarRightOpen).toBe(false)
    })

    it('updateSection patches kicker/title/theme and records history', () => {
      const store = useStudioStore()
      const id = store.sections[0]!.id
      store.updateSection(id, { kicker: 'KPI', title: 'Chiffres clés', theme: 'dark' })

      expect(store.selectedSection).toBeNull() // pas sélectionnée
      const s = store.sections.find((x) => x.id === id)!
      expect(s).toMatchObject({ kicker: 'KPI', title: 'Chiffres clés', theme: 'dark' })
      expect(store.canUndo).toBe(true)
    })

    it('removeSection clears its selection', () => {
      const store = useStudioStore()
      const extra = store.addSection()
      store.selectSection(extra.id)
      store.removeSection(extra.id)
      expect(store.selectedSectionId).toBeNull()
    })
  })

  describe('setZoneBlocks', () => {
    it('reassigns zoneId for a cross-zone move and reorders per blockIds, leaving other blocks untouched', () => {
      const store = useStudioStore()
      const sectionA = store.addSection()
      const sectionB = store.addSection()
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

  describe('layout blocks', () => {
    const seedLayoutWithChildren = () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const layout = store.addBlock('layout', `${section.id}-0`) // default '2-cols'
      const child0 = store.addBlock('kpi', `loop:${layout.id}:0`)
      const child1 = store.addBlock('bar', `loop:${layout.id}:1`)
      return { store, section, layout, child0, child1 }
    }

    it('changeBlockLayout remaps blocks in removed columns to the last remaining column', () => {
      const { store, layout, child0, child1 } = seedLayoutWithChildren()
      store.changeBlockLayout(layout.id, '1-col')

      expect(store.blocks.find((b) => b.id === child0.id)!.zoneId).toBe(`loop:${layout.id}:0`)
      expect(store.blocks.find((b) => b.id === child1.id)!.zoneId).toBe(`loop:${layout.id}:0`)
      expect(store.blocks.find((b) => b.id === layout.id)!.config.layoutType).toBe('1-col')
    })

    it('changeBlockLayout is a no-op for a non-layout block', () => {
      const store = useStudioStore()
      const block = store.addBlock('kpi', `${store.sections[0]!.id}-0`)
      store.changeBlockLayout(block.id, '3-cols')
      expect(store.blocks.find((b) => b.id === block.id)!.config.layoutType).toBeUndefined()
    })

    it('blocksByZone exposes one zone per column', () => {
      const { store, layout } = seedLayoutWithChildren()
      expect(Object.keys(store.blocksByZone)).toEqual(
        expect.arrayContaining([`loop:${layout.id}:0`, `loop:${layout.id}:1`]),
      )
      expect(store.blocksByZone[`loop:${layout.id}:2`]).toBeUndefined()
    })

    it('removeBlock cascades to the layout block\'s column children', () => {
      const { store, layout, child0, child1 } = seedLayoutWithChildren()
      store.removeBlock(layout.id)
      expect(store.blocks.find((b) => b.id === child0.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === child1.id)).toBeUndefined()
    })

    it('duplicateBlock clones a layout block and re-parents its column children', () => {
      const { store, layout, child0, child1 } = seedLayoutWithChildren()
      const clone = store.duplicateBlock(layout.id)!

      expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:0`)).toHaveLength(1)
      expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:1`)).toHaveLength(1)
      // Les blocs d'origine restent inchangés.
      expect(store.blocks.find((b) => b.id === child0.id)!.zoneId).toBe(`loop:${layout.id}:0`)
      expect(store.blocks.find((b) => b.id === child1.id)!.zoneId).toBe(`loop:${layout.id}:1`)
    })

    it('removeSection cascades to a layout block\'s column children', () => {
      const { store, section, child0 } = seedLayoutWithChildren()
      store.removeSection(section.id)
      expect(store.blocks.find((b) => b.id === child0.id)).toBeUndefined()
    })
  })

  describe('page-level loop / if (sections nested in a script zone)', () => {
    it('canPlaceInZone only allows loop / if in a page zone', () => {
      const store = useStudioStore()
      const zone = `page:${store.currentPageId}`
      expect(store.canPlaceInZone('loop', zone)).toBe(true)
      expect(store.canPlaceInZone('if', zone)).toBe(true)
      expect(store.canPlaceInZone('kpi', zone)).toBe(false)
      expect(store.canPlaceInZone('paragraph', zone)).toBe(false)
    })

    it('blocksByZone seeds a page zone for every page', () => {
      const store = useStudioStore()
      store.addPage('Second')
      expect(store.blocksByZone[`page:${store.pages[0]!.id}`]).toEqual([])
      expect(store.blocksByZone[`page:${store.pages[1]!.id}`]).toEqual([])
    })

    it('addSection with a zoneId nests the section and inherits pageId', () => {
      const store = useStudioStore()
      const loop = store.addPageBlock('loop')
      const zone = `loop:${loop.id}:0`
      const s = store.addSection(undefined, undefined, zone)
      expect(s.zoneId).toBe(zone)
      expect(s.pageId).toBe(store.currentPageId)
      expect(store.sectionsInZone(zone).map((x) => x.id)).toEqual([s.id])
      // Not a root section of the page.
      expect(store.currentPageTopLevelSections.find((x) => x.id === s.id)).toBeUndefined()
    })

    it('reorderSectionZone reorders one zone without touching another', () => {
      const store = useStudioStore()
      const loopA = store.addPageBlock('loop')
      const loopB = store.addPageBlock('loop')
      const za = `loop:${loopA.id}:0`
      const zb = `loop:${loopB.id}:0`
      const a1 = store.addSection(undefined, undefined, za)
      const a2 = store.addSection(undefined, undefined, za)
      const b1 = store.addSection(undefined, undefined, zb)

      store.reorderSectionZone(za, [store.sectionsInZone(za)[1]!, store.sectionsInZone(za)[0]!])

      expect(store.sectionsInZone(za).map((s) => s.id)).toEqual([a2.id, a1.id])
      expect(store.sectionsInZone(zb).map((s) => s.id)).toEqual([b1.id])
    })

    it('addPageBlock + reorderPageCanvas position a page block between sections', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const s1 = store.addSectionInFlow()
      const s2 = store.addSectionInFlow()
      const block = store.addPageBlock('if', 1) // between s1 and s2

      expect(store.currentPageCanvasItems.map((i) => i.ref)).toEqual([
        { kind: 'section', id: s1.id },
        { kind: 'block', id: block.id },
        { kind: 'section', id: s2.id },
      ])

      store.reorderPageCanvas([
        { kind: 'block', id: block.id },
        { kind: 'section', id: s1.id },
        { kind: 'section', id: s2.id },
      ])
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([block.id, s1.id, s2.id])
    })

    it('removeBlock on a page loop cascades to nested sections + their blocks', () => {
      const store = useStudioStore()
      const loop = store.addPageBlock('loop')
      const zone = `loop:${loop.id}:0`
      const nested = store.addSection(undefined, undefined, zone)
      const innerBlock = store.addBlock('kpi', `${nested.id}-0`)
      const innerLoop = store.addBlock('loop', `${nested.id}-0`)
      const deepBlock = store.addBlock('bar', `loop:${innerLoop.id}:0`)

      store.removeBlock(loop.id)

      expect(store.blocks.find((b) => b.id === loop.id)).toBeUndefined()
      expect(store.sections.find((s) => s.id === nested.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === innerBlock.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === innerLoop.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === deepBlock.id)).toBeUndefined()
      expect(store.currentPageCanvasItems.some((i) => i.ref.id === loop.id)).toBe(false)
    })

    it('removeIfBranch drops the sections of the removed branch and renumbers the rest', () => {
      const store = useStudioStore()
      const cond = store.addPageBlock('if')
      store.addIfBranch(cond.id, 'elsif') // branch 1
      store.addIfBranch(cond.id, 'else')  // branch 2
      const sifSi = store.addSection(undefined, undefined, `loop:${cond.id}:0`)
      const sElsif = store.addSection(undefined, undefined, `loop:${cond.id}:1`)
      const sElse = store.addSection(undefined, undefined, `loop:${cond.id}:2`)

      store.removeIfBranch(cond.id, 1) // remove the "Sinon si" branch

      expect(store.sections.find((s) => s.id === sElsif.id)).toBeUndefined()
      expect(store.sections.find((s) => s.id === sifSi.id)!.zoneId).toBe(`loop:${cond.id}:0`)
      expect(store.sections.find((s) => s.id === sElse.id)!.zoneId).toBe(`loop:${cond.id}:1`)
    })

    it('moveSectionToZone reparents a root section into a script zone and drops its canvas ref', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const s1 = store.addSectionInFlow()
      const loop = store.addPageBlock('loop')
      const zone = `loop:${loop.id}:0`

      store.moveSectionToZone(s1.id, zone, 0)

      expect(store.sections.find((s) => s.id === s1.id)!.zoneId).toBe(zone)
      expect(store.sectionsInZone(zone).map((s) => s.id)).toEqual([s1.id])
      expect(store.currentPage!.canvas!.some((r) => r.kind === 'section' && r.id === s1.id)).toBe(false)
      expect(store.currentPageTopLevelSections.find((s) => s.id === s1.id)).toBeUndefined()
    })

    it('moveSectionToFlow pulls a section out of its zone back to the page flow', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const s1 = store.addSectionInFlow()
      const loop = store.addPageBlock('loop')
      const zone = `loop:${loop.id}:0`
      const nested = store.addSection(undefined, undefined, zone)

      store.moveSectionToFlow(nested.id, 0)

      expect(store.sections.find((s) => s.id === nested.id)!.zoneId).toBeUndefined()
      expect(store.sectionsInZone(zone)).toHaveLength(0)
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([nested.id, s1.id, loop.id])
    })

    it('currentPageCanvasItems falls back to root section order without page.canvas', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSection()
      const b = store.addSection()
      expect(store.currentPage!.canvas).toBeUndefined()
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([a.id, b.id])
    })
  })

  describe('moveSectionInFlow', () => {
    it('swaps a root section with its neighbour in the page flow', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSectionInFlow()
      const b = store.addSectionInFlow()
      const c = store.addSectionInFlow()

      store.moveSectionInFlow(b.id, -1)
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([b.id, a.id, c.id])

      store.moveSectionInFlow(b.id, 1)
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([a.id, b.id, c.id])
    })

    it('is a no-op at the flow edges and for locked sections', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSectionInFlow()
      const b = store.addSectionInFlow()

      store.moveSectionInFlow(a.id, -1)
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([a.id, b.id])

      const locked = store.addSection(undefined, true)
      store.moveSectionInFlow(locked.id, -1)
      expect(store.currentPageCanvasItems.map((i) => i.ref.id).slice(0, 2)).toEqual([a.id, b.id])
    })
  })

  describe('duplicateSection', () => {
    it('clones the section and its blocks right after the original', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const a = store.addSectionInFlow()
      store.updateSection(a.id, { title: 'Ma section' })
      store.addBlock('kpi', `${a.id}-0`)
      store.addBlock('kpi', `${a.id}-0`)
      const b = store.addSectionInFlow()

      const clone = store.duplicateSection(a.id)!
      expect(clone.id).not.toBe(a.id)
      expect(clone.title).toBe('Ma section')
      expect(store.currentPageCanvasItems.map((i) => i.ref.id)).toEqual([a.id, clone.id, b.id])
      expect(store.blocks.filter((bl) => bl.zoneId === `${clone.id}-0`)).toHaveLength(2)
      expect(store.selectedSectionId).toBe(clone.id)
    })

    it('is a no-op for a locked section', () => {
      const store = useStudioStore()
      const locked = store.addSection(undefined, true)
      const before = store.sections.length
      expect(store.duplicateSection(locked.id)).toBeNull()
      expect(store.sections).toHaveLength(before)
    })
  })

  describe('undo / redo', () => {
    it('undo reverts pages/sections/blocks to the previous snapshot', () => {
      const store = useStudioStore()
      const initialSectionCount = store.sections.length
      store.addSection()
      expect(store.sections).toHaveLength(initialSectionCount + 1)

      store.undo()
      expect(store.sections).toHaveLength(initialSectionCount)
    })

    it('redo reapplies the undone snapshot', () => {
      const store = useStudioStore()
      const initialSectionCount = store.sections.length
      store.addSection()
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
      store.addSection()
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
    it('buckets blocks by zoneId for a section (always a single zone)', () => {
      const store = useStudioStore()
      store.sections.splice(0, store.sections.length)
      const section = store.addSection()
      const block = store.addBlock('kpi', `${section.id}-0`)

      expect(store.blocksByZone[`${section.id}-0`]).toEqual([block])
    })

    it('exposes a zone for each loop block', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const loop = store.addBlock('loop', `${section.id}-0`)
      expect(store.blocksByZone[`loop:${loop.id}:0`]).toEqual([])
    })
  })

  describe('multi-column section migration', () => {
    it('converts a legacy multi-column section into a 1-col section + a layout block', () => {
      const store = useStudioStore()
      store.initPage(
        { id: 'c1', type: 'statsdata', title: 'Doc' },
        [{ id: 's1', layout: '2-cols', pageId: 'p1' }],
        [
          { id: 'b0', type: 'kpi', zoneId: 's1-0', fieldMapping: {}, config: {} },
          { id: 'b1', type: 'bar', zoneId: 's1-1', fieldMapping: {}, config: {} },
        ],
        [{ id: 'p1', title: 'Principale' }],
      )

      const section = store.sections.find((s) => s.id === 's1')!
      expect(section.layout).toBe('1-col')

      const layoutBlock = store.blocks.find((b) => b.type === 'layout')!
      expect(layoutBlock).toBeDefined()
      expect(layoutBlock.config.layoutType).toBe('2-cols')
      expect(layoutBlock.zoneId).toBe('s1-0')

      expect(store.blocks.find((b) => b.id === 'b0')!.zoneId).toBe(`loop:${layoutBlock.id}:0`)
      expect(store.blocks.find((b) => b.id === 'b1')!.zoneId).toBe(`loop:${layoutBlock.id}:1`)
    })

    it('is a no-op for an already 1-col section', () => {
      const store = useStudioStore()
      store.initPage(
        { id: 'c1', type: 'statsdata', title: 'Doc' },
        [{ id: 's1', layout: '1-col', pageId: 'p1' }],
        [{ id: 'b0', type: 'kpi', zoneId: 's1-0', fieldMapping: {}, config: {} }],
        [{ id: 'p1', title: 'Principale' }],
      )
      expect(store.blocks).toHaveLength(1)
      expect(store.blocks.find((b) => b.type === 'layout')).toBeUndefined()
    })
  })

  describe('loop blocks', () => {
    const seedLoopWithChild = () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const loop = store.addBlock('loop', `${section.id}-0`)
      const child = store.addBlock('kpi', `loop:${loop.id}:0`)
      return { store, section, loop, child }
    }

    it('canPlaceInZone allows nested script blocks but rejects search / param / form blocks in a loop zone', () => {
      const { store, loop } = seedLoopWithChild()
      const zone = `loop:${loop.id}:0`
      expect(store.canPlaceInZone('kpi', zone)).toBe(true)
      expect(store.canPlaceInZone('bar', zone)).toBe(true)
      expect(store.canPlaceInZone('loop', zone)).toBe(true)
      expect(store.canPlaceInZone('if', zone)).toBe(true)
      expect(store.canPlaceInZone('search', zone)).toBe(false)
      expect(store.canPlaceInZone('param', zone)).toBe(false)
      expect(store.canPlaceInZone('rating', zone)).toBe(false)
    })

    it('an "if" block gets its own child zone and cascades on delete like a loop', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const cond = store.addBlock('if', `${section.id}-0`)
      const child = store.addBlock('kpi', `loop:${cond.id}:0`)
      expect(store.blocksByZone[`loop:${cond.id}:0`]?.map((b) => b.id)).toEqual([child.id])
      expect(store.loopChildIds(cond.id)).toEqual([child.id])

      store.removeBlock(cond.id)
      expect(store.blocks.find((b) => b.id === child.id)).toBeUndefined()
    })

    it('duplicateBlock clones an "if" block and re-parents its children', () => {
      const store = useStudioStore()
      const section = store.sections[0]!
      const cond = store.addBlock('if', `${section.id}-0`)
      store.addBlock('paragraph', `loop:${cond.id}:0`)
      const clone = store.duplicateBlock(cond.id)!
      expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:0`)).toHaveLength(1)
    })

    describe('if branches (elsif / else)', () => {
      function seedIf() {
        const store = useStudioStore()
        const section = store.sections[0]!
        const cond = store.addBlock('if', `${section.id}-0`)
        return { store, cond }
      }

      it('addIfBranch creates a new zone for the appended branch', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'elsif')
        expect(store.blocksByZone[`loop:${cond.id}:1`]).toEqual([])
        expect(store.blocksByZone[`loop:${cond.id}:0`]).toEqual([])
      })

      it('addIfBranch "else" appends after existing elsif branches', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'elsif')
        store.addIfBranch(cond.id, 'else')
        expect(Object.keys(store.blocksByZone)).toEqual(
          expect.arrayContaining([`loop:${cond.id}:0`, `loop:${cond.id}:1`, `loop:${cond.id}:2`]),
        )
      })

      it('addIfBranch "elsif" inserts before an existing else and shifts its blocks down', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'else')
        const elseChild = store.addBlock('paragraph', `loop:${cond.id}:1`)
        store.addIfBranch(cond.id, 'elsif')
        // le contenu du "sinon" a migré de la branche 1 vers la branche 2
        expect(store.blocks.find((b) => b.id === elseChild.id)?.zoneId).toBe(`loop:${cond.id}:2`)
        expect(store.blocksByZone[`loop:${cond.id}:1`]).toEqual([])
      })

      it('refuses a second "else" branch', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'else')
        store.addIfBranch(cond.id, 'else')
        expect(store.blocksByZone[`loop:${cond.id}:2`]).toBeUndefined()
      })

      it('removeIfBranch deletes the branch\'s blocks and renumbers the following branches', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'elsif')
        store.addIfBranch(cond.id, 'else')
        const middleChild = store.addBlock('paragraph', `loop:${cond.id}:1`)
        const elseChild = store.addBlock('paragraph', `loop:${cond.id}:2`)

        store.removeIfBranch(cond.id, 1)

        expect(store.blocks.find((b) => b.id === middleChild.id)).toBeUndefined()
        expect(store.blocks.find((b) => b.id === elseChild.id)?.zoneId).toBe(`loop:${cond.id}:1`)
        expect(store.blocksByZone[`loop:${cond.id}:2`]).toBeUndefined()
      })

      it('removeIfBranch refuses to remove branch 0', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'elsif')
        store.removeIfBranch(cond.id, 0)
        expect(store.blocksByZone[`loop:${cond.id}:1`]).toBeDefined()
      })

      it('duplicateBlock preserves every branch and its children', () => {
        const { store, cond } = seedIf()
        store.addIfBranch(cond.id, 'elsif')
        store.addIfBranch(cond.id, 'else')
        store.addBlock('paragraph', `loop:${cond.id}:0`)
        store.addBlock('paragraph', `loop:${cond.id}:1`)
        store.addBlock('paragraph', `loop:${cond.id}:2`)

        const clone = store.duplicateBlock(cond.id)!

        expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:0`)).toHaveLength(1)
        expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:1`)).toHaveLength(1)
        expect(store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:2`)).toHaveLength(1)
      })
    })

    it('addBlock keeps a nested loop inside the loop zone', () => {
      const { store, loop } = seedLoopWithChild()
      const nested = store.addBlock('loop', `loop:${loop.id}:0`)
      expect(nested.zoneId).toBe(`loop:${loop.id}:0`)
    })

    it('removeBlock cascades through nested loops', () => {
      const { store, loop } = seedLoopWithChild()
      const nested = store.addBlock('loop', `loop:${loop.id}:0`)
      const grandChild = store.addBlock('kpi', `loop:${nested.id}:0`)
      store.removeBlock(loop.id)
      expect(store.blocks.find((b) => b.id === nested.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === grandChild.id)).toBeUndefined()
    })

    it('loopChildIds returns the loop descendants', () => {
      const { store, loop, child } = seedLoopWithChild()
      expect(store.loopChildIds(loop.id)).toEqual([child.id])
    })

    it('removeBlock on a loop cascades to its children', () => {
      const { store, loop, child } = seedLoopWithChild()
      store.removeBlock(loop.id)
      expect(store.blocks.find((b) => b.id === loop.id)).toBeUndefined()
      expect(store.blocks.find((b) => b.id === child.id)).toBeUndefined()
    })

    it('duplicateBlock clones the loop and re-parents its children', () => {
      const { store, loop, child } = seedLoopWithChild()
      const clone = store.duplicateBlock(loop.id)!
      const clonedChildren = store.blocks.filter((b) => b.zoneId === `loop:${clone.id}:0`)
      expect(clone.id).not.toBe(loop.id)
      expect(clonedChildren).toHaveLength(1)
      expect(clonedChildren[0]!.id).not.toBe(child.id)
    })

    it('removeSection cascades to loop children', () => {
      const { store, section, child } = seedLoopWithChild()
      store.removeSection(section.id)
      expect(store.blocks.find((b) => b.id === child.id)).toBeUndefined()
    })

    it('loopAncestors walks from a child up to its loop', () => {
      const { store, loop, child } = seedLoopWithChild()
      expect(store.loopAncestors(child.id).map((b) => b.id)).toEqual([loop.id])
    })

    it('setZoneBlocks moves an allowed block into the loop but drops a disallowed one', () => {
      const { store, section, loop } = seedLoopWithChild()
      const chart = store.addBlock('bar', `${section.id}-0`)
      const form = store.addBlock('rating', `${section.id}-0`)
      const zone = `loop:${loop.id}:0`

      store.setZoneBlocks(zone, [chart.id, form.id])

      expect(store.blocks.find((b) => b.id === chart.id)!.zoneId).toBe(zone)
      expect(store.blocks.find((b) => b.id === form.id)!.zoneId).toBe(`${section.id}-0`)
    })
  })

  describe('page parameters', () => {
    it('addPageParam declares a param and seeds its default into pageParams for the current page', () => {
      const store = useStudioStore()
      store.addPageParam('default', { name: 'carburant', column: 'carburant', defaultValue: 'gazole' })

      expect(store.currentPageParamDefs).toEqual([
        { name: 'carburant', column: 'carburant', defaultValue: 'gazole' },
      ])
      expect(store.pageParams.carburant).toBe('gazole')
      expect(store.canUndo).toBe(true)
    })

    it('ignores a duplicate param name', () => {
      const store = useStudioStore()
      store.addPageParam('default', { name: 'x', defaultValue: 'a' })
      store.addPageParam('default', { name: 'x', defaultValue: 'b' })
      expect(store.currentPageParamDefs).toHaveLength(1)
      expect(store.pageParams.x).toBe('a')
    })

    it('switchPage re-seeds pageParams from the target page defaults', () => {
      const store = useStudioStore()
      const other = store.addPage('Vue commune')
      store.addPageParam(other.id, { name: 'commune', defaultValue: 'Lyon' })
      store.switchPage('default')
      expect(store.pageParams.commune).toBeUndefined()

      store.switchPage(other.id)
      expect(store.pageParams.commune).toBe('Lyon')
    })

    it('updatePageParam changes the default and removePageParam drops the value', () => {
      const store = useStudioStore()
      store.addPageParam('default', { name: 'annee', defaultValue: '2025' })
      store.updatePageParam('default', 'annee', { defaultValue: '2026' })
      expect(store.pageParams.annee).toBe('2026')

      store.removePageParam('default', 'annee')
      expect(store.currentPageParamDefs).toHaveLength(0)
      expect(store.pageParams.annee).toBeUndefined()
    })

    it('initPage seeds pageParams from the first page declared params', () => {
      const store = useStudioStore()
      store.initPage(
        { id: 'c1', type: 'statsdata', title: 'Doc' },
        [{ id: 'p1', layout: '1-col', pageId: 'p1' }],
        [],
        [{ id: 'p1', title: 'Principale', params: [{ name: 'carburant', defaultValue: 'sp95' }] }],
      )
      expect(store.pageParams.carburant).toBe('sp95')
    })
  })

  describe('legacy template page migration', () => {
    it('converts an isTemplate page into a normal page + declared param, and unlocks its blocks', () => {
      const store = useStudioStore()
      store.initPage(
        { id: 'c1', type: 'statsdata', title: 'Doc' },
        [
          { id: 'sMain', layout: '1-col', pageId: 'pMain' },
          { id: 'sTpl', layout: '1-col', pageId: 'pTpl', locked: true },
        ],
        [
          {
            id: 'search1', type: 'search', zoneId: 'sTpl-0', datasetId: '7', locked: true,
            fieldMapping: {
              targetPageId: 'pTpl',
              searchSources: [{ datasetId: '7', columns: ['nom_commune', 'code_commune'] }],
              resultTitleColumn: 'nom_commune',
              urlParams: ['code_commune'],
            },
            config: {},
          },
        ],
        [
          { id: 'pMain', title: 'National' },
          { id: 'pTpl', title: 'Commune', isTemplate: true, paramName: 'code_commune' },
        ],
      )

      const tpl = store.pages.find((p) => p.id === 'pTpl')!
      expect(tpl.isTemplate).toBeFalsy()
      expect(tpl.paramName).toBeFalsy()
      // Le bloc recherche a auto-déclaré un paramètre point-barre (invisible) :
      // segment d'URL = colonnes recherchées slugifiées.
      expect(tpl.params).toHaveLength(1)
      expect(tpl.params?.[0]).toMatchObject({
        columns: ['nom_commune', 'code_commune'], datasetId: '7', fanOut: true, hidden: true, searchBlockId: 'search1',
      })

      // Le bloc a rejoint le modèle graphe.
      const search = store.blocks.find((b) => b.id === 'search1')!
      expect(search.sources).toEqual([{ id: '7', datasetId: '7' }])
      expect(search.fieldMapping.searchColumns).toEqual(['nom_commune', 'code_commune'])
      expect(search.fieldMapping.searchSources).toBeUndefined()

      expect(store.sections.find((s) => s.id === 'sTpl')!.locked).toBeFalsy()
      expect(search.locked).toBeFalsy()
    })

    it('is a no-op for a document with only normal pages', () => {
      const store = useStudioStore()
      store.initPage(
        { id: 'c1', type: 'statsdata', title: 'Doc' },
        [{ id: 's1', layout: '1-col', pageId: 'p1' }],
        [],
        [{ id: 'p1', title: 'Principale' }],
      )
      expect(store.pages[0]!.params).toBeUndefined()
    })
  })

  describe('search block — auto-managed page param', () => {
    function seedSearchBlock() {
      const store = useStudioStore()
      const zone = `${store.sections[0]!.id}-0`
      const block = store.addBlock('search', zone)
      store.updateBlockDataset(block.id, '7')
      return { store, id: block.id, pageId: store.currentPageId }
    }

    it('declares exactly one hidden fan-out param once search columns are set', () => {
      const { store, id, pageId } = seedSearchBlock()
      expect(store.pages.find((p) => p.id === pageId)!.params ?? []).toHaveLength(0)

      store.updateBlockFieldMapping(id, { searchColumns: ['prenom', 'nom'] })
      const params = store.pages.find((p) => p.id === pageId)!.params!
      expect(params).toHaveLength(1)
      expect(params[0]).toMatchObject({
        columns: ['prenom', 'nom'], datasetId: '7', fanOut: true, hidden: true, searchBlockId: id,
      })
    })

    it('removes the param when the search columns are cleared', () => {
      const { store, id, pageId } = seedSearchBlock()
      store.updateBlockFieldMapping(id, { searchColumns: ['prenom'] })
      store.updateBlockFieldMapping(id, { searchColumns: undefined })
      expect(store.pages.find((p) => p.id === pageId)!.params ?? []).toHaveLength(0)
    })

    it('drops the param when the search block is removed', () => {
      const { store, id, pageId } = seedSearchBlock()
      store.updateBlockFieldMapping(id, { searchColumns: ['prenom'] })
      store.removeBlock(id)
      expect(store.pages.find((p) => p.id === pageId)!.params ?? []).toHaveLength(0)
    })

    it('does not surface the hidden param in currentPageParamDefs seeding but keeps it declared', () => {
      const { store, id } = seedSearchBlock()
      store.updateBlockFieldMapping(id, { searchColumns: ['prenom'] })
      // hidden param has no defaultValue → does not seed pageParams
      expect(store.pageParams).toEqual({})
    })

    it('searchAltColumns do not affect the auto-managed PageParam', () => {
      const { store, id, pageId } = seedSearchBlock()
      store.updateBlockFieldMapping(id, { searchColumns: ['prenom', 'nom'] })
      store.updateBlockFieldMapping(id, { searchAltColumns: ['email'] })
      const params = store.pages.find((p) => p.id === pageId)!.params!
      expect(params).toHaveLength(1)
      expect(params[0]!.columns).toEqual(['prenom', 'nom'])
    })
  })

  describe('multi-sources', () => {
    function seedBarBlock() {
      const store = useStudioStore()
      const zone = `${store.sections[0]!.id}-0`
      const block = store.addBlock('bar', zone)
      store.updateBlockDataset(block.id, '1')
      return { store, id: block.id }
    }

    it('updateBlockDataset sets a single normalized source', () => {
      const { store, id } = seedBarBlock()
      const b = store.blocks.find((x) => x.id === id)!
      expect(b.sources).toEqual([{ id: '1', datasetId: '1' }])
      expect(b.primarySourceId).toBe('1')
    })

    it('addBlockSource appends a source with a unique id and removeBlockSource prunes joins + refs', () => {
      const { store, id } = seedBarBlock()
      const sid = store.addBlockSource(id, '2')!
      store.updateBlockJoins(id, [
        { leftSourceId: '1', leftColumn: 'a', rightSourceId: sid, rightColumn: 'b', type: 'left' },
      ])
      store.updateBlockFieldMapping(id, { xAxis: `nom@${sid}`, yAxes: ['montant'] })

      store.removeBlockSource(id, sid)
      const b = store.blocks.find((x) => x.id === id)!
      expect(b.sources).toEqual([{ id: '1', datasetId: '1' }])
      expect(b.joins).toEqual([])
      expect(b.fieldMapping.xAxis).toBeUndefined()
      expect(b.fieldMapping.yAxes).toEqual(['montant'])
    })

    it('addBlockSource disambiguates a duplicate datasetId', () => {
      const { store, id } = seedBarBlock()
      const sid = store.addBlockSource(id, '1')!
      expect(sid).toBe('1~2')
    })

    it('setPrimarySource moves the primary and updates datasetId', () => {
      const { store, id } = seedBarBlock()
      const sid = store.addBlockSource(id, '2')!
      store.setPrimarySource(id, sid)
      const b = store.blocks.find((x) => x.id === id)!
      expect(b.primarySourceId).toBe(sid)
      expect(b.datasetId).toBe('2')
    })

    it('getPayload rewrites datasetId to the primary source dataset', () => {
      const { store, id } = seedBarBlock()
      const sid = store.addBlockSource(id, '2')!
      store.setPrimarySource(id, sid)
      const payload = store.getPayload()
      const b = payload.blocks.find((x) => x.id === id)!
      expect(b.datasetId).toBe('2')
    })
  })
})
