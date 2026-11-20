import { describe, expect, it } from 'vitest'
import { easeInOut, percentOf, sectorPath, segmentsToAngles, sliceOffset } from './pie'

describe('sectorPath', () => {
  it('returns an empty path for an empty slice', () => {
    expect(sectorPath(60, 60, 56, 10, 10)).toBe('')
  })

  it('draws a quarter slice from noon to 3 o’clock with the small-arc flag', () => {
    expect(sectorPath(60, 60, 50, -90, 0)).toBe('M60 60 L60 10 A50 50 0 0 1 110 60 Z')
  })

  it('uses the large-arc flag beyond 180°', () => {
    expect(sectorPath(0, 0, 10, 0, 270)).toContain(' 0 1 1 ')
  })

  it('draws a full disc as two arcs', () => {
    const d = sectorPath(60, 60, 10, -90, 270)
    expect(d.match(/A/g)).toHaveLength(2)
  })
})

describe('segmentsToAngles', () => {
  it('splits 360° proportionally from noon', () => {
    expect(segmentsToAngles([1, 1, 2])).toEqual([
      { a0: -90, a1: 0 },
      { a0: 0, a1: 90 },
      { a0: 90, a1: 270 },
    ])
  })

  it('honours an explicit total (part of a whole)', () => {
    expect(segmentsToAngles([25], -90, 100)).toEqual([{ a0: -90, a1: 0 }])
  })

  it('treats negative / non-finite values as 0 and survives a zero total', () => {
    expect(segmentsToAngles([-3, Number.NaN])).toEqual([
      { a0: -90, a1: -90 },
      { a0: -90, a1: -90 },
    ])
  })
})

describe('sliceOffset', () => {
  it('moves a slice along its bisector', () => {
    expect(sliceOffset({ a0: -90, a1: 90 }, 10)).toEqual({ x: 10, y: 0 })
  })
})

describe('helpers', () => {
  it('eases from 0 to 1', () => {
    expect(easeInOut(0)).toBeCloseTo(0)
    expect(easeInOut(1)).toBeCloseTo(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })

  it('computes a bounded rounded percentage', () => {
    expect(percentOf(1, 3)).toBe(33)
    expect(percentOf(5, 0)).toBe(0)
    expect(percentOf(12, 10)).toBe(100)
  })
})
