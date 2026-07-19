import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppNotificationsStore } from './app-notifications'

describe('useAppNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('push', () => {
    it('adds a notification and returns its id', () => {
      const store = useAppNotificationsStore()

      const id = store.push({ variant: 'success', message: 'Enregistré' })

      expect(store.items).toHaveLength(1)
      expect(store.items[0]).toMatchObject({ id, variant: 'success', message: 'Enregistré' })
    })

    it('defaults to a longer duration for errors than other variants', () => {
      const store = useAppNotificationsStore()

      store.push({ variant: 'error', message: 'Oups' })
      store.push({ variant: 'success', message: 'Ok' })

      expect(store.items[0]!.duration).toBe(8_000)
      expect(store.items[1]!.duration).toBe(5_500)
    })

    it('honors an explicit duration override, including 0 for persistent notifications', () => {
      const store = useAppNotificationsStore()

      store.push({ variant: 'info', message: 'Persistante', duration: 0 })

      expect(store.items[0]!.duration).toBe(0)
    })

    it('evicts the oldest notification once the visible cap is reached', () => {
      const store = useAppNotificationsStore()

      for (let i = 0; i < 7; i++) {
        store.push({ variant: 'info', message: `n${i}` })
      }

      expect(store.items).toHaveLength(6)
      expect(store.items[0]!.message).toBe('n1')
      expect(store.items.at(-1)!.message).toBe('n6')
    })

    it('auto-dismisses after its duration elapses', () => {
      vi.useFakeTimers()
      const store = useAppNotificationsStore()

      store.push({ variant: 'success', message: 'Ok', duration: 1000 })
      expect(store.items).toHaveLength(1)

      vi.advanceTimersByTime(1000)

      expect(store.items).toHaveLength(0)
    })

    it('does not schedule an auto-dismiss timer for a persistent notification', () => {
      vi.useFakeTimers()
      const store = useAppNotificationsStore()

      store.push({ variant: 'success', message: 'Persistante', duration: 0 })
      vi.advanceTimersByTime(100_000)

      expect(store.items).toHaveLength(1)
    })
  })

  describe('dismiss', () => {
    it('removes the notification with the given id', () => {
      const store = useAppNotificationsStore()
      const id = store.push({ variant: 'success', message: 'Ok' })

      store.dismiss(id)

      expect(store.items).toHaveLength(0)
    })

    it('does nothing for an unknown id', () => {
      const store = useAppNotificationsStore()
      store.push({ variant: 'success', message: 'Ok' })

      store.dismiss('unknown-id')

      expect(store.items).toHaveLength(1)
    })

    it('cancels the pending auto-dismiss timer so it does not fire twice', () => {
      vi.useFakeTimers()
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
      const store = useAppNotificationsStore()
      const id = store.push({ variant: 'success', message: 'Ok', duration: 1000 })

      store.dismiss(id)

      expect(clearSpy).toHaveBeenCalled()
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
    })
  })

  describe('clearAll', () => {
    it('removes every notification and their timers', () => {
      vi.useFakeTimers()
      const store = useAppNotificationsStore()
      store.push({ variant: 'success', message: 'a' })
      store.push({ variant: 'error', message: 'b' })

      store.clearAll()

      expect(store.items).toHaveLength(0)
      vi.advanceTimersByTime(10_000)
      expect(store.items).toHaveLength(0)
    })
  })
})
