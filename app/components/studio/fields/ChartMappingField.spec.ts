import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { StudioColumnGroup } from '@/lib/studio-columns'

let groups: StudioColumnGroup[] = []

vi.mock('@/lib/studio-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/studio-columns')>()
  return { ...actual, blockColumnGroups: () => groups }
})
vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn<() => Promise<unknown>>(),
  fetchDatasetSchema: vi.fn<(id: string) => Promise<unknown>>().mockResolvedValue({ id: 'ds1', name: 'DS', columns: [] }),
  fetchDatasetPreview: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
  deleteDataset: vi.fn<(id: string) => Promise<void>>(),
}))

import ChartMappingField from './ChartMappingField.vue'
import AxisFieldRow from './AxisFieldRow.vue'
import { useStudioStore } from '@/stores/studio'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { StudioBlock } from '@/types/studio'

function seed(
  type: StudioBlock['type'],
  fieldMapping: StudioBlock['fieldMapping'] = {},
  config: StudioBlock['config'] = {},
): StudioBlock {
  const store = useStudioStore()
  const section = store.addSection()
  const block = store.addBlock(type, `${section.id}-0`)
  Object.assign(block, {
    datasetId: 'ds1',
    sources: [{ id: 'ds1', datasetId: 'ds1' }],
    primarySourceId: 'ds1',
    fieldMapping,
    config: { ...block.config, ...config },
  })
  store.selectBlock(block.id)
  return store.selectedBlock as StudioBlock
}

beforeEach(() => {
  setActivePinia(createPinia())
  groups = [{ label: 'Source', sourceId: 'ds1', isPrimary: true, columns: [{ name: 'annee' }, { name: 'ca' }, { name: 'marge' }] }]
  useColumnDrillIn().close()
})

describe('ChartMappingField — bar', () => {
  it('renders X / Y sections with one series tab', () => {
    const block = seed('bar', { xAxis: 'annee', yAxes: ['ca'] })
    const w = mount(ChartMappingField, { props: { block } })
    expect(w.text()).toContain('Axe X')
    expect(w.text()).toContain('Axe Y')
    expect(w.text()).toContain('Série 1')
    expect(w.text()).toContain('Grouper par')
  })

  it('opens the column drill-in and writes xAxis on commit', async () => {
    const block = seed('bar', { yAxes: ['ca'] })
    const store = useStudioStore()
    const drillIn = useColumnDrillIn()
    const w = mount(ChartMappingField, { props: { block } })

    await w.findAllComponents(AxisFieldRow)[0]!.vm.$emit('open') // ligne « Champ » de l'axe X
    expect(drillIn.state.open).toBe(true)

    drillIn.pickColumn('annee')
    expect(store.selectedBlock!.fieldMapping.xAxis).toBe('annee')
  })

  it('adds a series via "+" and appends to yAxes', async () => {
    const block = seed('bar', { yAxes: ['ca'] })
    const store = useStudioStore()
    const drillIn = useColumnDrillIn()
    const w = mount(ChartMappingField, { props: { block } })

    await w.find('button[aria-label="Ajouter une série"]').trigger('click')
    drillIn.pickColumn('marge')

    expect(store.selectedBlock!.fieldMapping.yAxes).toEqual(['ca', 'marge'])
  })

  it('does not remove the last series', async () => {
    const block = seed('bar', { yAxes: ['ca'] })
    const store = useStudioStore()
    const w = mount(ChartMappingField, { props: { block } })

    // pas de bouton ✕ quand une seule série
    expect(w.find('span[aria-label="Retirer la série"]').exists()).toBe(false)
    expect(store.selectedBlock!.fieldMapping.yAxes).toEqual(['ca'])
  })

  it('writes aggregates[] when the function select changes', async () => {
    const block = seed('bar', { yAxes: ['ca'] })
    const store = useStudioStore()
    const w = mount(ChartMappingField, { props: { block } })

    await w.find('select').setValue('sum')

    expect(store.selectedBlock!.fieldMapping.aggregates).toEqual([{ column: 'ca', fn: 'sum' }])
    expect(store.selectedBlock!.fieldMapping.aggregate).toBeUndefined()
  })
})

