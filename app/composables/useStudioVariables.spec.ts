import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioVariables } from './useStudioVariables'
import { useStudioStore } from '@/stores/studio'

describe('useStudioVariables — loop variables', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('surfaces the enclosing loop variable for a block inside a loop', () => {
    const studio = useStudioStore()
    const section = studio.sections[0]!
    const loop = studio.addBlock('loop', `${section.id}-0`)
    studio.updateBlockFieldMapping(loop.id, { loopColumn: 'carburant', loopVar: 'carbu' })
    const child = studio.addBlock('kpi', `loop:${loop.id}:0`)

    const { groups } = useStudioVariables(undefined, () => child.id)
    const loopGroup = groups.value.find((g) => g.key === `loop:${loop.id}`)

    expect(loopGroup).toBeTruthy()
    expect(loopGroup!.items[0]!.name).toBe('carbu')
  })

  it('offers no loop group for a block outside any loop', () => {
    const studio = useStudioStore()
    const section = studio.sections[0]!
    const block = studio.addBlock('kpi', `${section.id}-0`)

    const { groups } = useStudioVariables(undefined, () => block.id)
    expect(groups.value.some((g) => g.key.startsWith('loop:'))).toBe(false)
  })

  it('hides the auto-managed search param but exposes visible params', () => {
    const studio = useStudioStore()
    const section = studio.sections[0]!
    const search = studio.addBlock('search', `${section.id}-0`)
    studio.updateBlockDataset(search.id, '7')
    studio.updateBlockFieldMapping(search.id, { searchColumns: ['prenom'] })
    studio.addPageParam(studio.currentPageId, { name: 'annee', column: 'annee' })

    const { groups } = useStudioVariables(() => studio.currentPageId)
    const paramGroup = groups.value.find((g) => g.key === 'param')
    expect(paramGroup?.items.map((i) => i.name)).toEqual(['annee'])
  })
})
