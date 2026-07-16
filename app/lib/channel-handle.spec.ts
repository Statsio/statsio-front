import { describe, expect, it } from 'vitest'
import { slugifyHandle } from './channel-handle'

describe('slugifyHandle', () => {
  it('lowercases and replaces spaces with underscores', () => {
    expect(slugifyHandle('Ma Chaine')).toBe('ma_chaine')
  })

  it('strips accents', () => {
    expect(slugifyHandle('Écologie & Énergie')).toBe('ecologie_energie')
  })

  it('collapses runs of non-alphanumeric characters into a single underscore', () => {
    expect(slugifyHandle('Foo!!!Bar---Baz')).toBe('foo_bar_baz')
  })

  it('trims leading and trailing underscores', () => {
    expect(slugifyHandle('!!!Hello!!!')).toBe('hello')
  })

  it('pads names shorter than 3 characters with a fallback suffix', () => {
    expect(slugifyHandle('TV')).toBe('tv_chaine')
    expect(slugifyHandle('')).toBe('_chaine')
  })

  it('truncates to 50 characters', () => {
    const longName = 'a'.repeat(80)
    expect(slugifyHandle(longName).length).toBe(50)
  })
})
