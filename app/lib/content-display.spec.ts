import { describe, expect, it } from 'vitest'
import { getStatusMeta, publicContentPath } from './content-display'

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
})
