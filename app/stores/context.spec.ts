import { createPinia, setActivePinia } from 'pinia'
import { nextTick, reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn<(...args: unknown[]) => void>()
const route = reactive<{ query: Record<string, string> }>({ query: {} })

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

import { useContextStore } from './context'

describe('useContextStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    route.query = {}
    push.mockClear()
  })

  describe('initFromUrl (via the immediate route watcher)', () => {
    it('parses numeric, boolean and string query params on setup', () => {
      route.query = { city: 'Paris', count: '42', active: 'true', inactive: 'false' }
      const store = useContextStore()

      expect(store.context).toEqual({ city: 'Paris', count: 42, active: true, inactive: false })
    })

    it('re-parses context whenever the route query changes', async () => {
      const store = useContextStore()
      expect(store.context).toEqual({})

      route.query = { region: 'idf' }
      await nextTick()

      expect(store.context).toEqual({ region: 'idf' })
    })
  })

  describe('setContext / getContext / hasContext', () => {
    it('sets a value, syncs it to the URL, and reads it back', () => {
      const store = useContextStore()

      store.setContext('city', 'Lyon')

      expect(store.getContext('city')).toBe('Lyon')
      expect(store.hasContext('city')).toBe(true)
      expect(push).toHaveBeenCalledWith({ query: { city: 'Lyon' } })
    })

    it('removes the key when set to null', () => {
      const store = useContextStore()
      store.setContext('city', 'Lyon')

      store.setContext('city', null)

      expect(store.hasContext('city')).toBe(false)
    })

    it('returns null for an unset key', () => {
      const store = useContextStore()
      expect(store.getContext('missing')).toBeNull()
    })
  })

  describe('updateContext', () => {
    it('merges updates into the existing context by default', () => {
      const store = useContextStore()
      store.setContext('city', 'Lyon')

      store.updateContext({ region: 'aura' })

      expect(store.context).toEqual({ city: 'Lyon', region: 'aura' })
    })

    it('replaces the whole context when replace is true', () => {
      const store = useContextStore()
      store.setContext('city', 'Lyon')

      store.updateContext({ region: 'aura' }, true)

      expect(store.context).toEqual({ region: 'aura' })
    })

    it('drops null/undefined values from the resulting context', () => {
      const store = useContextStore()
      store.setContext('city', 'Lyon')

      store.updateContext({ city: null as unknown as string, region: 'aura' })

      expect(store.context).toEqual({ region: 'aura' })
    })
  })

  describe('removeContext / clearContext', () => {
    it('removeContext deletes a single key', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon', region: 'aura' })

      store.removeContext('city')

      expect(store.context).toEqual({ region: 'aura' })
    })

    it('clearContext empties the whole context', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon' })

      store.clearContext()

      expect(store.context).toEqual({})
      expect(store.isEmpty).toBe(true)
    })
  })

  describe('computed getters', () => {
    it('contextKeys / contextObject / queryString reflect the current context', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon', count: 3 })

      expect(store.contextKeys).toEqual(['city', 'count'])
      expect(store.contextObject).toEqual({ city: 'Lyon', count: 3 })
      expect(store.queryString).toBe('city=Lyon&count=3')
    })
  })

  describe('replaceTemplateVars / replaceTemplateVarsInObject', () => {
    it('substitutes {{context.key}} placeholders with context values', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon' })

      expect(store.replaceTemplateVars('Météo à {{context.city}}')).toBe('Météo à Lyon')
    })

    it('leaves unknown placeholders untouched', () => {
      const store = useContextStore()
      expect(store.replaceTemplateVars('{{context.missing}}')).toBe('{{context.missing}}')
    })

    it('recursively substitutes placeholders in nested objects and arrays', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon' })

      const result = store.replaceTemplateVarsInObject({
        title: 'Stats {{context.city}}',
        filters: ['{{context.city}}', { label: '{{context.city}}' }],
        count: 5,
      })

      expect(result).toEqual({
        title: 'Stats Lyon',
        filters: ['Lyon', { label: 'Lyon' }],
        count: 5,
      })
    })
  })

  describe('applyContextToFilters', () => {
    it('delegates to replaceTemplateVarsInObject', () => {
      const store = useContextStore()
      store.updateContext({ city: 'Lyon' })

      expect(store.applyContextToFilters({ where: '{{context.city}}' })).toEqual({ where: 'Lyon' })
    })
  })
})
