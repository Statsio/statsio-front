import { describe, expect, it } from 'vitest'
import type { BlockConfig, IfBranch } from '@/types/studio'
import {
  compareValues,
  evaluateCondition,
  evaluateIf,
  isElseBranch,
  matchingBranchIndex,
  readIfBranches,
  readIfConditions,
  readIfMatch,
} from './studio-if'

describe('readIfConditions', () => {
  it('returns the new ifConditions array when present', () => {
    const config = {
      ifConditions: [{ param: 'carburant', operator: '=', value: 'gazole' }],
    } as BlockConfig
    expect(readIfConditions(config)).toEqual([{ param: 'carburant', operator: '=', value: 'gazole' }])
  })

  it('falls back to the legacy ifParam / ifOperator / ifValue triple', () => {
    const config = { ifParam: 'region', ifOperator: 'contains', ifValue: 'Île' } as BlockConfig
    expect(readIfConditions(config)).toEqual([
      { param: 'region', operator: 'contains', value: 'Île' },
    ])
  })

  it('defaults a legacy condition operator to "=" and value to ""', () => {
    expect(readIfConditions({ ifParam: 'x' } as BlockConfig)).toEqual([
      { param: 'x', operator: '=', value: '' },
    ])
  })

  it('returns an empty array when nothing is configured', () => {
    expect(readIfConditions({} as BlockConfig)).toEqual([])
  })

  it('prefers ifConditions over the legacy fields', () => {
    const config = {
      ifParam: 'legacy',
      ifConditions: [{ param: 'fresh', operator: '=', value: '1' }],
    } as BlockConfig
    expect(readIfConditions(config)[0]!.param).toBe('fresh')
  })
})

describe('readIfMatch', () => {
  it('defaults to "all"', () => {
    expect(readIfMatch({} as BlockConfig)).toBe('all')
  })
  it('reads "any"', () => {
    expect(readIfMatch({ ifMatch: 'any' } as BlockConfig)).toBe('any')
  })
})

describe('compareValues', () => {
  it('compares numbers numerically', () => {
    expect(compareValues('10', '>', '9')).toBe(true)
    expect(compareValues('10', '<', '9')).toBe(false)
  })
  it('compares non-numbers lexicographically', () => {
    expect(compareValues('b', '>', 'a')).toBe(true)
  })
  it('handles equality and inequality', () => {
    expect(compareValues('gazole', '=', 'gazole')).toBe(true)
    expect(compareValues('gazole', '!=', 'sp95')).toBe(true)
  })
  it('handles contains / not_contains case-insensitively', () => {
    expect(compareValues('Île-de-France', 'contains', 'france')).toBe(true)
    expect(compareValues('Bretagne', 'not_contains', 'france')).toBe(true)
  })
})

describe('evaluateCondition', () => {
  it('reads the left operand from the token map', () => {
    expect(evaluateCondition({ param: 'carburant', operator: '=', value: 'gazole' }, { carburant: 'gazole' })).toBe(true)
  })
  it('interpolates {{tokens}} in the compared value', () => {
    expect(
      evaluateCondition({ param: 'a', operator: '=', value: '{{b}}' }, { a: 'x', b: 'x' }),
    ).toBe(true)
  })
  it('is false when the parameter is empty', () => {
    expect(evaluateCondition({ param: '', operator: '=', value: '' }, {})).toBe(false)
  })
  it('treats a missing parameter value as an empty string', () => {
    expect(evaluateCondition({ param: 'missing', operator: '=', value: '' }, {})).toBe(true)
  })
})

