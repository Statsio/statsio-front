import { describe, it, expect } from 'vitest'
import { rowsToCsv, csvFileName } from './csv'

describe('rowsToCsv', () => {
  it('writes a header row then one row per record, in column order', () => {
    const csv = rowsToCsv(['ville', 'prix'], [
      { prix: 1.8, ville: 'Lyon' },
      { prix: 1.9, ville: 'Paris' },
    ])
    expect(csv).toBe('﻿ville,prix\r\nLyon,1.8\r\nParis,1.9')
  })

  it('quotes cells containing the separator, quotes or newlines (RFC 4180)', () => {
    const csv = rowsToCsv(['a', 'b'], [{ a: 'x,y', b: 'he said "hi"' }])
    expect(csv).toBe('﻿a,b\r\n"x,y","he said ""hi"""')
  })

  it('renders null / undefined / missing values as empty', () => {
    const csv = rowsToCsv(['a', 'b'], [{ a: null, b: undefined }])
    expect(csv).toBe('﻿a,b\r\n,')
  })

  it('supports a custom separator', () => {
    expect(rowsToCsv(['a', 'b'], [{ a: 1, b: 2 }], ';')).toBe('﻿a;b\r\n1;2')
  })
})

describe('csvFileName', () => {
  it('slugifies the base and appends .csv', () => {
    expect(csvFileName('Prix des carburants — 2025')).toBe('prix-des-carburants-2025.csv')
  })

  it('falls back to export.csv for an empty base', () => {
    expect(csvFileName('   ')).toBe('export.csv')
  })
})
