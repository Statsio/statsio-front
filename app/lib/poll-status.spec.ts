import { describe, expect, it } from 'vitest'
import { getPollStatus } from './poll-status'

describe('getPollStatus', () => {
  it('is closed and « not yet open » before opens_at', () => {
    const s = getPollStatus({ opens_at: new Date(Date.now() + 3 * 86_400_000).toISOString() })
    expect(s.closed).toBe(true)
    expect(s.notYetOpen).toBe(true)
    expect(s.label).toMatch(/^Ouvre le /)
  })

  it('ignores a past opens_at and falls back to the deadline', () => {
    const s = getPollStatus({
      opens_at: new Date(Date.now() - 86_400_000).toISOString(),
      response_deadline: new Date(Date.now() - 1000).toISOString(),
    })
    expect(s).toMatchObject({ closed: true, label: 'Clôturé' })
    expect(s.notYetOpen).toBeUndefined()
  })
})