describe('evaluateIf', () => {
  const map = { carburant: 'gazole', region: 'Bretagne' }

  it('is false with no conditions', () => {
    expect(evaluateIf([], 'all', map)).toBe(false)
  })

  it('"all" requires every condition to pass', () => {
    expect(
      evaluateIf(
        [
          { param: 'carburant', operator: '=', value: 'gazole' },
          { param: 'region', operator: '=', value: 'Bretagne' },
        ],
        'all',
        map,
      ),
    ).toBe(true)
    expect(
      evaluateIf(
        [
          { param: 'carburant', operator: '=', value: 'gazole' },
          { param: 'region', operator: '=', value: 'Corse' },
        ],
        'all',
        map,
      ),
    ).toBe(false)
  })

  it('"any" passes as soon as one condition passes', () => {
    expect(
      evaluateIf(
        [
          { param: 'carburant', operator: '=', value: 'sp95' },
          { param: 'region', operator: '=', value: 'Bretagne' },
        ],
        'any',
        map,
      ),
    ).toBe(true)
  })
})

describe('readIfBranches', () => {
  it('returns ifBranches when present', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'a', operator: '=', value: '1' }], match: 'all' },
      { conditions: [], match: 'all' },
    ]
    expect(readIfBranches({ ifBranches: branches } as BlockConfig)).toBe(branches)
  })

  it('falls back to a single branch built from ifConditions/ifMatch', () => {
    const config = { ifConditions: [{ param: 'x', operator: '=', value: 'y' }], ifMatch: 'any' } as BlockConfig
    expect(readIfBranches(config)).toEqual([
      { conditions: [{ param: 'x', operator: '=', value: 'y' }], match: 'any' },
    ])
  })

  it('falls back to a single empty branch when nothing is configured', () => {
    expect(readIfBranches({} as BlockConfig)).toEqual([{ conditions: [], match: 'all' }])
  })
})

describe('isElseBranch', () => {
  it('is false without the explicit "else" flag, even for a trailing branch with no condition', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'a', operator: '=', value: '1' }], match: 'all' },
      { conditions: [], match: 'all' },
    ]
    expect(isElseBranch(branches, 1)).toBe(false)
  })

  it('is true only for a branch flagged "else" — disambiguates it from an elsif still being edited', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'a', operator: '=', value: '1' }], match: 'all' },
      { conditions: [{ param: '', operator: '=', value: '' }], match: 'all' }, // elsif not yet configured
      { conditions: [], match: 'all', else: true },
    ]
    expect(isElseBranch(branches, 1)).toBe(false)
    expect(isElseBranch(branches, 2)).toBe(true)
  })
})

describe('matchingBranchIndex', () => {
  const tokenMap = { carburant: 'gazole', region: 'Bretagne' }

  it('returns the first branch whose conditions pass', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'carburant', operator: '=', value: 'sp95' }], match: 'all' },
      { conditions: [{ param: 'region', operator: '=', value: 'Bretagne' }], match: 'all' },
      { conditions: [], match: 'all', else: true },
    ]
    expect(matchingBranchIndex(branches, tokenMap)).toBe(1)
  })

  it('falls through to the trailing else branch when nothing else matches', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'carburant', operator: '=', value: 'sp95' }], match: 'all' },
      { conditions: [], match: 'all', else: true },
    ]
    expect(matchingBranchIndex(branches, tokenMap)).toBe(1)
  })

  it('returns -1 when no branch matches and there is no else', () => {
    const branches: IfBranch[] = [{ conditions: [{ param: 'carburant', operator: '=', value: 'sp95' }], match: 'all' }]
    expect(matchingBranchIndex(branches, tokenMap)).toBe(-1)
  })

  it('never matches an unconfigured single branch (no "else" flag)', () => {
    expect(matchingBranchIndex([{ conditions: [], match: 'all' }], tokenMap)).toBe(-1)
  })

  it('an elsif branch not yet configured never matches, even if it is last', () => {
    const branches: IfBranch[] = [
      { conditions: [{ param: 'carburant', operator: '=', value: 'sp95' }], match: 'all' },
      { conditions: [{ param: '', operator: '=', value: '' }], match: 'all' },
    ]
    expect(matchingBranchIndex(branches, tokenMap)).toBe(-1)
  })
})
