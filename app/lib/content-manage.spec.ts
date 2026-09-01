import { describe, it, expect } from 'vitest'
import { contentManageMeta, type ManageOwnerContext } from '@/lib/content-manage'
import type { StatsDataDocument } from '@/api/studio'

const ctx: ManageOwnerContext = {
  resolveOwner: () => ({ kind: 'perso', label: 'Moi · Perso' }),
}

describe('contentManageMeta', () => {
  it('marks a draft: no public path, "Brouillon" status', () => {
    const doc: StatsDataDocument = { id: 'd', title: 'T', type: 'article', slug: 'draft', status: 'draft' }
    const meta = contentManageMeta(doc, ctx)
    expect(meta.statusLabel).toBe('Brouillon')
    expect(meta.live).toBe(false)
    expect(meta.publicPath).toBeNull()
    expect(meta.studioPath).toBe('/studio/article/draft')
  })

  it('exposes the public path for a published public content', () => {
    const doc: StatsDataDocument = {
      id: 'd',
      title: 'T',
      type: 'statsdata',
      slug: 'live',
      status: 'published',
      visibility: 'public',
    }
    const meta = contentManageMeta(doc, ctx)
    expect(meta.statusLabel).toBe('Publié')
    expect(meta.publicPath).toBe('/statsdata/live')
  })

  it('keeps a private published content live but flags it', () => {
    const doc: StatsDataDocument = {
      id: 'd',
      title: 'T',
      type: 'survey',
      slug: 'priv',
      status: 'published',
      visibility: 'private',
    }
    const meta = contentManageMeta(doc, ctx)
    expect(meta.statusLabel).toBe('Privé')
    expect(meta.live).toBe(true)
    expect(meta.publicPath).toBe('/sondages/priv')
  })

  it('carries the resolved owner label', () => {
    const meta = contentManageMeta({ id: 'd', title: 'T' }, ctx)
    expect(meta.ownerLabel).toBe('Moi · Perso')
    expect(meta.ownerKind).toBe('perso')
  })
})
