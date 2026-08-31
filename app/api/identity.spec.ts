import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { startIdentityVerification, fetchIdentityStatus } from './identity'

describe('identity api', () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    mock.restore()
  })

  it('starts a verification with the return path', async () => {
    mock.onPost('/identity/verification/start').reply(200, {
      success: true,
      data: {
        url: 'https://verify.didit.me/en/session/abc',
        status: 'Not Started',
        verified: false,
      },
    })

    const result = await startIdentityVerification('/sondages/mon-sondage')

    expect(result.url).toBe('https://verify.didit.me/en/session/abc')
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual({ return_path: '/sondages/mon-sondage' })
  })

  it('reads the current identity status', async () => {
    mock.onGet('/identity/verification/status').reply(200, {
      success: true,
      data: { status: 'Approved', verified: true, verified_at: '2026-09-02T10:00:00Z' },
    })

    const status = await fetchIdentityStatus()

    expect(status.verified).toBe(true)
    expect(status.status).toBe('Approved')
  })
})
