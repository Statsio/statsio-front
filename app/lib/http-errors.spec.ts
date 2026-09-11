import { describe, expect, it } from 'vitest'
import { HttpError, type HttpResponse } from './http'
import {
  formatApiErrorDetail,
  getErrorMessage,
  getHttpErrorStatus,
  getValidationErrors,
  isUnauthorizedError,
} from './http-errors'

const makeHttpError = (status: number | undefined, data?: unknown): HttpError => {
  const response: HttpResponse | undefined =
    status === undefined ? undefined : { status, data, statusText: '', headers: new Headers() }
  return new HttpError('Request failed', { url: '/x', method: 'GET' }, response)
}

describe('isUnauthorizedError', () => {
  it('is true only for a 401 http error', () => {
    expect(isUnauthorizedError(makeHttpError(401))).toBe(true)
    expect(isUnauthorizedError(makeHttpError(403))).toBe(false)
    expect(isUnauthorizedError(new Error('nope'))).toBe(false)
  })
})

describe('getHttpErrorStatus', () => {
  it('returns the real HTTP status when present', () => {
    expect(getHttpErrorStatus(makeHttpError(404), 500)).toBe(404)
  })

  it('falls back to the provided default otherwise', () => {
    expect(getHttpErrorStatus(makeHttpError(undefined), 500)).toBe(500)
    expect(getHttpErrorStatus(new Error('nope'), 500)).toBe(500)
  })
})

describe('formatApiErrorDetail', () => {
  it('returns the fallback for a non-http error', () => {
    expect(formatApiErrorDetail(new Error('boom'), 'Une erreur est survenue')).toBe('Une erreur est survenue')
  })

  it('uses the response message when present', () => {
    const error = makeHttpError(422, { message: 'Validation échouée' })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('Validation échouée')
  })

  it('appends field-level validation errors', () => {
    const error = makeHttpError(422, {
      message: 'Validation échouée',
      errors: { email: ['Le champ email est requis'], password: ['Trop court'] },
    })
    expect(formatApiErrorDetail(error, 'fallback')).toBe(
      'Validation échouée — email : Le champ email est requis — password : Trop court',
    )
  })

  it('appends the debug exception message when not already included', () => {
    const error = makeHttpError(500, { message: 'Erreur serveur', debug: { message: 'SQLSTATE[42]' } })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('Erreur serveur — SQLSTATE[42]')
  })

  it('does not duplicate the debug message when it repeats the main message', () => {
    const error = makeHttpError(500, { message: 'boom', debug: { message: 'boom' } })
    expect(formatApiErrorDetail(error, 'fallback')).toBe('boom')
  })

  it('falls back to "fallback (HTTP status)" when there is no usable message', () => {
    const error = makeHttpError(500, {})
    expect(formatApiErrorDetail(error, 'fallback')).toBe('fallback (HTTP 500)')
  })

  it('falls back to the plain fallback when there is no status either', () => {
    const error = makeHttpError(undefined, {})
    expect(formatApiErrorDetail(error, 'fallback')).toBe('fallback')
  })
})

describe('getErrorMessage', () => {
  it('delegates to formatApiErrorDetail', () => {
    const error = makeHttpError(422, { message: 'oops' })
    expect(getErrorMessage(error, 'fallback')).toBe('oops')
  })
})

describe('getValidationErrors', () => {
  it('returns an empty object for a non-422 error', () => {
    expect(getValidationErrors(makeHttpError(500, { errors: { a: ['x'] } }))).toEqual({})
    expect(getValidationErrors(new Error('nope'))).toEqual({})
  })

  it('maps each field to its first error message', () => {
    const error = makeHttpError(422, {
      errors: { email: ['Requis', 'Format invalide'], password: ['Trop court'] },
    })
    expect(getValidationErrors(error)).toEqual({ email: 'Requis', password: 'Trop court' })
  })

  it('falls back to a generic message when a field has no message', () => {
    const error = makeHttpError(422, { errors: { email: [] } })
    expect(getValidationErrors(error)).toEqual({ email: 'Champ invalide' })
  })
})
