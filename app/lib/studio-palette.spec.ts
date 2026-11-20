import { describe, expect, it } from 'vitest'
import { filterPalette, paletteFor } from './studio-palette'

const types = (cats: ReturnType<typeof paletteFor>) => cats.flatMap((c) => c.blocks.map((b) => b.type))

describe('studio palette', () => {
  it('gives each content type its own blocks', () => {
    expect(types(paletteFor('article'))).toContain('sd-embed')
    expect(types(paletteFor('article'))).not.toContain('bar')
    expect(types(paletteFor('survey'))).toEqual(expect.arrayContaining(['choice', 'number', 'text-answer']))
    expect(types(paletteFor('statsdata'))).toEqual(expect.arrayContaining(['bar', 'search', 'loop', 'layout']))
  })

  it('flags data blocks', () => {
    const all = paletteFor('statsdata').flatMap((c) => c.blocks)
    expect(all.find((b) => b.type === 'bar')?.data).toBe(true)
    expect(all.find((b) => b.type === 'heading')?.data).toBe(false)
  })

  it('filters on label and description, dropping empty categories', () => {
    const r = filterPalette(paletteFor('statsdata'), 'évolution')
    expect(types(r)).toEqual(['line'])
    expect(r).toHaveLength(1)
  })
})
