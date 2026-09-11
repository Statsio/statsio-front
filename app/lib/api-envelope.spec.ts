import { describe, expect, it } from 'vitest'
import { unwrapStatsioResponseData } from './api-envelope'

const makeResponse = (data: unknown) => ({ data })

describe('unwrapStatsioResponseData', () => {
  it('returns the data field of the envelope', () => {
    const result = unwrapStatsioResponseData(makeResponse({ success: true, data: { id: 42 } }))
    expect(result).toEqual({ id: 42 })
  })

  it('throws when the body is not an object', () => {
    expect(() => unwrapStatsioResponseData(makeResponse('oops'))).toThrow('Réponse API invalide')
    expect(() => unwrapStatsioResponseData(makeResponse(null))).toThrow('Réponse API invalide')
  })

  it('throws when the body has no data field', () => {
    expect(() => unwrapStatsioResponseData(makeResponse({ success: true }))).toThrow('Réponse API sans champ data')
  })
})
