import { describe, it, expect } from 'vitest'
import { scriptDescendantsOf, sectionDescendantsOf } from './studio-tree'
import type { Section, StudioBlock } from '@/types/studio'

function block(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return { id: 'b1', type: 'paragraph', zoneId: 'z', fieldMapping: {}, config: {}, ...overrides }
}

function section(overrides: Partial<Section> = {}): Section {
  return { id: 's1', layout: '1-col', pageId: 'default', ...overrides }
}

describe('scriptDescendantsOf', () => {
  it('collects nested loop children across zones', () => {
    const loop = block({ id: 'loop1', type: 'loop', zoneId: 'page:default' })
    const child = block({ id: 'child1', type: 'paragraph', zoneId: 'loop:loop1:0' })
    const nestedLoop = block({ id: 'loop2', type: 'loop', zoneId: 'loop:loop1:0' })
    const grandchild = block({ id: 'grandchild1', type: 'paragraph', zoneId: 'loop:loop2:0' })
    const blocks = [loop, child, nestedLoop, grandchild]

    const result = scriptDescendantsOf('loop1', blocks, [])
    expect(result.blocks).toEqual(new Set(['child1', 'loop2', 'grandchild1']))
    expect(result.sections).toEqual(new Set())
  })

  it('collects sections nested in an if block branch, recursively', () => {
    const ifBlock = block({ id: 'if1', type: 'if', zoneId: 'page:default' })
    const branchSection = section({ id: 'sec1', zoneId: 'loop:if1:0' })
    const nestedBlock = block({ id: 'nb1', zoneId: 'sec1-0' })
    const nestedLoop = block({ id: 'nl1', type: 'loop', zoneId: 'sec1-0' })
    const grandchildBlock = block({ id: 'gcb1', zoneId: 'loop:nl1:0' })
    const blocks = [ifBlock, nestedBlock, nestedLoop, grandchildBlock]
    const sections = [branchSection]

    const result = scriptDescendantsOf('if1', blocks, sections)
    expect(result.sections).toEqual(new Set(['sec1']))
    expect(result.blocks).toEqual(new Set(['nb1', 'nl1', 'gcb1']))
  })

  it('handles a diamond-ish structure without infinite looping or duplicates', () => {
    const loop = block({ id: 'loop1', type: 'loop', zoneId: 'page:default' })
    const a = block({ id: 'a', zoneId: 'loop:loop1:0' })
    const b = block({ id: 'b', zoneId: 'loop:loop1:0' })
    const blocks = [loop, a, b]

    const result = scriptDescendantsOf('loop1', blocks, [])
    expect(result.blocks).toEqual(new Set(['a', 'b']))
  })
})

describe('sectionDescendantsOf', () => {
  it('collects blocks in a section column and their nested if-branch children', () => {
    const ifBlock = block({ id: 'if1', type: 'if', zoneId: 'sec1-0' })
    const branchNested = block({ id: 'bn1', zoneId: 'loop:if1:0' })
    const blocks = [ifBlock, branchNested]

    const result = sectionDescendantsOf('sec1', blocks, [])
    expect(result.blocks).toEqual(new Set(['if1', 'bn1']))
  })

  it('recurses into sections nested inside a container block of the section', () => {
    const loop = block({ id: 'loop1', type: 'loop', zoneId: 'sec1-0' })
    const nestedSection = section({ id: 'sec2', zoneId: 'loop:loop1:0' })
    const nestedBlock = block({ id: 'nb1', zoneId: 'sec2-0' })
    const blocks = [loop, nestedBlock]
    const sections = [nestedSection]

    const result = sectionDescendantsOf('sec1', blocks, sections)
    expect(result.blocks).toEqual(new Set(['loop1', 'nb1']))
    expect(result.sections).toEqual(new Set(['sec2']))
  })
})
