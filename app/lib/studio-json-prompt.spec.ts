import { describe, expect, it } from 'vitest'
import { buildStudioJsonPrompt, extractImportProperties } from '@/lib/studio-json-prompt'

const baseArgs = {
  content: { title: 'Prix des carburants', type: 'statsdata' as const },
  supportsPages: true,
  datasets: [
    {
      meta: { id: 'ds-1', name: 'Prix', rowCount: 10, status: 'ready' as const },
      columns: [{ name: 'prix', type: 'float' as const, nullable: false, sampleValues: ['1.8'] }],
    },
  ],
  currentPayload: { properties: { title: 'Prix des carburants' }, pages: [], sections: [], blocks: [] },
  media: [
    { id: 12, url: 'https://cdn/x.jpg', type: 'image/jpeg' },
    { id: 13, url: 'https://cdn/doc.pdf', type: 'application/pdf' },
  ],
  categories: [{ id: 1, slug: 'economie', name: 'Économie', sub_brand: 'all' as const }],
}

describe('buildStudioJsonPrompt', () => {
  it('décrit les propriétés, les pages multiples, les titres de blocs et les sources', () => {
    const prompt = buildStudioJsonPrompt(baseArgs)
    expect(prompt).toContain('"properties" (À PLACER EN PREMIER)')
    expect(prompt).toContain('CHAPÔ')
    expect(prompt).toContain('"thumbnailMediaId"')
    expect(prompt).toContain('id 12 : https://cdn/x.jpg')
    expect(prompt).not.toContain('doc.pdf')
    expect(prompt).toContain('"economie" — Économie')
    expect(prompt).toContain('"cardBlockId"')
    expect(prompt).toContain('FAIS PLUSIEURS PAGES')
    expect(prompt).toContain('TITRES DES BLOCS')
    expect(prompt).toContain('datasetId: ds-1')
    expect(prompt).toContain('"search" (Recherche)')
  })

  it('reste sur une page unique et expose les blocs de formulaire pour un sondage', () => {
    const prompt = buildStudioJsonPrompt({ ...baseArgs, content: { type: 'survey' }, supportsPages: false })
    expect(prompt).toContain("n'a qu'UNE seule page")
    expect(prompt).not.toContain('FAIS PLUSIEURS PAGES')
    expect(prompt).toContain('"text-answer" (Réponse libre)')
    expect(prompt).toContain('"number" (Nombre)')
    expect(prompt).not.toContain('"search" (Recherche)')
    expect(prompt).not.toContain('"cardBlockId"')
  })
})

describe('extractImportProperties', () => {
  it('extrait et valide les propriétés', () => {
    expect(
      extractImportProperties({
        properties: {
          title: '  Nouveau titre ',
          description: 'Un chapô.',
          thumbnailMediaId: '12',
          coverage: 'nationale',
          subBrand: 'tvstats',
          categories: ['economie', 3, ''],
          cardBlockId: 'blk-1',
        },
      }),
    ).toEqual({
      title: 'Nouveau titre',
      description: 'Un chapô.',
      thumbnailMediaId: 12,
      coverage: 'nationale',
      subBrand: 'tvstats',
      categories: ['economie'],
      cardBlockId: 'blk-1',
    })
  })

  it('ignore les valeurs invalides et retombe sur le title racine', () => {
    expect(
      extractImportProperties({
        title: 'Titre racine',
        properties: { coverage: 'galactique', subBrand: 'autre', thumbnailMediaId: 'https://img' },
      }),
    ).toEqual({ title: 'Titre racine' })
    expect(extractImportProperties(null)).toEqual({})
    expect(extractImportProperties({ properties: { description: null, cardBlockId: null } })).toEqual({
      description: null,
      cardBlockId: null,
    })
  })
})