describe('ChartMappingField — pie / kpi', () => {
  it('pie shows Étiquettes + Valeurs + fonction (column mode)', () => {
    const block = seed('pie', { label: 'annee', value: 'ca' })
    const w = mount(ChartMappingField, { props: { block } })
    expect(w.text()).toContain('Étiquettes')
    expect(w.text()).toContain('Valeurs')
    expect(w.find('select').exists()).toBe(true)
  })

  it('pie: switching to "Parts calculées" sets config.pieMode and shows the parts editor', async () => {
    const block = seed('pie', { label: 'annee', value: 'ca' })
    const store = useStudioStore()
    const w = mount(ChartMappingField, { props: { block } })

    await w.findAll('button').find((b) => b.text().includes('Parts calculées'))!.trigger('click')

    expect(store.selectedBlock!.config.pieMode).toBe('segments')
    expect(w.text()).toContain('Ajouter une part')
    expect(w.text()).not.toContain('Étiquettes')
  })

  it('pie: add a part, set fn + column, remove it', async () => {
    const block = seed('pie', {}, { pieMode: 'segments' })
    const store = useStudioStore()
    const w = mount(ChartMappingField, { props: { block } })
    const drillIn = useColumnDrillIn()

    await w.findAll('button').find((b) => b.text().includes('Ajouter une part'))!.trigger('click')
    expect(store.selectedBlock!.fieldMapping.pieSegments).toEqual([{ fn: 'sum', column: '' }])

    await w.find('select').setValue('remainder')
    expect(store.selectedBlock!.fieldMapping.pieSegments![0]!.fn).toBe('remainder')

    await w.findComponent(AxisFieldRow).vm.$emit('open')
    drillIn.pickColumn('Inscrits')
    expect(store.selectedBlock!.fieldMapping.pieSegments![0]!.column).toBe('Inscrits')

    await w.findAll('button').find((b) => b.text() === 'Retirer')!.trigger('click')
    expect(store.selectedBlock!.fieldMapping.pieSegments).toBeUndefined()
  })

  it('pie: edits a part label and reorders parts', async () => {
    const block = seed('pie', {
      pieSegments: [
        { fn: 'sum', column: 'Admis' },
        { fn: 'remainder', column: 'Inscrits' },
      ],
    }, { pieMode: 'segments' })
    const store = useStudioStore()
    const w = mount(ChartMappingField, { props: { block } })

    await w.find('input[type="text"]').setValue('Reçus')
    expect(store.selectedBlock!.fieldMapping.pieSegments![0]!.label).toBe('Reçus')

    // ▼ sur la 1re part → elle passe en 2e position
    await w.findAll('button[aria-label="Descendre"]')[0]!.trigger('click')
    expect(store.selectedBlock!.fieldMapping.pieSegments!.map((s) => s.column)).toEqual(['Inscrits', 'Admis'])
  })

  it('kpi: value builder seeds from legacy valueColumn/aggregate and combines aggregates', async () => {
    const block = seed('kpi', { valueColumn: 'ca', aggregate: 'avg' })
    const store = useStudioStore()
    const drillIn = useColumnDrillIn()
    const w = mount(ChartMappingField, { props: { block } })

    // Le constructeur affiche le terme dérivé du legacy (avg / ca).
    expect((w.find('select').element as HTMLSelectElement).value).toBe('avg')

    // « + combiner un agrégat » → 2e terme, opérateur, colonne.
    await w.findAll('button').find((b) => b.text().includes('combiner un agrégat'))!.trigger('click')
    const selects = w.findAll('select')
    await selects[1]!.setValue('-') // opérateur du 2e terme
    await selects[2]!.setValue('max') // fonction du 2e terme
    await w.findAllComponents({ name: 'ColumnDrillInPanel' }) // no-op
    await w.findAll('button').filter((b) => b.text() === 'colonne')[0]!.trigger('click')
    drillIn.pickColumn('marge')

    expect(store.selectedBlock!.fieldMapping.kpiValue).toEqual([
      { fn: 'avg', column: 'ca' },
      { op: '-', fn: 'max', column: 'marge' },
    ])
    // le legacy est purgé
    expect(store.selectedBlock!.fieldMapping.valueColumn).toBeUndefined()
    expect(store.selectedBlock!.config.valueExpression).toBeUndefined()
  })

  it('kpi: an un-parseable legacy expression stays read-only', () => {
    const block = seed('kpi', {}, { valueExpression: '(MAX(a) - MIN(a)) * 100 : 0' })
    const w = mount(ChartMappingField, { props: { block } })
    expect(w.text()).toContain('(MAX(a) - MIN(a)) * 100 : 0')
    expect(w.text()).toContain('non éditable visuellement')
  })
})
