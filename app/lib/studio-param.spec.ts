import { describe, it, expect } from 'vitest'
import type { StudioBlock } from '@/types/studio'
import { desiredParamBlockPageParam, sameParamBlockPageParam } from './studio-param'

function paramBlock(overrides: Partial<StudioBlock> = {}): StudioBlock {
  return { id: 'blk123', type: 'param', zoneId: 'z', datasetId: '7', fieldMapping: {}, config: {}, ...overrides }
}

describe('desiredParamBlockPageParam', () => {
  it('returns null until a pilot column is set', () => {
    expect(desiredParamBlockPageParam(paramBlock())).toBeNull()
  })

  it('declares a visible fan-out param derived from the pilot column', () => {
    const p = desiredParamBlockPageParam(
      paramBlock({ fieldMapping: { paramColumn: 'carburant' }, config: { paramDefault: 'gazole', title: 'Carburant' } }),
    )
    expect(p).toMatchObject({
      name: 'carburant',
      column: 'carburant',
      datasetId: '7',
      defaultValue: 'gazole',
      label: 'Carburant',
      paramBlockId: 'blk123',
      fanOut: true,
      slugColumn: 'carburant',
    })
    expect((p as { hidden?: boolean }).hidden).toBeUndefined()
  })

  it('uses paramName over the column for the token name', () => {
    const p = desiredParamBlockPageParam(paramBlock({ fieldMapping: { paramColumn: 'carburant', paramName: 'energie' } }))
    expect(p?.name).toBe('energie')
    expect(p?.column).toBe('carburant')
  })

  it('drops fan-out when the page already has a search-driven fan-out axis', () => {
    const p = desiredParamBlockPageParam(
      paramBlock({ fieldMapping: { paramColumn: 'carburant' } }),
      { pageHasForeignFanOut: true },
    )
    expect(p?.fanOut).toBeUndefined()
    expect(p?.slugColumn).toBeUndefined()
  })
})

describe('sameParamBlockPageParam', () => {
  it('is true for structurally equivalent declarations', () => {
    const block = paramBlock({ fieldMapping: { paramColumn: 'carburant' } })
    const a = desiredParamBlockPageParam(block)!
    const b = desiredParamBlockPageParam(block)!
    expect(sameParamBlockPageParam(a, b)).toBe(true)
  })

  it('detects a changed fan-out flag', () => {
    const block = paramBlock({ fieldMapping: { paramColumn: 'carburant' } })
    const a = desiredParamBlockPageParam(block)!
    const b = desiredParamBlockPageParam(block, { pageHasForeignFanOut: true })!
    expect(sameParamBlockPageParam(a, b)).toBe(false)
  })
})
