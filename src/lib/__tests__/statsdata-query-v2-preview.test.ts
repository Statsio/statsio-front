import { describe, expect, it } from 'vitest'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import { executeStatsDataQueryV2Preview } from '@/lib/statsdata-query-v2-preview'

describe('executeStatsDataQueryV2Preview', () => {
  it('joins + selects from + formula + groupBy', () => {
    const spec: StatsDataQueryRequestV2 = {
      specVersion: 2,
      sources: [
        { alias: 's', sourceId: 'src1' },
        { alias: 't', sourceId: 'src2' },
      ],
      join: { type: 'inner', on: ['city'] },
      select: [
        { kind: 'from', label: 'city', from: 's.city' },
        { kind: 'from', label: 'pop', from: 't.population' },
        {
          kind: 'formula',
          label: 'pop2',
          expr: { kind: 'op', op: 'mul', args: [{ kind: 'ref', ref: 'pop' }, { kind: 'number', value: 2 }] },
        },
      ],
      groupBy: ['city'],
      aggregations: [{ label: 'Total', fn: 'sum', expr: { kind: 'ref', ref: 'pop2' } }],
    }

    const rowsByAlias = {
      s: [{ city: 'A' }, { city: 'B' }],
      t: [{ city: 'A', population: 3 }, { city: 'B', population: 10 }],
    }

    const out = executeStatsDataQueryV2Preview(spec, rowsByAlias)
    const byCity = Object.fromEntries(out.map((r) => [r.city as string, r]))

    expect(byCity.A).toBeTruthy()
    expect(byCity.B).toBeTruthy()
    expect((byCity.A as any).Total).toBe(6)
    expect((byCity.B as any).Total).toBe(20)
  })
})

