import { describe, expect, it } from 'vitest'
import {
  CONTENT_TYPE_META,
  canonicalContentPath,
  getStatusMeta,
  publicChannelListPath,
  publicChannelPath,
  publicContentListPath,
  publicContentPath,
  publicDossierListPath,
  publicDossierPath,
} from './content-display'

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
    expect(getStatusMeta(undefined)).toMatchObject({ label: 'Brouillon', live: false })
    expect(getStatusMeta('draft')).toMatchObject({ label: 'Brouillon', live: false })
  })

  it('reports scheduled when a future publish is queued', () => {
    expect(getStatusMeta('scheduled')).toMatchObject({ label: 'Programmé', live: false })
  })

  it('reports published once the content is published', () => {
    expect(getStatusMeta('published')).toMatchObject({ label: 'Publié', live: true })
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

describe('publicDossierPath', () => {
  it('builds the dossier detail path', () => {
    expect(publicDossierPath('guerre-en-ukraine')).toBe('/dossiers/guerre-en-ukraine')
  })

  it('prefixes the path with a base path when provided', () => {
    expect(publicDossierPath('guerre-en-ukraine', '/tvstats')).toBe('/tvstats/dossiers/guerre-en-ukraine')
  })
})

describe('publicDossierListPath', () => {
  it('builds the dossier list path', () => {
    expect(publicDossierListPath()).toBe('/dossiers')
    expect(publicDossierListPath('/medistats')).toBe('/medistats/dossiers')
  })
})

describe('publicChannelPath', () => {
  it('builds the channel detail path', () => {
    expect(publicChannelPath('@statsio')).toBe('/channels/%40statsio')
  })

  it('prefixes the path with a base path when provided', () => {
    expect(publicChannelPath('tf1', '/tvstats')).toBe('/tvstats/channels/tf1')
  })
})

describe('publicChannelListPath', () => {
  it('builds the channel list path', () => {
    expect(publicChannelListPath()).toBe('/chaines')
    expect(publicChannelListPath('/medistats')).toBe('/medistats/chaines')
  })
})

describe('canonicalContentPath', () => {
  it('strips a leading sub-brand prefix', () => {
    expect(canonicalContentPath('/tvstats/statsdata/incendies/lyon')).toBe('/statsdata/incendies/lyon')
    expect(canonicalContentPath('/medistats/articles/mon-article')).toBe('/articles/mon-article')
  })

  it('leaves a root path untouched', () => {
    expect(canonicalContentPath('/statsdata/incendies/lyon')).toBe('/statsdata/incendies/lyon')
  })

  it('does not strip a prefix that is only a name fragment', () => {
    expect(canonicalContentPath('/tvstats-recap/x')).toBe('/tvstats-recap/x')
  })

  it('maps a bare sub-brand landing path to root', () => {
    expect(canonicalContentPath('/medistats')).toBe('/')
  })
})
