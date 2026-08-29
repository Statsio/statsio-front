import { describe, it, expect } from 'vitest'
import { useAddSourceWizard, parseDatagouvResourceId, datagouvTabularUrl } from './useAddSourceWizard'

const DATAGOUV_ID = '336c34b5-a527-4c35-b84d-18462daa7c51'

describe('useAddSourceWizard', () => {
  describe('canGoNext — type step', () => {
    it('is false until sourceType is "file" or "api"', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'type'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.sourceType.value = 'file'
      expect(wizard.canGoNext.value).toBe(true)

      wizard.sourceType.value = 'api'
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('is always false for sourceType "catalog" (it bypasses the wizard elsewhere)', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'type'
      wizard.sourceType.value = 'catalog'
      expect(wizard.canGoNext.value).toBe(false)
    })

    it('for "datagouv" requires a parseable resource id', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'type'
      wizard.sourceType.value = 'datagouv'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.datagouvInput.value = 'nope'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.datagouvInput.value = DATAGOUV_ID
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('parseDatagouvResourceId', () => {
    it('returns a bare id unchanged (lowercased)', () => {
      expect(parseDatagouvResourceId(`  ${DATAGOUV_ID.toUpperCase()}  `)).toBe(DATAGOUV_ID)
    })

    it('extracts the id from a full tabular-api URL', () => {
      expect(parseDatagouvResourceId(`https://tabular-api.data.gouv.fr/api/resources/${DATAGOUV_ID}/data/?page=2`))
        .toBe(DATAGOUV_ID)
    })

    it('extracts the id from a data.gouv.fr dataset page fragment', () => {
      expect(parseDatagouvResourceId(`https://www.data.gouv.fr/fr/datasets/x/#/resources/${DATAGOUV_ID}`))
        .toBe(DATAGOUV_ID)
    })
  })

  describe('applyDatagouvPreset', () => {
    it('derives the tabular-api url, data envelope and next-link pagination', () => {
      const wizard = useAddSourceWizard()
      wizard.datagouvInput.value = ` ${DATAGOUV_ID} `
      wizard.applyDatagouvPreset()

      expect(wizard.apiForm.value.url).toBe(datagouvTabularUrl(DATAGOUV_ID))
      expect(wizard.apiForm.value.method).toBe('GET')
      expect(wizard.apiForm.value.dataPath).toBe('data')
      expect(wizard.apiForm.value.pagination.style).toBe('next_link')
      expect(wizard.apiForm.value.pagination.nextLinkPath).toBe('links.next')
      expect(wizard.apiForm.value.name).toContain('data.gouv.fr')

      wizard.datagouvName.value = 'Prix des carburants'
      wizard.applyDatagouvPreset()
      expect(wizard.apiForm.value.name).toBe('Prix des carburants')
    })

    it('produces a payload the api-sources endpoint accepts', () => {
      const wizard = useAddSourceWizard()
      wizard.datagouvInput.value = DATAGOUV_ID
      wizard.applyDatagouvPreset()

      const payload = wizard.buildApiPayload()
      expect(payload.url).toBe(datagouvTabularUrl(DATAGOUV_ID))
      expect(payload.data_path).toBe('data')
      expect(payload.pagination).toMatchObject({
        style: 'next_link',
        next_link_source: 'body',
        next_link_path: 'links.next',
        size_param: 'page_size',
        page_size: 200,
        max_pages: 500,
      })
    })
  })

  describe('canGoNext — configure step', () => {
    it('file mode requires fileObj to be set', () => {
      const wizard = useAddSourceWizard()
      wizard.sourceType.value = 'file'
      wizard.currentStepId.value = 'configure'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.fileObj.value = new File(['a'], 'a.csv')
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('api mode requires non-blank name and url', () => {
      const wizard = useAddSourceWizard()
      wizard.sourceType.value = 'api'
      wizard.currentStepId.value = 'configure'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.apiForm.value.name = '  '
      wizard.apiForm.value.url = 'https://example.com'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.apiForm.value.name = 'My API'
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('is false when sourceType is neither file nor api', () => {
      const wizard = useAddSourceWizard()
      wizard.sourceType.value = null
      wizard.currentStepId.value = 'configure'
      expect(wizard.canGoNext.value).toBe(false)
    })
  })

  describe('canGoNext — provenance step', () => {
    it('is false until provenanceId is set', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'provenance'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.provenanceId.value = 3
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('requires non-blank free text when provenanceId is "other"', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'provenance'
      wizard.provenanceId.value = 'other'
      expect(wizard.canGoNext.value).toBe(false)

      wizard.provenanceOtherLabel.value = '  '
      expect(wizard.canGoNext.value).toBe(false)

      wizard.provenanceOtherLabel.value = 'Mon site'
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('canGoNext — visibility step and unmodeled steps', () => {
    it('is always true for the visibility step', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'visibility'
      expect(wizard.canGoNext.value).toBe(true)
    })

    it('is always true for any step id not explicitly modeled', () => {
      const wizard = useAddSourceWizard()
      wizard.currentStepId.value = 'unknown-step'
      expect(wizard.canGoNext.value).toBe(true)
    })
  })

  describe('buildApiPayload', () => {
    it('omits refresh_frequency when materialization is "live"', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.name = 'My API'
      wizard.apiForm.value.url = 'https://example.com'
      wizard.apiForm.value.materialization = 'live'
      wizard.apiForm.value.refreshFrequency = 'daily'

      const payload = wizard.buildApiPayload()
      expect(payload).not.toHaveProperty('refresh_frequency')
    })

    it('includes refresh_frequency when materialization is "snapshot"', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.name = 'My API'
      wizard.apiForm.value.url = 'https://example.com'
      wizard.apiForm.value.materialization = 'snapshot'
      wizard.apiForm.value.refreshFrequency = 'daily'

      const payload = wizard.buildApiPayload()
      expect(payload.refresh_frequency).toBe('daily')
    })

    it('adds an api_key header only when authType is "api_key" with a value set', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.authType = 'api_key'
      wizard.apiForm.value.apiKeyHeader = ''
      wizard.apiForm.value.apiKeyValue = 'secret'

      const payload = wizard.buildApiPayload()
      expect(payload.headers).toEqual({ 'X-API-Key': 'secret' })
    })

    it('does not add an api_key header when the value is empty', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.authType = 'api_key'
      wizard.apiForm.value.apiKeyValue = ''

      const payload = wizard.buildApiPayload()
      expect(payload.headers).toEqual({})
    })

    it('adds an Authorization Bearer header only when authType is "bearer" with a token set', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.authType = 'bearer'
      wizard.apiForm.value.bearerToken = 'tok123'

      const payload = wizard.buildApiPayload()
      expect(payload.headers).toEqual({ Authorization: 'Bearer tok123' })
    })

    it('adds no auth headers when authType is "none"', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.authType = 'none'

      const payload = wizard.buildApiPayload()
      expect(payload.headers).toEqual({})
    })

    it('merges buildMetadataPayload fields and the mapped pagination', () => {
      const wizard = useAddSourceWizard()
      wizard.apiForm.value.name = 'My API'
      wizard.apiForm.value.url = 'https://example.com'
      wizard.visibility.value = 'public'
      wizard.categories.value = ['news']

      const payload = wizard.buildApiPayload()
      expect(payload.categories).toEqual(['news'])
      expect(payload.pagination).toEqual({ style: 'none' })
      expect(payload.name).toBe('My API')
      expect(payload.url).toBe('https://example.com')
    })
  })

  describe('buildMetadataPayload', () => {
    it('clears categories when visibility is "private" even if categories were set', () => {
      const wizard = useAddSourceWizard()
      wizard.visibility.value = 'private'
      wizard.categories.value = ['news', 'sport']

      expect(wizard.buildMetadataPayload().categories).toEqual([])
    })

    it('keeps categories when visibility is "public"', () => {
      const wizard = useAddSourceWizard()
      wizard.visibility.value = 'public'
      wizard.categories.value = ['news']

      expect(wizard.buildMetadataPayload().categories).toEqual(['news'])
    })

    it('sets provenance_other_label only when provenanceId is "other" (trimmed)', () => {
      const wizard = useAddSourceWizard()
      wizard.provenanceId.value = 'other'
      wizard.provenanceOtherLabel.value = '  Mon site  '
      expect(wizard.buildMetadataPayload().provenance_other_label).toBe('Mon site')

      wizard.provenanceId.value = 5
      expect(wizard.buildMetadataPayload().provenance_other_label).toBeNull()
    })

    it('sets provenance_id only when provenanceId is a number, else null', () => {
      const wizard = useAddSourceWizard()
      wizard.provenanceId.value = 7
      expect(wizard.buildMetadataPayload().provenance_id).toBe(7)

      wizard.provenanceId.value = 'other'
      expect(wizard.buildMetadataPayload().provenance_id).toBeNull()

      wizard.provenanceId.value = null
      expect(wizard.buildMetadataPayload().provenance_id).toBeNull()
    })
  })

  describe('reset', () => {
    it('resets every ref, including nested apiForm/pagination objects, back to defaults', () => {
      const wizard = useAddSourceWizard()
      wizard.sourceType.value = 'api'
      wizard.fileObj.value = new File(['a'], 'a.csv')
      wizard.apiForm.value.name = 'Changed'
      wizard.apiForm.value.pagination.style = 'offset'
      wizard.datagouvInput.value = DATAGOUV_ID
      wizard.datagouvName.value = 'x'
      wizard.provenanceId.value = 'other'
      wizard.provenanceOtherLabel.value = 'x'
      wizard.visibility.value = 'public'
      wizard.categories.value = ['news']
      wizard.currentStepId.value = 'visibility'

      wizard.reset()

      expect(wizard.sourceType.value).toBeNull()
      expect(wizard.fileObj.value).toBeNull()
      expect(wizard.apiForm.value.name).toBe('')
      expect(wizard.apiForm.value.pagination.style).toBe('none')
      expect(wizard.datagouvInput.value).toBe('')
      expect(wizard.datagouvName.value).toBe('')
      expect(wizard.provenanceId.value).toBeNull()
      expect(wizard.provenanceOtherLabel.value).toBe('')
      expect(wizard.visibility.value).toBe('private')
      expect(wizard.categories.value).toEqual([])
      expect(wizard.currentStepId.value).toBe('type')
    })
  })
})
