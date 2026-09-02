import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

const scalar = vi.fn<(...args: unknown[]) => unknown>()
const publicScalar = vi.fn<(...args: unknown[]) => unknown>()
vi.mock('@/api/studio', () => ({
  fetchScalarAggregate: (...a: unknown[]) => scalar(...a),
  fetchPublicScalarAggregate: (...a: unknown[]) => publicScalar(...a),
}))

import { useResolvedTokens, useResolvedTokenList, useExpressionNumber, clearAggregateCache } from './useResolvedTokens'
import type { StudioBlock } from '@/types/studio'

async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('useResolvedTokens', () => {
  beforeEach(() => {
    scalar.mockReset()
    publicScalar.mockReset()
    clearAggregateCache()
  })

  it('substitutes plain variables synchronously', () => {
    const { text } = useResolvedTokens({
      raw: () => 'Carburant : {{carburant}}',
      tokenMap: () => ({ carburant: 'Gazole' }),
    })
    expect(text.value).toBe('Carburant : Gazole')
  })

  it('resolves an expression via the scalar aggregate API and formats it', async () => {
    scalar.mockResolvedValue(0.42)
    const { text, pending } = useResolvedTokens({
      raw: () => "l'écart atteint {{ (MAX(prix@7) - MIN(prix@7)) * 100 : 0 }} centimes",
      tokenMap: () => ({}),
    })
    // valeur brute d'abord (jeton laissé), puis résolu
    expect(pending.value).toBe(true)
    await settle()
    expect(scalar).toHaveBeenCalledTimes(2) // MAX + MIN, dédupliqués par clé
    expect(text.value).toBe("l'écart atteint 0 centimes")
    expect(pending.value).toBe(false)
  })

  it('uses the context datasetId when the expression omits @N, and the public endpoint when readonly', async () => {
    publicScalar.mockResolvedValue(10)
    const { text } = useResolvedTokens({
      raw: () => '{{ SUM(x) }}',
      tokenMap: () => ({}),
      datasetId: () => '99',
      readonly: () => true,
      docSlug: () => 'doc-1',
    })
    await settle()
    expect(publicScalar).toHaveBeenCalledWith('doc-1', '99', expect.objectContaining({ fn: 'sum', column: 'x' }))
    expect(scalar).not.toHaveBeenCalled()
    expect(text.value).toBe('10')
  })

  it('resolves against the source Statsdata (slug + params) when STUDIO_EMBED_CONTEXT is provided', async () => {
    const { defineComponent, h, provide } = await import('vue')
    const { mount } = await import('@vue/test-utils')
    const { STUDIO_EMBED_CONTEXT } = await import('./studioEmbedContext')
    publicScalar.mockResolvedValue(7)

    let out: { text: { value: string } } | undefined
    const Child = defineComponent({
      setup() {
        out = useResolvedTokens({
          raw: () => 'Repère : {{ AVG(prix@13 | carburant=$carburant) }} pour {{carburant}}',
          tokenMap: () => ({}),
        })
        return () => h('div')
      },
    })
    const Parent = defineComponent({
      setup() {
        provide(STUDIO_EMBED_CONTEXT, { docSlug: 'carburants', pages: [], params: { carburant: 'Gazole' } })
        return () => h(Child)
      },
    })
    mount(Parent)
    await settle()

    // slug de la source (pas de l'article) + endpoint public forcé
    expect(publicScalar).toHaveBeenCalledWith('carburants', '13', expect.objectContaining({ fn: 'avg' }))
    expect(out!.text.value).toContain('pour Gazole')
  })

  it('renders — when the aggregate cannot be resolved', async () => {
    scalar.mockResolvedValue(null)
    const { text } = useResolvedTokens({ raw: () => '{{ AVG(x@1) }}', tokenMap: () => ({}) })
    await settle()
    expect(text.value).toBe('—')
  })

  it('reacts to tokenMap changes', async () => {
    scalar.mockResolvedValue(5)
    const map = ref<Record<string, string>>({ y: '2020' })
    const { text } = useResolvedTokens({
      raw: () => '{{ AVG(x@1 | annee = $y) }} en {{y}}',
      tokenMap: () => map.value,
    })
    await settle()
    expect(text.value).toBe('5 en 2020')
    map.value = { y: '2021' }
    await settle()
    expect(scalar).toHaveBeenLastCalledWith('1', expect.objectContaining({
      filters: [{ column: 'annee', operator: '=', value: '2021' }],
    }))
  })

  it('routes @<sourceId> through the block primary dataset with sources/joins when the source is joined', async () => {
    scalar.mockResolvedValue(3)
    const block: StudioBlock = {
      id: 'b', type: 'kpi', zoneId: 'z', fieldMapping: {}, config: {},
      datasetId: '1', primarySourceId: '1',
      sources: [{ id: '1', datasetId: '1' }, { id: '2', datasetId: '2' }],
      joins: [{ leftSourceId: '1', leftColumn: 'k', rightSourceId: '2', rightColumn: 'k', type: 'left' }],
    }
    const { text } = useResolvedTokens({
      raw: () => '{{ AVG(pop@2) }}',
      tokenMap: () => ({}),
      block: () => block,
    })
    await settle()
    // URL = dataset primaire, colonne qualifiée, contexte multi-sources joint
    expect(scalar).toHaveBeenLastCalledWith('1', expect.objectContaining({
      fn: 'avg',
      column: 'pop@2',
      sources: block.sources,
      primarySourceId: '1',
      joins: block.joins,
    }))
    expect(text.value).toBe('3')
  })

  it('treats @<datasetId> as a raw dataset when it is not a block source', async () => {
    scalar.mockResolvedValue(7)
    const block: StudioBlock = { id: 'b', type: 'kpi', zoneId: 'z', fieldMapping: {}, config: {}, datasetId: '1', primarySourceId: '1', sources: [{ id: '1', datasetId: '1' }] }
    const { text } = useResolvedTokens({ raw: () => '{{ SUM(x@42) }}', tokenMap: () => ({}), block: () => block })
    await settle()
    expect(scalar).toHaveBeenLastCalledWith('42', expect.objectContaining({ fn: 'sum', column: 'x' }))
    expect(scalar.mock.calls[0]![1]).not.toHaveProperty('sources')
    expect(text.value).toBe('7')
  })
})

describe('useExpressionNumber', () => {
  beforeEach(() => { scalar.mockReset(); clearAggregateCache() })

  it('resolves an expression to a number and stays null when empty', async () => {
    scalar.mockResolvedValue(2.5)
    const { value } = useExpressionNumber({ expression: () => 'AVG(x@1) - 0.5', tokenMap: () => ({}) })
    await settle()
    expect(value.value).toBeCloseTo(2)

    const { value: empty } = useExpressionNumber({ expression: () => '', tokenMap: () => ({}) })
    await settle()
    expect(empty.value).toBeNull()
  })
})

describe('useResolvedTokenList', () => {
  beforeEach(() => { scalar.mockReset(); clearAggregateCache() })

  it('resolves each item independently', async () => {
    scalar.mockResolvedValue(7)
    const { list } = useResolvedTokenList({
      items: () => ['{{ COUNT(x@1) }} stations', 'texte simple {{v}}'],
      tokenMap: () => ({ v: 'ok' }),
    })
    await settle()
    expect(list.value).toEqual(['7 stations', 'texte simple ok'])
  })
})
