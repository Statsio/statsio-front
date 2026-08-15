import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useStudioStore } from '@/stores/studio'
import { useStudioAutosave } from './useStudioAutosave'
import { saveStatsDataDocument } from '@/api/studio'

vi.mock('@/api/studio', () => ({
  saveStatsDataDocument: vi.fn<typeof saveStatsDataDocument>(),
}))

const DEBOUNCE_MS = 1500

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useStudioAutosave', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(saveStatsDataDocument).mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scheduleAutosave no-ops (never saves) when content.id is missing', async () => {
    const studio = useStudioStore()
    useStudioAutosave()
    studio.markDirty()

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 100)

    expect(saveStatsDataDocument).not.toHaveBeenCalled()
  })

  it('scheduleAutosave no-ops when content.id is "demo"', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'demo', type: 'statsdata', title: 't' }
    useStudioAutosave()
    studio.markDirty()

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 100)

    expect(saveStatsDataDocument).not.toHaveBeenCalled()
  })

  it('scheduleAutosave no-ops when isDirty is false', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    useStudioAutosave()

    studio.isDirty = false
    studio.dirtyVersion++ // triggers the watcher without going through markDirty()

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 100)

    expect(saveStatsDataDocument).not.toHaveBeenCalled()
  })

  it('debounces: two markDirty calls within DEBOUNCE_MS trigger only one persist', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    vi.mocked(saveStatsDataDocument).mockResolvedValue({ id: 'doc-1' } as never)
    useStudioAutosave()

    studio.markDirty()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 200)
    studio.markDirty() // resets the debounce timer
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 200)
    expect(saveStatsDataDocument).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(300)
    expect(saveStatsDataDocument).toHaveBeenCalledTimes(1)
  })

  it('persist(): sets status "saved" when dirtyVersion is unchanged during the save', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    vi.mocked(saveStatsDataDocument).mockResolvedValue({ id: 'doc-1' } as never)
    useStudioAutosave()

    studio.markDirty()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(studio.saveStatus).toBe('saved')
    expect(studio.isDirty).toBe(false)
  })

  it('persist(): stays dirty and reschedules when dirtyVersion changes during the in-flight save', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    const save = deferred<{ id: string }>()
    vi.mocked(saveStatsDataDocument).mockReturnValue(save.promise as never)
    useStudioAutosave()

    studio.markDirty()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    expect(studio.saveStatus).toBe('saving')

    // A new change arrives while the save is still in flight.
    studio.markDirty()
    save.resolve({ id: 'doc-1' })
    await vi.advanceTimersByTimeAsync(0)

    expect(studio.saveStatus).toBe('idle')

    // The reschedule should trigger a second save after another debounce window.
    vi.mocked(saveStatsDataDocument).mockResolvedValue({ id: 'doc-1' } as never)
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    expect(saveStatsDataDocument).toHaveBeenCalledTimes(2)
  })

  it('persist(): sets status "error" and retries after 5000ms on failure', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    vi.mocked(saveStatsDataDocument).mockRejectedValueOnce(new Error('network'))
    useStudioAutosave()

    studio.markDirty()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(studio.saveStatus).toBe('error')
    expect(saveStatsDataDocument).toHaveBeenCalledTimes(1)

    vi.mocked(saveStatsDataDocument).mockResolvedValue({ id: 'doc-1' } as never)
    await vi.advanceTimersByTimeAsync(5000)
    expect(saveStatsDataDocument).toHaveBeenCalledTimes(2)
  })

  it('saveNow(): cancels the pending debounce and persists immediately', async () => {
    const studio = useStudioStore()
    studio.content = { id: 'doc-1', type: 'statsdata', title: 't' }
    vi.mocked(saveStatsDataDocument).mockResolvedValue({ id: 'doc-1' } as never)
    const { saveNow } = useStudioAutosave()

    studio.markDirty() // schedules a save DEBOUNCE_MS from now
    await nextTick() // let the dirtyVersion watcher actually schedule the debounce timer
    await saveNow()

    expect(saveStatsDataDocument).toHaveBeenCalledTimes(1)
    expect(studio.saveStatus).toBe('saved')

    // The original debounced call must have been cancelled — advancing past it
    // should not trigger a second save.
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 100)
    expect(saveStatsDataDocument).toHaveBeenCalledTimes(1)
  })
})
