import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { submitContactMessage } from './contact'

describe('contact api', () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    mock.restore()
  })

  it('posts the payload to /contact', async () => {
    mock.onPost('/contact').reply(201, { success: true })

    await submitContactMessage({
      reason: 'general',
      name: 'Jeanne Dupont',
      email: 'jeanne@example.com',
      message: 'Une question sur Statsio.',
      turnstile_token: 'test-token',
    })

    expect(mock.history.post).toHaveLength(1)
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual({
      reason: 'general',
      name: 'Jeanne Dupont',
      email: 'jeanne@example.com',
      message: 'Une question sur Statsio.',
      turnstile_token: 'test-token',
    })
  })

  it('propagates errors from the API', async () => {
    mock.onPost('/contact').reply(422, { message: 'Validation failed' })

    await expect(
      submitContactMessage({
        reason: 'general',
        name: '',
        email: '',
        message: '',
        turnstile_token: 'test-token',
      }),
    ).rejects.toThrow('Request failed with status code 422')
  })
})
