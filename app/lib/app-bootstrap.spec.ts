import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `useState` is a Nuxt auto-import (SSR-shared ref keyed by name); outside of a Nuxt build it
// doesn't exist, so we stand in a minimal same-process version keyed the same way Nuxt does.
const stateRegistry = new Map<string, ReturnType<typeof ref>>()
const useStateStub = (key: string, init: () => unknown) => {
  if (!stateRegistry.has(key)) {
    stateRegistry.set(key, ref(init()))
  }
  return stateRegistry.get(key)!
}

describe('app-bootstrap', () => {
  beforeEach(() => {
    stateRegistry.clear()
    vi.stubGlobal('useState', useStateStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('useBootstrapError starts out null', async () => {
    const { useBootstrapError } = await import('./app-bootstrap')
    expect(useBootstrapError().value).toBeNull()
  })

  it('setBootstrapError stores the error and clearBootstrapError resets it', async () => {
    const { useBootstrapError, setBootstrapError, clearBootstrapError } = await import('./app-bootstrap')

    setBootstrapError({ title: 'Erreur', message: 'Impossible de charger les données' })
    expect(useBootstrapError().value).toEqual({ title: 'Erreur', message: 'Impossible de charger les données' })

    clearBootstrapError()
    expect(useBootstrapError().value).toBeNull()
  })

  it('shares the same underlying state across calls (SSR-safe singleton per key)', async () => {
    const { useBootstrapError, setBootstrapError } = await import('./app-bootstrap')

    setBootstrapError({ title: 'A', message: 'B' })

    expect(useBootstrapError()).toBe(useBootstrapError())
  })
})
