import { describe, expect, it } from 'vitest'
import { klaroConfig, purposeMeta } from './klaro'

describe('klaroConfig', () => {
  it('every service has a unique name', () => {
    const names = klaroConfig.services.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('every service purpose is documented in purposeMeta', () => {
    for (const service of klaroConfig.services) {
      for (const purpose of service.purposes) {
        expect(purposeMeta).toHaveProperty(purpose)
      }
    }
  })

  it('marks required services as opted-in by default', () => {
    for (const service of klaroConfig.services) {
      if (service.required) {
        expect(service.default).toBe(true)
      }
    }
  })

  it('marks non-technical/functional/security services as opt-in by default', () => {
    const optionalPurposes = new Set(['analytics', 'videos'])
    for (const service of klaroConfig.services) {
      if (service.purposes.every((p) => optionalPurposes.has(p))) {
        expect(service.default).toBe(false)
        expect(service.required).toBe(false)
      }
    }
  })
})

describe('purposeMeta', () => {
  it('gives every purpose a label and description', () => {
    for (const meta of Object.values(purposeMeta)) {
      expect(meta.label).toEqual(expect.any(String))
      expect(meta.description).toEqual(expect.any(String))
    }
  })
})
