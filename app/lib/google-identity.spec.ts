import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SCRIPT_SELECTOR = 'script[src="https://accounts.google.com/gsi/client"]'

describe('loadGoogleIdentityScript', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    delete window.google
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('resolves immediately when the Google Identity SDK is already loaded', async () => {
    // @ts-expect-error - minimal test double
    window.google = { accounts: { id: {} } }
    const { loadGoogleIdentityScript } = await import('./google-identity')

    await expect(loadGoogleIdentityScript()).resolves.toBeUndefined()
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull()
  })

  it('injects the script tag and resolves once it loads', async () => {
    const { loadGoogleIdentityScript } = await import('./google-identity')

    const promise = loadGoogleIdentityScript()
    const script = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR)
    expect(script).not.toBeNull()

    script!.dispatchEvent(new Event('load'))

    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects when the script fails to load', async () => {
    const { loadGoogleIdentityScript } = await import('./google-identity')

    const promise = loadGoogleIdentityScript()
    const script = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR)

    script!.dispatchEvent(new Event('error'))

    await expect(promise).rejects.toThrow('Impossible de charger Google Identity Services.')
  })

  it('reuses the pending promise instead of injecting a second script tag', async () => {
    const { loadGoogleIdentityScript } = await import('./google-identity')

    const first = loadGoogleIdentityScript()
    const second = loadGoogleIdentityScript()

    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1)
    expect(first).toBe(second)

    document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR)!.dispatchEvent(new Event('load'))
    await first
  })

  it('attaches to an already-present script tag instead of adding a duplicate', async () => {
    const existing = document.createElement('script')
    existing.src = 'https://accounts.google.com/gsi/client'
    document.head.appendChild(existing)

    const { loadGoogleIdentityScript } = await import('./google-identity')
    const promise = loadGoogleIdentityScript()

    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1)

    existing.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects when called outside a browser environment', async () => {
    const originalWindow = globalThis.window
    // @ts-expect-error - simulate SSR
    delete globalThis.window
    vi.resetModules()

    const { loadGoogleIdentityScript } = await import('./google-identity')

    await expect(loadGoogleIdentityScript()).rejects.toThrow(
      "Google Identity Services n'est pas disponible côté serveur.",
    )

    globalThis.window = originalWindow
  })
})
