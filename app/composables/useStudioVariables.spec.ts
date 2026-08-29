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
})
