import { describe, it, expect } from 'vitest'
import type { StudioDocumentPage } from '@/types/studio'
import { findFanOutTarget, fanOutSlugKey, resolveSegment } from './statsdata-fanout'

const main: StudioDocumentPage = { id: 'main', title: 'National', slug: 'national' }
const commune: StudioDocumentPage = {
  id: 'com', title: 'Commune', slug: 'commune',
  params: [{ name: 'code_commune', column: 'code_commune', slugColumn: 'nom_commune', datasetId: '7', fanOut: true }],
}
const pages = [main, commune]

describe('findFanOutTarget', () => {
  it('returns the first page carrying a fanOut param', () => {
    expect(findFanOutTarget(pages)?.page.id).toBe('com')
    expect(findFanOutTarget([main])).toBeNull()
  })
})

describe('fanOutSlugKey', () => {
  it('prefers slugColumn, then column, then name', () => {
    expect(fanOutSlugKey(commune.params![0]!)).toBe('nom_commune')
    expect(fanOutSlugKey({ name: 'carburant', column: 'carburant', fanOut: true })).toBe('carburant')
    expect(fanOutSlugKey({ name: 'annee', fanOut: true })).toBe('annee')
  })
})

describe('resolveSegment', () => {
  it('matches a page by slug or id', () => {
    expect(resolveSegment('national', pages).page?.id).toBe('main')
    expect(resolveSegment('com', pages).page?.id).toBe('com')
    expect(resolveSegment('national', pages).fanOut).toBeNull()
  })

  it('treats an unknown segment as a fan-out value for the fan-out page', () => {
    const r = resolveSegment('lyon', pages)
    expect(r.page?.id).toBe('com')
    expect(r.fanOut).toEqual({ param: commune.params![0], segment: 'lyon' })
  })

  it('falls back to the first page when there is no segment and no fan-out', () => {
    expect(resolveSegment(undefined, [main]).page?.id).toBe('main')
    expect(resolveSegment('unknown', [main]).page?.id).toBe('main')
    expect(resolveSegment('unknown', [main]).fanOut).toBeNull()
  })

  it('returns null page for an empty document', () => {
    expect(resolveSegment('x', [])).toEqual({ page: null, fanOut: null })
  })
})
