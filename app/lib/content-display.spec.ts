import { describe, expect, it } from 'vitest'
import { CONTENT_TYPE_META, getStatusMeta, publicContentListPath, publicContentPath } from './content-display'

describe('CONTENT_TYPE_META', () => {
  it('provides a label, color and bg for every content type', () => {
    for (const type of ['statsdata', 'article', 'survey'] as const) {
      expect(CONTENT_TYPE_META[type]).toMatchObject({
        label: expect.any(String),
        color: expect.stringMatching(/^#/),
        bg: expect.stringMatching(/^#/),
      })
    }
  })
})

describe('getStatusMeta', () => {
  it('reports a draft for anything that is not published', () => {
    expect(getStatusMeta(undefined, undefined)).toMatchObject({ label: 'Brouillon', live: false })
    expect(getStatusMeta('draft', 'public')).toMatchObject({ label: 'Brouillon', live: false })
  })

  it('reports private visibility for a published private item', () => {
    expect(getStatusMeta('published', 'private')).toMatchObject({ label: 'Privé', live: true })
  })

  it('reports protected visibility for a published protege item', () => {
    expect(getStatusMeta('published', 'protege')).toMatchObject({ label: 'Protégé', live: true })
  })

  it('reports published for any other visibility', () => {
    expect(getStatusMeta('published', 'public')).toMatchObject({ label: 'Publié', live: true })
    expect(getStatusMeta('published', undefined)).toMatchObject({ label: 'Publié', live: true })
  })
})

describe('publicContentPath', () => {
  it('builds the survey path', () => {
    expect(publicContentPath('survey', 'mon-sondage')).toBe('/sondages/mon-sondage')
  })

  it('builds the article path', () => {
    expect(publicContentPath('article', 'mon-article')).toBe('/articles/mon-article')
  })

  it('defaults to the statsdata path for any other type', () => {
    expect(publicContentPath('statsdata', 'mon-jeu-de-donnees')).toBe('/statsdata/mon-jeu-de-donnees')
  })

  it('prefixes the path with a base path when provided', () => {
    expect(publicContentPath('article', 'mon-article', '/medistats')).toBe('/medistats/articles/mon-article')
  })
})

describe('publicContentListPath', () => {
  it('builds the list path per content type', () => {
    expect(publicContentListPath('survey')).toBe('/sondages')
    expect(publicContentListPath('article')).toBe('/articles')
    expect(publicContentListPath('statsdata')).toBe('/statsdata')
  })

  it('prefixes the path with a base path when provided', () => {
    expect(publicContentListPath('article', '/tvstats')).toBe('/tvstats/articles')
  })
})
