import type { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  formatApiErrorDetail,
  getErrorMessage,
  getHttpErrorStatus,
  getValidationErrors,
  isUnauthorizedError,
} from './http-errors'

const makeAxiosError = (status: number | undefined, data?: unknown): AxiosError =>
  ({
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    toJSON: () => ({}),
    response: status === undefined ? undefined : { status, data, statusText: '', headers: {}, config: {} as never },
  }) as AxiosError

describe('isUnauthorizedError', () => {
  it('is true only for a 401 axios error', () => {
    expect(isUnauthorizedError(makeAxiosError(401))).toBe(true)
    expect(isUnauthorizedError(makeAxiosError(403))).toBe(false)
    expect(isUnauthorizedError(new Error('nope'))).toBe(false)
  })
})

describe('getHttpErrorStatus', () => {
  it('returns the real HTTP status when present', () => {
    expect(getHttpErrorStatus(makeAxiosError(404), 500)).toBe(404)
  })

  it('falls back to the provided default otherwise', () => {
    expect(getHttpErrorStatus(makeAxiosError(undefined), 500)).toBe(500)
    expect(getHttpErrorStatus(new Error('nope'), 500)).toBe(500)
  })
})

describe('formatApiErrorDetail', () => {
  it('returns the fallback for a non-axios error', () => {
    expect(formatApiErrorDetail(new Error('boom'), 'Une erreur est survenue')).toBe('Une erreur est survenue')
  })

  it('uses the response message when present', () => {
    const error = makeAxiosError(422, { message: 'Validation échouée' })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('Validation échouée')
  })

  it('appends field-level validation errors', () => {
    const error = makeAxiosError(422, {
      message: 'Validation échouée',
      errors: { email: ['Le champ email est requis'], password: ['Trop court'] },
    })
    expect(formatApiErrorDetail(error, 'fallback')).toBe(
      'Validation échouée — email : Le champ email est requis — password : Trop court',
    )
  })

  it('appends the debug exception message when not already included', () => {
    const error = makeAxiosError(500, { message: 'Erreur serveur', debug: { message: 'SQLSTATE[42]' } })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('Erreur serveur — SQLSTATE[42]')
  })

  it('does not duplicate the debug message when it repeats the main message', () => {
    const error = makeAxiosError(500, { message: 'boom', debug: { message: 'boom' } })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('boom')
  })

  it('falls back to "fallback (HTTP status)" when there is no usable message', () => {
    const error = makeAxiosError(500, {})
    expect(formatApiErrorDetail(error, 'fallback')).toBe('fallback (HTTP 500)')
  })

  it('falls back to the plain fallback when there is no status either', () => {
    const error = makeAxiosError(undefined, {})
    expect(formatApiErrorDetail(error, 'fallback')).toBe('fallback')
  })
})

describe('getErrorMessage', () => {
  it('delegates to formatApiErrorDetail', () => {
    const error = makeAxiosError(422, { message: 'oops' })
    expect(getErrorMessage(error, 'fallback')).toBe('oops')
  })
})

describe('getValidationErrors', () => {
  it('returns an empty object for a non-422 error', () => {
    expect(getValidationErrors(makeAxiosError(500, { errors: { a: ['x'] } }))).toEqual({})
    expect(getValidationErrors(new Error('nope'))).toEqual({})
  })

  it('maps each field to its first error message', () => {
    const error = makeAxiosError(422, {
      errors: { email: ['Requis', 'Format invalide'], password: ['Trop court'] },
    })
    expect(getValidationErrors(error)).toEqual({ email: 'Requis', password: 'Trop court' })
  })

  it('falls back to a generic message when a field has no message', () => {
    const error = makeAxiosError(422, { errors: { email: [] } })
    expect(getValidationErrors(error)).toEqual({ email: 'Champ invalide' })
  })
})
