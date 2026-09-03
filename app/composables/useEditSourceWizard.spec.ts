import { describe, it, expect } from 'vitest'
import { useEditSourceWizard, EDIT_SOURCE_WIZARD_STEPS } from './useEditSourceWizard'
import type { DataSourceDetail } from '@/api/data-sources'

function makeSource(overrides: Partial<DataSourceDetail> = {}): DataSourceDetail {
  return {
    id: '1',
    name: 'My source',
    type: 'dataset',
    sourceKind: 'upload',
    materialization: 'snapshot',
    originalFilename: 'data.csv',
    sheetName: null,
    headerRow: null,
    excludedRows: [],
    fileSizeBytes: 1024,
    status: 'ready',
    isPartial: false,
    partialReason: null,
    visibility: 'private',
    categories: [],
    provenance: null,
    provenanceOtherLabel: null,
    apiConfig: null,
    queryMapping: null,
    refreshFrequency: 'none',
    lastRefreshedAt: null,
    nextRefreshAt: null,
    isOwner: true,
    ...overrides,
  }
}

describe('useEditSourceWizard', () => {
  it('exposes a synchronisation step in the wizard step list', () => {
    expect(EDIT_SOURCE_WIZARD_STEPS.map((s) => s.id)).toEqual([
      'configure',
      'synchronisation',
      'provenance',
      'visibility',
    ])
  })

  describe('canGoNext — configure step', () => {
    it('file source requires a non-blank name', () => {
      const wizard = useEditSourceWizard(makeSource({ sourceKind: 'upload' }))
      wizard.currentStepId.value = 'configure'
      wizard.name.value = '  '
      expect(wizard.canGoNext.value).toBe(false)

      wizard.name.value = 'Renamed'
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('api source requires non-blank apiForm name and url', () => {
      const wizard = useEditSourceWizard(makeSource({
        sourceKind: 'api',
        apiConfig: { url: 'https://example.com', method: 'GET', authType: 'none', headers: {}, dataPath: null, pagination: { style: 'none' } },
      }))
      wizard.currentStepId.value = 'configure'
      wizard.apiForm.value.url = ''
      expect(wizard.canGoNext.value).toBe(false)

      wizard.apiForm.value.url = 'https://example.com'
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('canGoNext — provenance step', () => {
    it('requires provenanceId to be set, or free text when "other"', () => {
      const wizard = useEditSourceWizard(makeSource())
      wizard.currentStepId.value = 'provenance'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.provenanceId.value = 'other'
      expect(wizard.canGoNext.value).toBe(false)
      wizard.provenanceOtherLabel.value = 'Mon site'
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('canGoNext — visibility step', () => {
    it('is always true', () => {
      const wizard = useEditSourceWizard(makeSource())
      wizard.currentStepId.value = 'visibility'
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('buildPayload', () => {
    it('uses the trimmed name field for a file source', () => {
      const wizard = useEditSourceWizard(makeSource({ sourceKind: 'upload' }))
      wizard.name.value = '  Renamed  '
      wizard.provenanceId.value = 4
      expect(wizard.buildPayload().name).toBe('Renamed')
    })

    it('omits refresh_frequency when materialization is "live" for an api source', () => {
      const wizard = useEditSourceWizard(makeSource({
        sourceKind: 'api',
        materialization: 'live',
        apiConfig: { url: 'https://example.com', method: 'GET', authType: 'none', headers: {}, dataPath: null, pagination: { style: 'none' } },
      }))
      const payload = wizard.buildPayload()
      expect(payload).not.toHaveProperty('refresh_frequency')
      expect(payload.url).toBe('https://example.com')
    })

    it('includes refresh_frequency when materialization is "snapshot" for an api source', () => {
      const wizard = useEditSourceWizard(makeSource({
        sourceKind: 'api',
        materialization: 'snapshot',
        refreshFrequency: 'weekly',
        apiConfig: { url: 'https://example.com', method: 'GET', authType: 'none', headers: {}, dataPath: null, pagination: { style: 'none' } },
      }))
      expect(wizard.buildPayload().refresh_frequency).toBe('weekly')
    })

    it('only includes sheet_name/header_row/excluded_rows for a file source when newFileObj is set', () => {
      const wizard = useEditSourceWizard(makeSource({ sourceKind: 'upload' }))
      expect(wizard.buildPayload()).not.toHaveProperty('sheet_name')

      wizard.newFileObj.value = new File(['a'], 'a.xlsx')
      wizard.sheetName.value = 'Sheet1'
      wizard.headerRow.value = 1
      wizard.excludedRows.value = [2, 3]

      const payload = wizard.buildPayload()
      expect(payload.sheet_name).toBe('Sheet1')
      expect(payload.header_row).toBe(1)
      expect(payload.excluded_rows).toEqual([2, 3])
    })

    it('adds an Authorization Bearer header only when authType is "bearer" with a token', () => {
      const wizard = useEditSourceWizard(makeSource({
        sourceKind: 'api',
        apiConfig: { url: 'https://example.com', method: 'GET', authType: 'bearer', headers: { Authorization: 'Bearer old-token' }, dataPath: null, pagination: { style: 'none' } },
      }))
      expect(wizard.buildPayload().headers).toEqual({ Authorization: 'Bearer old-token' })
    })
  })

  describe('toApiFormPagination (via apiForm.pagination init)', () => {
    it('falls back to defaultPagination() when apiConfig.pagination is absent', () => {
      const wizard = useEditSourceWizard(makeSource({ sourceKind: 'upload' }))
      expect(wizard.apiForm.value.pagination.style).toBe('none')
      expect(wizard.apiForm.value.pagination.pageSize).toBe(100)
    })

    it('reuses the present fields from source.apiConfig.pagination', () => {
      const wizard = useEditSourceWizard(makeSource({
        sourceKind: 'api',
        apiConfig: {
          url: 'https://example.com',
          method: 'GET',
          authType: 'none',
          headers: {},
          dataPath: null,
          pagination: { style: 'page', paramName: 'p', pageSize: 25 },
        },
      }))
      expect(wizard.apiForm.value.pagination.style).toBe('page')
      expect(wizard.apiForm.value.pagination.paramName).toBe('p')
      expect(wizard.apiForm.value.pagination.pageSize).toBe(25)
    })
  })
})
