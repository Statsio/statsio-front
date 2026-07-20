import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/channels-validation', () => ({
  checkHandleAvailability: vi.fn<(handle: string) => Promise<boolean>>(),
}))

import { checkHandleAvailability } from '@/api/channels-validation'
import { deriveAvailableHandle, slugifyHandle } from './channel-handle'

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

describe('deriveAvailableHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the base slug when it is available', async () => {
    vi.mocked(checkHandleAvailability).mockResolvedValue(true)

    await expect(deriveAvailableHandle('Ma Chaine')).resolves.toBe('ma_chaine')
    expect(checkHandleAvailability).toHaveBeenCalledTimes(1)
  })

  it('appends a numeric suffix when the base slug is taken', async () => {
    vi.mocked(checkHandleAvailability).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const handle = await deriveAvailableHandle('Ma Chaine')

    expect(handle).toMatch(/^ma_chaine_\d{4}$/)
    expect(checkHandleAvailability).toHaveBeenCalledTimes(2)
  })

  it('keeps retrying with new suffixes until one is available', async () => {
    vi.mocked(checkHandleAvailability)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    const handle = await deriveAvailableHandle('Ma Chaine')

    expect(handle).toMatch(/^ma_chaine_\d{4}$/)
    expect(checkHandleAvailability).toHaveBeenCalledTimes(4)
  })

  it('throws once every attempt is exhausted', async () => {
    vi.mocked(checkHandleAvailability).mockResolvedValue(false)

    await expect(deriveAvailableHandle('Ma Chaine')).rejects.toThrow(
      "Impossible de générer un identifiant disponible pour cette chaîne.",
    )
    expect(checkHandleAvailability).toHaveBeenCalledTimes(7)
  })
})
