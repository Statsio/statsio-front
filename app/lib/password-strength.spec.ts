import { describe, expect, it } from 'vitest'
import { computePasswordStrength, PASSWORD_STRENGTH_COLORS, PASSWORD_STRENGTH_LABELS } from './password-strength'

describe('computePasswordStrength', () => {
  it('returns 0 for an empty password', () => {
    expect(computePasswordStrength('')).toBe(0)
  })

  it('scores one point per satisfied criterion', () => {
    expect(computePasswordStrength('short')).toBe(0)
    expect(computePasswordStrength('longenough')).toBe(1)
    expect(computePasswordStrength('Longenough')).toBe(2)
    expect(computePasswordStrength('Longenough1')).toBe(3)
    expect(computePasswordStrength('Longenough1!')).toBe(4)
  })

  it('counts uppercase, digit and symbol criteria even below the length threshold', () => {
    expect(computePasswordStrength('A1!')).toBe(3)
  })
})

describe('PASSWORD_STRENGTH_COLORS / PASSWORD_STRENGTH_LABELS', () => {
  it('expose one entry per possible score (0 to 4)', () => {
    expect(PASSWORD_STRENGTH_COLORS).toHaveLength(4)
    expect(PASSWORD_STRENGTH_LABELS).toHaveLength(4)
  })
})
