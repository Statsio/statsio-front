import { describe, it, expect } from 'vitest'
import { plural } from './plural'

describe('plural', () => {
  it('keeps the singular for -1, 0 and 1', () => {
    expect(plural('dataset', 0)).toBe('dataset')
    expect(plural('dataset', 1)).toBe('dataset')
    expect(plural('dataset', -1)).toBe('dataset')
  })

  it('uses the plural beyond 1', () => {
    expect(plural('dataset', 2)).toBe('datasets')
    expect(plural('dataset', 40)).toBe('datasets')
  })

  it('accepts an irregular plural form', () => {
    expect(plural('son analyse', 3, 'leurs analyses')).toBe('leurs analyses')
    expect(plural('son analyse', 1, 'leurs analyses')).toBe('son analyse')
  })
})
