import { describe, expect, it } from 'vitest'
import { studioChecks } from './studio-checks'
import type { StudioBlock } from '@/types/studio'

const blk = (type: StudioBlock['type'], config: StudioBlock['config'] = {}, extra: Partial<StudioBlock> = {}): StudioBlock => ({
  id: `${type}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  zoneId: 's1-0',
  fieldMapping: {},
  config,
  ...extra,
})

const base = { title: 'Un titre assez long', description: 'Un chapô de plus de vingt caractères.', hasCover: true }

describe('studioChecks', () => {
  it('flags missing title, chapô and cover', () => {
    const r = studioChecks({ type: 'article', title: 'Court', description: '', hasCover: false, blocks: [] })
    expect(r.filter((c) => !c.ok).map((c) => c.id)).toEqual(expect.arrayContaining(['title', 'chapo', 'cover']))
  })

  it('points to the image without alt text', () => {
    const img = blk('image', { imageUrl: '/a.jpg' })
    const r = studioChecks({ ...base, type: 'article', blocks: [img] })
    const alt = r.find((c) => c.id === 'alt')!
    expect(alt.ok).toBe(false)
    expect(alt.blockId).toBe(img.id)
  })

  it('article: an unlinked StatsData block is reported', () => {
    const embed = blk('sd-embed', { sourceSlug: 'x' })
    const r = studioChecks({ ...base, type: 'article', blocks: [embed] })
    expect(r.find((c) => c.id === 'embeds')).toMatchObject({ ok: false, blockId: embed.id })
  })

  it('survey: second question of a quick poll is off format, options < 2 reported', () => {
    const q1 = blk('choice', { formOptions: ['A', 'B'] })
    const q2 = blk('dropdown', { formOptions: ['Seule'] })
    const r = studioChecks({ ...base, type: 'survey', surveyKind: 'single_question', blocks: [q1, q2] })
    expect(r.find((c) => c.id === 'format')).toMatchObject({ ok: false, blockId: q2.id })
    expect(r.find((c) => c.id === 'options')).toMatchObject({ ok: false, blockId: q2.id })
    expect(r.find((c) => c.id === 'cover')).toBeUndefined()
  })

  it('statsdata: a data block without source is reported', () => {
    const bar = blk('bar')
    const ok = blk('kpi', {}, { datasetId: 'ds1' })
    const r = studioChecks({ ...base, type: 'statsdata', blocks: [ok, bar] })
    expect(r.find((c) => c.id === 'sources')).toMatchObject({ ok: false, blockId: bar.id })
  })
})
