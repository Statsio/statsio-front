import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import { applyAgentPatch } from './studio-agent-patch'
import type { AgentPatchOp } from '@/api/ai'

describe('applyAgentPatch', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('applies section chrome (kicker / title / theme / anchor) from addSection', () => {
    const studio = useStudioStore()
    applyAgentPatch(
      [{ op: 'addSection', ref: 's1', pageRef: 'default', layout: '1-col', kicker: 'KPI', title: 'Chiffres clés', theme: 'dark', anchorId: 'chiffres' }],
      studio,
    )
    const section = studio.sections.at(-1)!
    expect(section).toMatchObject({ kicker: 'KPI', title: 'Chiffres clés', theme: 'dark', anchorId: 'chiffres' })
  })

  it('maps refs and drops a data block into the right zone', () => {
    const studio = useStudioStore()
    const ops: AgentPatchOp[] = [
      { op: 'addSection', ref: 's1', pageRef: 'default', layout: '2-cols' },
      {
        op: 'addBlock',
        ref: 'b1',
        sectionRef: 's1',
        col: 1,
        type: 'bar',
        datasetId: 42,
        fieldMapping: { xAxis: 'region', yAxes: ['population'], aggregate: 'sum' },
        config: { title: 'Population par région' },
      },
    ]

    const result = applyAgentPatch(ops, studio)

    expect(result.applied).toBe(2)
    expect(result.errors).toEqual([])

    const section = studio.sections[studio.sections.length - 1]!
    const block = studio.blocks.at(-1)!
    expect(block.zoneId).toBe(`${section.id}-1`)
    expect(block.type).toBe('bar')
    expect(block.datasetId).toBe('42')
    expect(block.fieldMapping.xAxis).toBe('region')
    expect(block.config.title).toBe('Population par région')
  })

  it('drops a block into a loop zone when loopRef is given', () => {
    const studio = useStudioStore()
    const ops: AgentPatchOp[] = [
      { op: 'addSection', ref: 's1', pageRef: 'default', layout: '1-col' },
      {
        op: 'addBlock', ref: 'lp', sectionRef: 's1', col: 0, type: 'loop',
        datasetId: 7, fieldMapping: { loopColumn: 'carburant', loopVar: 'item' },
      },
      {
        op: 'addBlock', ref: 'k1', loopRef: 'lp', type: 'kpi', datasetId: 7,
        fieldMapping: { valueColumn: 'prix', aggregate: 'avg' },
        filters: [{ column: 'carburant', operator: '=', value: '{{item}}' }],
      },
    ]

    const result = applyAgentPatch(ops, studio)

    expect(result.errors).toEqual([])
    const loop = studio.blocks.find((b) => b.type === 'loop')!
    const kpi = studio.blocks.find((b) => b.type === 'kpi')!
    expect(kpi.zoneId).toBe(`loop:${loop.id}:0`)
    expect(kpi.filters?.[0]!.value).toBe('{{item}}')
    expect(studio.loopChildIds(loop.id)).toEqual([kpi.id])
  })

  it('translates a legacy template page op into a declared param + a normal search block', () => {
    const studio = useStudioStore()

    applyAgentPatch(
      [
        {
          op: 'addPage',
          ref: 'p1',
          title: 'Par région',
          isTemplate: true,
          paramName: 'region',
          paramColumn: 'region',
          searchDatasetId: 7,
          searchColumns: ['region', 'population'],
          resultTitleColumn: 'region',
        },
      ],
      studio,
    )

    const page = studio.pages.at(-1)!
    expect(page.isTemplate).toBeFalsy()
    expect(page.params?.[0]).toMatchObject({ name: 'region', column: 'region', datasetId: '7', fanOut: true })

    const search = studio.blocks.find((b) => b.type === 'search')!
    expect(search.locked).toBeFalsy()
    expect(search.fieldMapping.targetPageId).toBe(page.id)
    expect(search.fieldMapping.searchSources).toEqual([
      { datasetId: '7', columns: ['region', 'population'] },
    ])
    expect(search.fieldMapping.resultTitleColumn).toBe('region')
    expect(search.fieldMapping.urlParams).toEqual(['region'])
  })

  it('collapses the whole patch into a single undo step', () => {
    const studio = useStudioStore()

    const result = applyAgentPatch(
      [
        { op: 'addSection', ref: 's1', pageRef: 'default', layout: '1-col' },
        { op: 'addBlock', ref: 'b1', sectionRef: 's1', col: 0, type: 'paragraph' },
        { op: 'addBlock', ref: 'b2', sectionRef: 's1', col: 0, type: 'heading' },
      ],
      studio,
    )

    expect(result.undoSteps).toBe(1)
    const blockCount = studio.blocks.length
    studio.undo()
    expect(studio.blocks.length).toBeLessThan(blockCount)
    expect(studio.canUndo).toBe(false)
  })

  it('records an error for an unknown op and keeps going', () => {
    const studio = useStudioStore()
    const result = applyAgentPatch(
      [
        { op: 'teleport', ref: 'x' } as AgentPatchOp,
        { op: 'addSection', ref: 's1', pageRef: 'default', layout: '1-col' },
      ],
      studio,
    )

    expect(result.applied).toBe(1)
    expect(result.errors[0]).toContain('teleport')
  })

  it('configures a page search block via updateBlock', () => {
    const studio = useStudioStore()
    applyAgentPatch(
      [{ op: 'addPage', ref: 'p1', title: 'T', isTemplate: true, paramName: 'region' }],
      studio,
    )
    const search = studio.blocks.find((b) => b.type === 'search')!

    const result = applyAgentPatch(
      [
        {
          op: 'updateBlock',
          blockRef: search.id,
          // datasetId en nombre (comme le modèle le renvoie parfois) → coercé en chaîne.
          fieldMapping: {
            searchSources: [{ datasetId: 9, columns: ['region'] }],
            resultTitleColumn: 'region',
          },
        },
      ],
      studio,
    )

    expect(result.errors).toEqual([])
    const updated = studio.blocks.find((b) => b.id === search.id)!
    expect(updated.fieldMapping.searchSources).toEqual([{ datasetId: '9', columns: ['region'] }])
    // targetPageId préservé (pas de reset via updateBlockDataset sur un bloc search).
    expect(updated.fieldMapping.targetPageId).toBeTruthy()
  })
})
